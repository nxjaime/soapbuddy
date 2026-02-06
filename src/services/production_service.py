"""
Production Service

Handles batch production operations, inventory deduction, and lot tracking.
"""
from sqlalchemy.orm import Session
from src.models.models import ProductionBatch, BatchIngredientUsage, Recipe, Ingredient
from src.services.recipe_service import RecipeService
from datetime import datetime, timedelta
from typing import Optional


class ProductionService:
    """
    Service layer for managing production batches.
    """
    
    # Status constants
    STATUS_PLANNED = "Planned"
    STATUS_IN_PROGRESS = "In Progress"
    STATUS_CURING = "Curing"
    STATUS_COMPLETE = "Complete"
    STATUS_CANCELLED = "Cancelled"
    
    STATUSES = [STATUS_PLANNED, STATUS_IN_PROGRESS, STATUS_CURING, STATUS_COMPLETE, STATUS_CANCELLED]
    
    # Default cure time in days
    DEFAULT_CURE_DAYS = 28
    
    def __init__(self, db: Session):
        self.db = db
        self.recipe_service = RecipeService(db)
    
    def get_all(self, status: Optional[str] = None) -> list[ProductionBatch]:
        """Get all batches, optionally filtered by status."""
        query = self.db.query(ProductionBatch)
        if status:
            query = query.filter(ProductionBatch.status == status)
        return query.order_by(ProductionBatch.created_at.desc()).all()
    
    def get_by_id(self, batch_id: int) -> Optional[ProductionBatch]:
        """Get a single batch by ID."""
        return self.db.query(ProductionBatch).filter(ProductionBatch.id == batch_id).first()
    
    def get_by_lot_number(self, lot_number: str) -> Optional[ProductionBatch]:
        """Get a batch by lot number."""
        return self.db.query(ProductionBatch).filter(ProductionBatch.lot_number == lot_number).first()
    
    def generate_lot_number(self, recipe_id: int) -> str:
        """Generate a unique lot number based on recipe and date."""
        today = datetime.now()
        date_part = today.strftime("%Y%m%d")
        
        # Count existing batches today for this recipe
        count = self.db.query(ProductionBatch).filter(
            ProductionBatch.lot_number.like(f"LOT-{date_part}-%")
        ).count()
        
        return f"LOT-{date_part}-{count + 1:03d}"
    
    def create_batch(self, recipe_id: int, scale_factor: float = 1.0,
                     planned_date: datetime = None, notes: str = None) -> ProductionBatch:
        """
        Create a new production batch from a recipe.
        Does NOT deduct inventory yet (call start_production for that).
        """
        lot_number = self.generate_lot_number(recipe_id)
        
        # Calculate batch details
        calc = self.recipe_service.calculate_recipe(recipe_id)
        scaled = self.recipe_service.scale_recipe(recipe_id, scale_factor)
        
        total_weight = scaled.get("scaled_oils_weight", 0) + \
                       scaled.get("lye_amount", 0) + \
                       scaled.get("water_amount", 0)
        
        # Calculate total cost
        total_cost = calc.get("total_ingredient_cost", 0) * scale_factor
        
        batch = ProductionBatch(
            lot_number=lot_number,
            recipe_id=recipe_id,
            scale_factor=scale_factor,
            total_weight=total_weight,
            total_cost=total_cost,
            status=self.STATUS_PLANNED,
            planned_date=planned_date or datetime.now(),
            notes=notes
        )
        
        self.db.add(batch)
        self.db.commit()
        self.db.refresh(batch)
        
        # Record planned ingredient usage
        self._record_ingredient_usage(batch.id, recipe_id, scale_factor)
        
        return batch
    
    def _record_ingredient_usage(self, batch_id: int, recipe_id: int, scale_factor: float):
        """Record planned ingredient usage for a batch."""
        recipe = self.recipe_service.get_by_id(recipe_id)
        
        for ri in recipe.ingredients:
            usage = BatchIngredientUsage(
                batch_id=batch_id,
                ingredient_id=ri.ingredient_id,
                planned_quantity=ri.quantity * scale_factor,
                unit=ri.unit,
                cost=ri.quantity * scale_factor * ri.ingredient.cost_per_unit
            )
            self.db.add(usage)
        
        self.db.commit()
    
    def start_production(self, batch_id: int) -> tuple[bool, str]:
        """
        Start production for a batch.
        - Deducts inventory
        - Sets status to In Progress
        - Records production date
        
        Returns (success, message).
        """
        batch = self.get_by_id(batch_id)
        if not batch:
            return False, "Batch not found"
        
        if batch.status != self.STATUS_PLANNED:
            return False, f"Cannot start batch in '{batch.status}' status"
        
        # Check inventory availability
        insufficient = self._check_inventory(batch_id)
        if insufficient:
            items = ", ".join([f"{name} (need {need:.2f}, have {have:.2f})" 
                              for name, need, have in insufficient])
            return False, f"Insufficient inventory: {items}"
        
        # Deduct inventory
        self._deduct_inventory(batch_id)
        
        # Update batch status
        batch.status = self.STATUS_IN_PROGRESS
        batch.production_date = datetime.now()
        self.db.commit()
        
        return True, f"Production started for lot {batch.lot_number}"
    
    def _check_inventory(self, batch_id: int) -> list[tuple[str, float, float]]:
        """Check if all ingredients are available. Returns list of insufficient items."""
        insufficient = []
        
        usages = self.db.query(BatchIngredientUsage).filter(
            BatchIngredientUsage.batch_id == batch_id
        ).all()
        
        for usage in usages:
            ingredient = self.db.query(Ingredient).filter(
                Ingredient.id == usage.ingredient_id
            ).first()
            
            if ingredient and ingredient.quantity_on_hand < usage.planned_quantity:
                insufficient.append((
                    ingredient.name,
                    usage.planned_quantity,
                    ingredient.quantity_on_hand
                ))
        
        return insufficient
    
    def _deduct_inventory(self, batch_id: int):
        """Deduct ingredients from inventory."""
        usages = self.db.query(BatchIngredientUsage).filter(
            BatchIngredientUsage.batch_id == batch_id
        ).all()
        
        for usage in usages:
            ingredient = self.db.query(Ingredient).filter(
                Ingredient.id == usage.ingredient_id
            ).first()
            
            if ingredient:
                ingredient.quantity_on_hand -= usage.planned_quantity
                usage.actual_quantity = usage.planned_quantity
        
        self.db.commit()
    
    def move_to_curing(self, batch_id: int, cure_days: int = None) -> tuple[bool, str]:
        """Move batch to curing status and set cure end date."""
        batch = self.get_by_id(batch_id)
        if not batch:
            return False, "Batch not found"
        
        if batch.status != self.STATUS_IN_PROGRESS:
            return False, f"Cannot cure batch in '{batch.status}' status"
        
        cure_days = cure_days or self.DEFAULT_CURE_DAYS
        batch.status = self.STATUS_CURING
        batch.cure_end_date = datetime.now() + timedelta(days=cure_days)
        self.db.commit()
        
        return True, f"Batch moved to curing (ready in {cure_days} days)"
    
    def complete_batch(self, batch_id: int) -> tuple[bool, str]:
        """Mark batch as complete."""
        batch = self.get_by_id(batch_id)
        if not batch:
            return False, "Batch not found"
        
        if batch.status not in [self.STATUS_CURING, self.STATUS_IN_PROGRESS]:
            return False, f"Cannot complete batch in '{batch.status}' status"
        
        batch.status = self.STATUS_COMPLETE
        self.db.commit()
        
        return True, f"Batch {batch.lot_number} marked complete"
    
    def cancel_batch(self, batch_id: int, restore_inventory: bool = False) -> tuple[bool, str]:
        """
        Cancel a batch.
        If restore_inventory is True and production has started, return ingredients.
        """
        batch = self.get_by_id(batch_id)
        if not batch:
            return False, "Batch not found"
        
        if batch.status == self.STATUS_COMPLETE:
            return False, "Cannot cancel completed batch"
        
        # Restore inventory if production had started
        if restore_inventory and batch.production_date:
            self._restore_inventory(batch_id)
        
        batch.status = self.STATUS_CANCELLED
        self.db.commit()
        
        return True, f"Batch {batch.lot_number} cancelled"
    
    def _restore_inventory(self, batch_id: int):
        """Restore ingredients to inventory."""
        usages = self.db.query(BatchIngredientUsage).filter(
            BatchIngredientUsage.batch_id == batch_id
        ).all()
        
        for usage in usages:
            if usage.actual_quantity:
                ingredient = self.db.query(Ingredient).filter(
                    Ingredient.id == usage.ingredient_id
                ).first()
                
                if ingredient:
                    ingredient.quantity_on_hand += usage.actual_quantity
        
        self.db.commit()
    
    def get_batch_summary(self, batch_id: int) -> dict:
        """Get detailed summary of a batch."""
        batch = self.get_by_id(batch_id)
        if not batch:
            return {}
        
        usages = self.db.query(BatchIngredientUsage).filter(
            BatchIngredientUsage.batch_id == batch_id
        ).all()
        
        ingredients = []
        for usage in usages:
            ingredients.append({
                "name": usage.ingredient.name if usage.ingredient else "Unknown",
                "planned": usage.planned_quantity,
                "actual": usage.actual_quantity,
                "unit": usage.unit,
                "cost": usage.cost
            })
        
        return {
            "id": batch.id,
            "lot_number": batch.lot_number,
            "recipe_name": batch.recipe.name if batch.recipe else "Unknown",
            "status": batch.status,
            "scale_factor": batch.scale_factor,
            "total_weight": batch.total_weight,
            "total_cost": batch.total_cost,
            "planned_date": batch.planned_date,
            "production_date": batch.production_date,
            "cure_end_date": batch.cure_end_date,
            "notes": batch.notes,
            "ingredients": ingredients
        }
    
    def get_curing_batches(self) -> list[ProductionBatch]:
        """Get all batches currently curing."""
        return self.db.query(ProductionBatch).filter(
            ProductionBatch.status == self.STATUS_CURING
        ).order_by(ProductionBatch.cure_end_date).all()
    
    def get_ready_batches(self) -> list[ProductionBatch]:
        """Get curing batches that are ready (cure date passed)."""
        now = datetime.now()
        return self.db.query(ProductionBatch).filter(
            ProductionBatch.status == self.STATUS_CURING,
            ProductionBatch.cure_end_date <= now
        ).all()
