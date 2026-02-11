"""
Reports Service

Data aggregation and report generation.
"""
from sqlalchemy.orm import Session
from sqlalchemy import func
from src.models.models import Ingredient, Recipe, ProductionBatch, RecipeIngredient, BatchIngredientUsage
from src.services.recipe_service import RecipeService
from datetime import datetime, timedelta
from typing import Optional
import csv
import os


class ReportsService:
    """
    Service for generating reports and analytics.
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.recipe_service = RecipeService(db)
    
    # ==================== Inventory Reports ====================
    
    def get_inventory_summary(self) -> dict:
        """Get overall inventory summary."""
        ingredients = self.db.query(Ingredient).all()
        
        total_value = sum(i.quantity_on_hand * i.cost_per_unit for i in ingredients)
        categories = {}
        
        for ing in ingredients:
            if ing.category not in categories:
                categories[ing.category] = {"count": 0, "value": 0}
            categories[ing.category]["count"] += 1
            categories[ing.category]["value"] += ing.quantity_on_hand * ing.cost_per_unit
        
        return {
            "total_ingredients": len(ingredients),
            "total_value": total_value,
            "by_category": categories
        }
    
    def get_low_stock_items(self, threshold_percent: float = 20) -> list[dict]:
        """
        Get items that are low on stock.
        Uses a simple threshold: items with less than threshold_percent of 1000g.
        """
        low_stock = []
        ingredients = self.db.query(Ingredient).all()
        
        for ing in ingredients:
            # Consider low if less than 100g (or 100 units)
            threshold = 100
            if ing.quantity_on_hand < threshold and ing.quantity_on_hand >= 0:
                low_stock.append({
                    "id": ing.id,
                    "name": ing.name,
                    "category": ing.category,
                    "quantity": ing.quantity_on_hand,
                    "unit": ing.unit,
                    "status": "Out of Stock" if ing.quantity_on_hand <= 0 else "Low Stock"
                })
        
        return sorted(low_stock, key=lambda x: x["quantity"])
    
    def get_inventory_by_category(self) -> list[dict]:
        """Get inventory grouped by category."""
        results = self.db.query(
            Ingredient.category,
            func.count(Ingredient.id).label("count"),
            func.sum(Ingredient.quantity_on_hand).label("total_quantity"),
            func.sum(Ingredient.quantity_on_hand * Ingredient.cost_per_unit).label("total_value")
        ).group_by(Ingredient.category).all()
        
        return [
            {
                "category": r.category,
                "count": r.count,
                "total_quantity": r.total_quantity or 0,
                "total_value": r.total_value or 0
            }
            for r in results
        ]
    
    # ==================== Production Reports ====================
    
    def get_production_summary(self, days: int = 30) -> dict:
        """Get production summary for the last N days."""
        cutoff = datetime.now() - timedelta(days=days)
        
        batches = self.db.query(ProductionBatch).filter(
            ProductionBatch.created_at >= cutoff
        ).all()
        
        status_counts = {}
        total_weight = 0
        total_cost = 0
        
        for batch in batches:
            status_counts[batch.status] = status_counts.get(batch.status, 0) + 1
            total_weight += batch.total_weight or 0
            total_cost += batch.total_cost or 0
        
        return {
            "period_days": days,
            "total_batches": len(batches),
            "by_status": status_counts,
            "total_weight": total_weight,
            "total_cost": total_cost
        }
    
    def get_production_history(self, limit: int = 50) -> list[dict]:
        """Get recent production history."""
        batches = self.db.query(ProductionBatch).order_by(
            ProductionBatch.created_at.desc()
        ).limit(limit).all()
        
        return [
            {
                "lot_number": b.lot_number,
                "recipe_name": b.recipe.name if b.recipe else "Unknown",
                "status": b.status,
                "scale": b.scale_factor,
                "weight": b.total_weight,
                "cost": b.total_cost,
                "created": b.created_at,
                "production_date": b.production_date,
                "cure_end": b.cure_end_date
            }
            for b in batches
        ]
    
    def get_batches_by_recipe(self) -> list[dict]:
        """Get batch counts grouped by recipe."""
        results = self.db.query(
            Recipe.name,
            func.count(ProductionBatch.id).label("batch_count"),
            func.sum(ProductionBatch.total_weight).label("total_weight"),
            func.sum(ProductionBatch.total_cost).label("total_cost")
        ).join(ProductionBatch, Recipe.id == ProductionBatch.recipe_id
        ).group_by(Recipe.id).order_by(func.count(ProductionBatch.id).desc()).all()
        
        return [
            {
                "recipe": r.name,
                "batches": r.batch_count,
                "total_weight": r.total_weight or 0,
                "total_cost": r.total_cost or 0
            }
            for r in results
        ]
    
    # ==================== Cost Reports ====================
    
    def get_recipe_costs(self) -> list[dict]:
        """Get cost breakdown for all recipes."""
        recipes = self.db.query(Recipe).all()
        
        results = []
        for recipe in recipes:
            calc = self.recipe_service.calculate_recipe(recipe.id)
            results.append({
                "id": recipe.id,
                "name": recipe.name,
                "type": recipe.recipe_type,
                "ingredient_cost": calc.get("total_ingredient_cost", 0),
                "total_weight": calc.get("total_batch_weight", 0),
                "cost_per_100g": (calc.get("total_ingredient_cost", 0) / 
                                  max(calc.get("total_batch_weight", 1), 1)) * 100
            })
        
        return sorted(results, key=lambda x: x["ingredient_cost"], reverse=True)
    
    def get_ingredient_usage(self, days: int = 30) -> list[dict]:
        """Get ingredient usage over the last N days."""
        cutoff = datetime.now() - timedelta(days=days)
        
        results = self.db.query(
            Ingredient.name,
            Ingredient.category,
            func.sum(BatchIngredientUsage.actual_quantity).label("used"),
            func.sum(BatchIngredientUsage.cost).label("cost")
        ).join(BatchIngredientUsage, Ingredient.id == BatchIngredientUsage.ingredient_id
        ).join(ProductionBatch, BatchIngredientUsage.batch_id == ProductionBatch.id
        ).filter(ProductionBatch.production_date >= cutoff
        ).group_by(Ingredient.id).order_by(
            func.sum(BatchIngredientUsage.actual_quantity).desc()
        ).all()
        
        return [
            {
                "name": r.name,
                "category": r.category,
                "quantity_used": r.used or 0,
                "total_cost": r.cost or 0
            }
            for r in results
        ]
    
    # ==================== Dashboard Stats ====================
    
    def get_dashboard_stats(self) -> dict:
        """Get quick stats for the dashboard."""
        ingredients_count = self.db.query(func.count(Ingredient.id)).scalar()
        recipes_count = self.db.query(func.count(Recipe.id)).scalar()
        batches_count = self.db.query(func.count(ProductionBatch.id)).scalar()
        
        # Curing batches ready
        ready_batches = self.db.query(func.count(ProductionBatch.id)).filter(
            ProductionBatch.status == "Curing",
            ProductionBatch.cure_end_date <= datetime.now()
        ).scalar()
        
        # Low stock count
        low_stock = len(self.get_low_stock_items())
        
        return {
            "ingredients": ingredients_count,
            "recipes": recipes_count,
            "batches": batches_count,
            "ready_batches": ready_batches,
            "low_stock_items": low_stock
        }
    
    # ==================== Export ====================
    
    def export_to_csv(self, data: list[dict], filepath: str) -> bool:
        """Export data to CSV file."""
        if not data:
            return False
        
        try:
            with open(filepath, 'w', newline='') as f:
                writer = csv.DictWriter(f, fieldnames=data[0].keys())
                writer.writeheader()
                writer.writerows(data)
            return True
        except Exception:
            return False
