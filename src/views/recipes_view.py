"""
Recipes View

Main widget for managing soap recipes.
Coordinates RecipeListPanel and RecipeDetailPanel components.
"""
from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QPushButton, QLabel,
    QMessageBox, QSplitter
)
from PySide6.QtCore import Qt
from src.views.components.recipe_list_panel import RecipeListPanel
from src.views.components.recipe_detail_panel import RecipeDetailPanel
from src.views.recipe_dialog import RecipeDialog
from src.services.recipe_service import RecipeService
from src.services.ingredient_service import IngredientService
from src.database.db import SessionLocal


class RecipesView(QWidget):
    """
    Main recipes management view - coordinates list and detail panels.
    """
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.db = SessionLocal()
        self.recipe_service = RecipeService(self.db)
        self.ingredient_service = IngredientService(self.db)
        self.setup_ui()
        self.connect_signals()
        self.load_data()
    
    def setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(24, 24, 24, 24)
        layout.setSpacing(16)
        
        # Header
        header_layout = QHBoxLayout()
        
        title = QLabel("📝 Recipes")
        title.setStyleSheet("font-size: 24px; font-weight: 700;")
        header_layout.addWidget(title)
        
        header_layout.addStretch()
        
        self.add_btn = QPushButton("+ New Recipe")
        self.add_btn.clicked.connect(self.add_recipe)
        header_layout.addWidget(self.add_btn)
        
        layout.addLayout(header_layout)
        
        # Splitter - List on left, Detail on right
        splitter = QSplitter(Qt.Horizontal)
        
        # Left Panel - Recipe List
        self.list_panel = RecipeListPanel(self)
        splitter.addWidget(self.list_panel)
        
        # Right Panel - Recipe Detail
        self.detail_panel = RecipeDetailPanel(self)
        splitter.addWidget(self.detail_panel)
        
        splitter.setSizes([400, 500])
        layout.addWidget(splitter)
    
    def connect_signals(self):
        """Connect component signals to handlers."""
        self.list_panel.recipe_selected.connect(self.on_recipe_selected)
        self.list_panel.edit_clicked.connect(self.edit_recipe)
        self.list_panel.clone_clicked.connect(self.clone_recipe)
        self.list_panel.delete_clicked.connect(self.delete_recipe)
        self.list_panel.make_batch_clicked.connect(self.make_batch)
    
    def load_data(self):
        """Load recipes into the list panel."""
        recipes = self.recipe_service.get_all()
        self.list_panel.load_recipes(
            recipes, 
            cost_calculator=self.recipe_service.calculate_recipe
        )
    
    def on_recipe_selected(self, recipe_id: int):
        """Handle recipe selection from list panel."""
        self.detail_panel.load_recipe(recipe_id, self.recipe_service)
    
    def add_recipe(self):
        """Open dialog to create a new recipe."""
        ingredients = self.ingredient_service.get_all()
        dialog = RecipeDialog(self, ingredients=ingredients)
        
        if dialog.exec():
            data = dialog.get_data()
            recipe_ingredients = data.pop("ingredients", [])
            
            new_recipe = self.recipe_service.create(**data)
            
            for ri in recipe_ingredients:
                self.recipe_service.add_ingredient(
                    new_recipe.id,
                    ri["ingredient"].id,
                    ri["quantity"],
                    ri.get("unit", "g")
                )
            
            self.load_data()
            self._show_status("Recipe created successfully")
    
    def edit_recipe(self, recipe_id: int):
        """Open dialog to edit selected recipe."""
        recipe = self.recipe_service.get_by_id(recipe_id)
        ingredients = self.ingredient_service.get_all()
        dialog = RecipeDialog(self, recipe=recipe, ingredients=ingredients)
        
        if dialog.exec():
            data = dialog.get_data()
            new_ingredients = data.pop("ingredients", [])
            
            self.recipe_service.update(recipe_id, **data)
            
            # Clear existing ingredients and re-add
            for ri in recipe.ingredients:
                self.recipe_service.remove_ingredient(ri.id)
            
            for ri in new_ingredients:
                self.recipe_service.add_ingredient(
                    recipe_id,
                    ri["ingredient"].id,
                    ri["quantity"],
                    ri.get("unit", "g")
                )
            
            self.load_data()
            self.detail_panel.load_recipe(recipe_id, self.recipe_service)
            self._show_status("Recipe updated successfully")
    
    def clone_recipe(self, recipe_id: int):
        """Clone selected recipe."""
        recipe = self.recipe_service.get_by_id(recipe_id)
        new_name = f"{recipe.name} (Copy)"
        
        self.recipe_service.clone_recipe(recipe_id, new_name)
        self.load_data()
        self._show_status(f"Recipe cloned as '{new_name}'")
    
    def delete_recipe(self, recipe_id: int):
        """Delete selected recipe with confirmation."""
        recipe = self.recipe_service.get_by_id(recipe_id)
        reply = QMessageBox.question(
            self, "Confirm Delete",
            f"Delete recipe '{recipe.name}'?\n\nThis cannot be undone.",
            QMessageBox.Yes | QMessageBox.No,
            QMessageBox.No
        )
        
        if reply == QMessageBox.Yes:
            self.recipe_service.delete(recipe_id)
            self.load_data()
            self.detail_panel.clear()
            self._show_status("Recipe deleted")
    
    def _show_status(self, msg: str):
        """Show message in status bar."""
        try:
            self.parent().parent().statusBar().showMessage(msg, 3000)
        except Exception:
            pass
    
    def make_batch(self, recipe_id: int):
        """Create a production batch from a recipe."""
        from PySide6.QtWidgets import QInputDialog
        
        recipe = self.recipe_service.get_by_id(recipe_id)
        
        # Ask for scale factor
        scale, ok = QInputDialog.getDouble(
            self, "Make Batch",
            f"Scale factor for '{recipe.name}':\n\n"
            "(1.0 = original recipe size, 2.0 = double batch)",
            value=1.0, min=0.1, max=10.0, decimals=1
        )
        
        if not ok:
            return
        
        # Get the main window and production view
        try:
            main_window = self.parent().parent()
            production_view = main_window.production_view
            
            batch = production_view.create_batch_from_recipe(recipe_id, scale)
            if batch:
                # Switch to Production tab
                main_window.tabs.setCurrentWidget(production_view)
                self._show_status(f"Created batch {batch.lot_number}")
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Failed to create batch: {e}")
    
    def closeEvent(self, event):
        """Close database session."""
        self.db.close()
        super().closeEvent(event)
