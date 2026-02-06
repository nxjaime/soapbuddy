"""
Recipe Dialog

Modal dialog for creating/editing recipes.
"""
from PySide6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QFormLayout, QTabWidget,
    QLineEdit, QDoubleSpinBox, QComboBox, QTextEdit, QTableWidget,
    QTableWidgetItem, QPushButton, QLabel, QDialogButtonBox, QMessageBox,
    QWidget, QHeaderView, QAbstractItemView, QGroupBox, QStyle
)
from PySide6.QtCore import Qt


class RecipeDialog(QDialog):
    """
    Dialog for creating or editing a recipe.
    """
    
    RECIPE_TYPES = ["Soap (Cold Process)", "Soap (Hot Process)", "Liquid Soap", "Cream Soap", "Lotion", "Lip Balm", "Other"]
    LYE_TYPES = ["NaOH", "KOH", "Dual"]
    
    def __init__(self, parent=None, recipe=None, ingredients=None):
        super().__init__(parent)
        self.recipe = recipe
        self.all_ingredients = ingredients or []
        self.recipe_ingredients = []  # List of {ingredient, quantity, unit}
        
        self.setWindowTitle("Edit Recipe" if recipe else "New Recipe")
        self.setMinimumSize(700, 600)
        self.setup_ui()
        
        if recipe:
            self.populate_fields()
    
    def setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setSpacing(16)
        
        # Tab Widget
        tabs = QTabWidget()
        
        # === Details Tab ===
        details_tab = QWidget()
        details_layout = QFormLayout(details_tab)
        details_layout.setSpacing(12)
        
        # Name
        self.name_input = QLineEdit()
        self.name_input.setPlaceholderText("e.g., Lavender Oatmeal Soap")
        details_layout.addRow("Recipe Name *:", self.name_input)
        
        # Type
        self.type_combo = QComboBox()
        self.type_combo.addItems(self.RECIPE_TYPES)
        details_layout.addRow("Recipe Type:", self.type_combo)
        
        # Description
        self.description_input = QTextEdit()
        self.description_input.setMaximumHeight(80)
        self.description_input.setPlaceholderText("Brief description of this recipe...")
        details_layout.addRow("Description:", self.description_input)
        
        # Lye Settings Group
        lye_group = QGroupBox("Lye Settings")
        lye_layout = QFormLayout(lye_group)
        
        self.lye_type_combo = QComboBox()
        self.lye_type_combo.addItems(self.LYE_TYPES)
        lye_layout.addRow("Lye Type:", self.lye_type_combo)
        
        self.superfat_spin = QDoubleSpinBox()
        self.superfat_spin.setRange(0, 30)
        self.superfat_spin.setValue(5.0)
        self.superfat_spin.setSuffix(" %")
        lye_layout.addRow("Superfat:", self.superfat_spin)
        
        self.water_pct_spin = QDoubleSpinBox()
        self.water_pct_spin.setRange(20, 50)
        self.water_pct_spin.setValue(33.0)
        self.water_pct_spin.setSuffix(" % of oils")
        lye_layout.addRow("Water %:", self.water_pct_spin)
        
        details_layout.addRow(lye_group)
        
        # Notes
        self.notes_input = QTextEdit()
        self.notes_input.setMaximumHeight(80)
        self.notes_input.setPlaceholderText("Additional notes, instructions, curing time, etc...")
        details_layout.addRow("Notes:", self.notes_input)
        
        tabs.addTab(details_tab, "Details")
        
        # === Ingredients Tab ===
        ingredients_tab = QWidget()
        ing_layout = QVBoxLayout(ingredients_tab)
        
        # Add ingredient section
        add_section = QHBoxLayout()
        
        self.ingredient_combo = QComboBox()
        self.ingredient_combo.setMinimumWidth(200)
        self.refresh_ingredient_combo()
        add_section.addWidget(self.ingredient_combo)
        
        self.quantity_spin = QDoubleSpinBox()
        self.quantity_spin.setRange(0, 99999)
        self.quantity_spin.setValue(100)
        self.quantity_spin.setSuffix(" g")
        add_section.addWidget(self.quantity_spin)
        
        add_btn = QPushButton("Add Ingredient")
        add_btn.clicked.connect(self.add_ingredient)
        add_section.addWidget(add_btn)
        
        add_section.addStretch()
        ing_layout.addLayout(add_section)
        
        # Ingredients table
        self.ing_table = QTableWidget()
        self.ing_table.setColumnCount(5)
        self.ing_table.setHorizontalHeaderLabels(["Ingredient", "Category", "Quantity", "Cost", ""])
        self.ing_table.horizontalHeader().setSectionResizeMode(0, QHeaderView.Stretch)
        self.ing_table.setSelectionBehavior(QAbstractItemView.SelectRows)
        self.ing_table.verticalHeader().setVisible(False)
        ing_layout.addWidget(self.ing_table)
        
        # Summary
        self.summary_label = QLabel("Total Oils: 0 g  •  Estimated Cost: $0.00")
        self.summary_label.setStyleSheet("color: #6e6e73; margin-top: 8px;")
        ing_layout.addWidget(self.summary_label)
        
        tabs.addTab(ingredients_tab, "Ingredients")
        
        layout.addWidget(tabs)
        
        # Buttons
        button_box = QDialogButtonBox(
            QDialogButtonBox.Save | QDialogButtonBox.Cancel
        )
        button_box.accepted.connect(self.validate_and_accept)
        button_box.rejected.connect(self.reject)
        layout.addWidget(button_box)
    
    def refresh_ingredient_combo(self):
        """Refresh the ingredient dropdown."""
        self.ingredient_combo.clear()
        for ing in self.all_ingredients:
            self.ingredient_combo.addItem(f"{ing.name} ({ing.category})", ing)
    
    def add_ingredient(self):
        """Add selected ingredient to the recipe."""
        idx = self.ingredient_combo.currentIndex()
        if idx < 0:
            return
        
        ingredient = self.ingredient_combo.itemData(idx)
        quantity = self.quantity_spin.value()
        
        if quantity <= 0:
            return
        
        # Check if already added
        for ri in self.recipe_ingredients:
            if ri["ingredient"].id == ingredient.id:
                ri["quantity"] += quantity
                self.update_ingredients_table()
                return
        
        self.recipe_ingredients.append({
            "ingredient": ingredient,
            "quantity": quantity,
            "unit": "g",
        })
        self.update_ingredients_table()
    
    def remove_ingredient(self, index):
        """Remove ingredient at index."""
        if 0 <= index < len(self.recipe_ingredients):
            del self.recipe_ingredients[index]
            self.update_ingredients_table()
    
    def update_ingredients_table(self):
        """Update the ingredients table."""
        self.ing_table.setRowCount(0)
        
        total_oils = 0.0
        total_cost = 0.0
        
        for i, ri in enumerate(self.recipe_ingredients):
            row = self.ing_table.rowCount()
            self.ing_table.insertRow(row)
            
            ing = ri["ingredient"]
            qty = ri["quantity"]
            cost = qty * ing.cost_per_unit
            
            if ing.category in ["Base Oil", "Butter"]:
                total_oils += qty
            total_cost += cost
            
            self.ing_table.setItem(row, 0, QTableWidgetItem(ing.name))
            self.ing_table.setItem(row, 1, QTableWidgetItem(ing.category))
            
            qty_item = QTableWidgetItem(f"{qty:.2f} g")
            qty_item.setTextAlignment(Qt.AlignRight | Qt.AlignVCenter)
            self.ing_table.setItem(row, 2, qty_item)
            
            cost_item = QTableWidgetItem(f"${cost:.4f}")
            cost_item.setTextAlignment(Qt.AlignRight | Qt.AlignVCenter)
            self.ing_table.setItem(row, 3, cost_item)
            
            remove_btn = QPushButton()
            remove_btn.setIcon(self.style().standardIcon(QStyle.SP_TrashIcon))
            remove_btn.setToolTip("Remove ingredient")
            remove_btn.setMaximumWidth(36)
            remove_btn.setStyleSheet("background-color: transparent; border: 1px solid #ff3b30; border-radius: 4px;")
            remove_btn.clicked.connect(lambda checked, idx=i: self.remove_ingredient(idx))
            self.ing_table.setCellWidget(row, 4, remove_btn)
        
        self.summary_label.setText(f"Total Oils: {total_oils:.2f} g  •  Estimated Cost: ${total_cost:.4f}")
    
    def populate_fields(self):
        """Populate fields with existing recipe data."""
        r = self.recipe
        self.name_input.setText(r.name or "")
        
        # Find type index
        for i in range(self.type_combo.count()):
            if r.recipe_type and r.recipe_type in self.type_combo.itemText(i):
                self.type_combo.setCurrentIndex(i)
                break
        
        self.description_input.setPlainText(r.description or "")
        
        lye_idx = self.lye_type_combo.findText(r.lye_type or "NaOH")
        if lye_idx >= 0:
            self.lye_type_combo.setCurrentIndex(lye_idx)
        
        self.superfat_spin.setValue(r.superfat_percentage or 5.0)
        self.water_pct_spin.setValue(r.water_percentage or 33.0)
        self.notes_input.setPlainText(r.notes or "")
        
        # Load recipe ingredients
        for ri in r.ingredients:
            if ri.ingredient:
                self.recipe_ingredients.append({
                    "ingredient": ri.ingredient,
                    "quantity": ri.quantity,
                    "unit": ri.unit,
                    "recipe_ingredient_id": ri.id,
                })
        self.update_ingredients_table()
    
    def validate_and_accept(self):
        """Validate inputs before accepting."""
        if not self.name_input.text().strip():
            QMessageBox.warning(self, "Validation Error", "Recipe name is required.")
            self.name_input.setFocus()
            return
        self.accept()
    
    def get_data(self) -> dict:
        """Return the form data as a dictionary."""
        recipe_type = self.type_combo.currentText()
        # Extract just the type name without the parenthetical
        if " (" in recipe_type:
            recipe_type = recipe_type.split(" (")[0]
        
        return {
            "name": self.name_input.text().strip(),
            "description": self.description_input.toPlainText().strip() or None,
            "recipe_type": recipe_type,
            "lye_type": self.lye_type_combo.currentText(),
            "superfat_percentage": self.superfat_spin.value(),
            "water_percentage": self.water_pct_spin.value(),
            "notes": self.notes_input.toPlainText().strip() or None,
            "ingredients": self.recipe_ingredients,
        }
