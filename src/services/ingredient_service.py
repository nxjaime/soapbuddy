"""
Ingredient Service

Handles CRUD operations for ingredients.
"""
from sqlalchemy.orm import Session
from src.models.models import Ingredient
from typing import Optional


class IngredientService:
    """
    Service layer for managing ingredients.
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_all(self, category: Optional[str] = None) -> list[Ingredient]:
        """Get all ingredients, optionally filtered by category."""
        query = self.db.query(Ingredient)
        if category:
            query = query.filter(Ingredient.category == category)
        return query.order_by(Ingredient.name).all()
    
    def get_by_id(self, ingredient_id: int) -> Optional[Ingredient]:
        """Get a single ingredient by ID."""
        return self.db.query(Ingredient).filter(Ingredient.id == ingredient_id).first()
    
    def create(self, **kwargs) -> Ingredient:
        """Create a new ingredient."""
        ingredient = Ingredient(**kwargs)
        self.db.add(ingredient)
        self.db.commit()
        self.db.refresh(ingredient)
        return ingredient
    
    def update(self, ingredient_id: int, **kwargs) -> Optional[Ingredient]:
        """Update an existing ingredient."""
        ingredient = self.get_by_id(ingredient_id)
        if ingredient:
            for key, value in kwargs.items():
                if hasattr(ingredient, key):
                    setattr(ingredient, key, value)
            self.db.commit()
            self.db.refresh(ingredient)
        return ingredient
    
    def delete(self, ingredient_id: int) -> bool:
        """Delete an ingredient."""
        ingredient = self.get_by_id(ingredient_id)
        if ingredient:
            self.db.delete(ingredient)
            self.db.commit()
            return True
        return False
    
    def search(self, query: str) -> list[Ingredient]:
        """Search ingredients by name."""
        return self.db.query(Ingredient).filter(
            Ingredient.name.ilike(f"%{query}%")
        ).order_by(Ingredient.name).all()
    
    def get_low_stock(self, threshold: float = 100) -> list[Ingredient]:
        """Get ingredients below a stock threshold."""
        return self.db.query(Ingredient).filter(
            Ingredient.quantity_on_hand < threshold
        ).order_by(Ingredient.quantity_on_hand).all()
    
    def adjust_stock(self, ingredient_id: int, quantity_change: float) -> Optional[Ingredient]:
        """
        Adjust ingredient stock by a given amount (positive or negative).
        """
        ingredient = self.get_by_id(ingredient_id)
        if ingredient:
            ingredient.quantity_on_hand += quantity_change
            if ingredient.quantity_on_hand < 0:
                ingredient.quantity_on_hand = 0
            self.db.commit()
            self.db.refresh(ingredient)
        return ingredient
