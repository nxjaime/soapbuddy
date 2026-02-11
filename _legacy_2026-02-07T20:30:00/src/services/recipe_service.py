"""
Recipe Service

Handles CRUD operations for recipes and cost calculations.
"""
from sqlalchemy.orm import Session
from src.models.models import Recipe, RecipeIngredient, Ingredient
from src.services.lye_calculator import LyeCalculator
from typing import Optional


class RecipeService:
    """
    Service layer for managing recipes.
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_all(self, recipe_type: Optional[str] = None) -> list[Recipe]:
        """Get all recipes, optionally filtered by type."""
        query = self.db.query(Recipe)
        if recipe_type:
            query = query.filter(Recipe.recipe_type == recipe_type)
        return query.order_by(Recipe.name).all()
    
    def get_by_id(self, recipe_id: int) -> Optional[Recipe]:
        """Get a single recipe by ID with its ingredients."""
        return self.db.query(Recipe).filter(Recipe.id == recipe_id).first()
    
    def create(self, name: str, description: str = None, recipe_type: str = "Soap",
               lye_type: str = "NaOH", superfat_percentage: float = 5.0,
               water_percentage: float = 33.0, total_oils_weight: float = 0,
               unit: str = "g", notes: str = None) -> Recipe:
        """Create a new recipe."""
        recipe = Recipe(
            name=name,
            description=description,
            recipe_type=recipe_type,
            lye_type=lye_type,
            superfat_percentage=superfat_percentage,
            water_percentage=water_percentage,
            total_oils_weight=total_oils_weight,
            unit=unit,
            notes=notes
        )
        self.db.add(recipe)
        self.db.commit()
        self.db.refresh(recipe)
        return recipe
    
    def update(self, recipe_id: int, **kwargs) -> Optional[Recipe]:
        """Update an existing recipe."""
        recipe = self.get_by_id(recipe_id)
        if recipe:
            for key, value in kwargs.items():
                if hasattr(recipe, key) and key != 'id':
                    setattr(recipe, key, value)
            self.db.commit()
            self.db.refresh(recipe)
        return recipe
    
    def delete(self, recipe_id: int) -> bool:
        """Delete a recipe and its ingredients."""
        recipe = self.get_by_id(recipe_id)
        if recipe:
            self.db.delete(recipe)
            self.db.commit()
            return True
        return False
    
    def add_ingredient(self, recipe_id: int, ingredient_id: int, 
                       quantity: float, unit: str = "g") -> RecipeIngredient:
        """Add an ingredient to a recipe."""
        recipe_ingredient = RecipeIngredient(
            recipe_id=recipe_id,
            ingredient_id=ingredient_id,
            quantity=quantity,
            unit=unit
        )
        self.db.add(recipe_ingredient)
        self.db.commit()
        self.db.refresh(recipe_ingredient)
        
        # Update total oils weight
        self._update_total_oils(recipe_id)
        
        return recipe_ingredient
    
    def remove_ingredient(self, recipe_ingredient_id: int) -> bool:
        """Remove an ingredient from a recipe."""
        ri = self.db.query(RecipeIngredient).filter(
            RecipeIngredient.id == recipe_ingredient_id
        ).first()
        if ri:
            recipe_id = ri.recipe_id
            self.db.delete(ri)
            self.db.commit()
            self._update_total_oils(recipe_id)
            return True
        return False
    
    def update_ingredient_quantity(self, recipe_ingredient_id: int, 
                                   quantity: float) -> Optional[RecipeIngredient]:
        """Update the quantity of an ingredient in a recipe."""
        ri = self.db.query(RecipeIngredient).filter(
            RecipeIngredient.id == recipe_ingredient_id
        ).first()
        if ri:
            ri.quantity = quantity
            self.db.commit()
            self._update_total_oils(ri.recipe_id)
            return ri
        return None
    
    def _update_total_oils(self, recipe_id: int):
        """Recalculate total oils weight for a recipe."""
        recipe = self.get_by_id(recipe_id)
        if recipe:
            total = sum(
                ri.quantity for ri in recipe.ingredients 
                if ri.ingredient and ri.ingredient.category in ["Base Oil", "Butter"]
            )
            recipe.total_oils_weight = total
            self.db.commit()
    
    def calculate_recipe(self, recipe_id: int) -> dict:
        """
        Calculate full recipe details including lye, water, and costs.
        """
        recipe = self.get_by_id(recipe_id)
        if not recipe:
            return {}
        
        # Prepare oils for lye calculation
        oils = []
        total_ingredient_cost = 0.0
        ingredient_breakdown = []
        
        for ri in recipe.ingredients:
            ing = ri.ingredient
            if not ing:
                continue
            
            # Calculate cost for this ingredient
            ingredient_cost = ri.quantity * ing.cost_per_unit
            total_ingredient_cost += ingredient_cost
            
            ingredient_breakdown.append({
                "name": ing.name,
                "category": ing.category,
                "quantity": ri.quantity,
                "unit": ri.unit,
                "cost_per_unit": ing.cost_per_unit,
                "total_cost": round(ingredient_cost, 4),
            })
            
            # If it's an oil/butter, add to lye calculation
            if ing.category in ["Base Oil", "Butter"] and ing.sap_naoh:
                oils.append({
                    "name": ing.name,
                    "weight": ri.quantity,
                    "sap_naoh": ing.sap_naoh,
                    "sap_koh": ing.sap_koh,
                })
        
        # Calculate lye requirements
        lye_result = {}
        if oils:
            lye_result = LyeCalculator.calculate_lye(
                oils, 
                recipe.lye_type, 
                recipe.superfat_percentage
            )
        
        # Calculate water
        water_amount = 0.0
        if lye_result.get("lye_amount"):
            water_amount = lye_result["lye_amount"] * 2  # 2:1 ratio default
        
        return {
            "recipe": {
                "id": recipe.id,
                "name": recipe.name,
                "description": recipe.description,
                "recipe_type": recipe.recipe_type,
                "lye_type": recipe.lye_type,
                "superfat_percentage": recipe.superfat_percentage,
            },
            "ingredients": ingredient_breakdown,
            "total_oils_weight": recipe.total_oils_weight,
            "lye_calculation": lye_result,
            "water_amount": round(water_amount, 2),
            "total_ingredient_cost": round(total_ingredient_cost, 4),
            "total_batch_weight": round(
                recipe.total_oils_weight + 
                lye_result.get("lye_amount", 0) + 
                water_amount, 2
            ),
        }
    
    def scale_recipe(self, recipe_id: int, scale_factor: float) -> dict:
        """
        Scale a recipe by a given factor.
        Returns the scaled calculation without saving.
        """
        recipe = self.get_by_id(recipe_id)
        if not recipe:
            return {}
        
        scaled_ingredients = []
        for ri in recipe.ingredients:
            scaled_ingredients.append({
                "name": ri.ingredient.name if ri.ingredient else "Unknown",
                "original_quantity": ri.quantity,
                "scaled_quantity": round(ri.quantity * scale_factor, 2),
                "unit": ri.unit,
            })
        
        # Calculate lye for scaled recipe
        oils = []
        for ri in recipe.ingredients:
            ing = ri.ingredient
            if ing and ing.category in ["Base Oil", "Butter"] and ing.sap_naoh:
                oils.append({
                    "name": ing.name,
                    "weight": ri.quantity * scale_factor,
                    "sap_naoh": ing.sap_naoh,
                })
        
        lye_result = LyeCalculator.calculate_lye(
            oils, recipe.lye_type, recipe.superfat_percentage
        ) if oils else {}
        
        water_amount = lye_result.get("lye_amount", 0) * 2
        
        return {
            "scale_factor": scale_factor,
            "original_oils_weight": recipe.total_oils_weight,
            "scaled_oils_weight": round(recipe.total_oils_weight * scale_factor, 2),
            "scaled_ingredients": scaled_ingredients,
            "lye_amount": lye_result.get("lye_amount", 0),
            "water_amount": round(water_amount, 2),
        }
    
    def clone_recipe(self, recipe_id: int, new_name: str) -> Optional[Recipe]:
        """Clone an existing recipe with a new name."""
        original = self.get_by_id(recipe_id)
        if not original:
            return None
        
        # Create new recipe
        new_recipe = self.create(
            name=new_name,
            description=original.description,
            recipe_type=original.recipe_type,
            lye_type=original.lye_type,
            superfat_percentage=original.superfat_percentage,
            water_percentage=original.water_percentage,
            unit=original.unit,
            notes=original.notes,
        )
        
        # Clone ingredients
        for ri in original.ingredients:
            self.add_ingredient(
                new_recipe.id,
                ri.ingredient_id,
                ri.quantity,
                ri.unit
            )
        
        return new_recipe
