"""
Recipe Detail Panel

Displays detailed information about a selected recipe including
lye calculation, ingredients, and scaling functionality.
"""
from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QTableWidget, QTableWidgetItem,
    QPushButton, QLabel, QMessageBox, QHeaderView, QGroupBox, QFormLayout,
    QFrame, QDoubleSpinBox
)
from PySide6.QtCore import Qt


class RecipeDetailPanel(QWidget):
    """
    Right-side panel showing recipe details, lye calculation, and scaling.
    """
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.recipe_service = None  # Set by parent
        self.selected_recipe = None
        self.setup_ui()
    
    def setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(16, 0, 0, 0)
        
        # Recipe name
        self.detail_name = QLabel("Select a recipe")
        self.detail_name.setStyleSheet("font-size: 20px; font-weight: 600;")
        layout.addWidget(self.detail_name)
        
        self.detail_type = QLabel("")
        self.detail_type.setStyleSheet("color: #6e6e73;")
        layout.addWidget(self.detail_type)
        
        # Divider
        line = QFrame()
        line.setFrameShape(QFrame.HLine)
        line.setStyleSheet("background-color: #d2d2d7;")
        layout.addWidget(line)
        
        # Lye/Water Summary
        self._setup_lye_summary(layout)
        
        # Ingredients
        self._setup_ingredients_section(layout)
        
        # Notes
        self._setup_notes_section(layout)
        
        layout.addStretch()
        
        # Scale section
        self._setup_scale_section(layout)
    
    def _setup_lye_summary(self, layout):
        """Setup the lye calculation summary group."""
        lye_summary = QGroupBox("Lye & Water Calculation")
        lye_layout = QFormLayout(lye_summary)
        
        self.total_oils_label = QLabel("-")
        lye_layout.addRow("Total Oils:", self.total_oils_label)
        
        self.lye_amount_label = QLabel("-")
        self.lye_amount_label.setStyleSheet("font-weight: 600; color: #1b5e20;")
        lye_layout.addRow("Lye Amount:", self.lye_amount_label)
        
        self.water_amount_label = QLabel("-")
        self.water_amount_label.setStyleSheet("font-weight: 600; color: #0277bd;")
        lye_layout.addRow("Water Amount:", self.water_amount_label)
        
        self.superfat_label = QLabel("-")
        lye_layout.addRow("Superfat:", self.superfat_label)
        
        self.total_batch_label = QLabel("-")
        self.total_batch_label.setStyleSheet("font-weight: 600;")
        lye_layout.addRow("Total Batch:", self.total_batch_label)
        
        layout.addWidget(lye_summary)
    
    def _setup_ingredients_section(self, layout):
        """Setup the ingredients table section."""
        ingredients_group = QGroupBox("Ingredients")
        ing_layout = QVBoxLayout(ingredients_group)
        
        self.detail_table = QTableWidget()
        self.detail_table.setColumnCount(4)
        self.detail_table.setHorizontalHeaderLabels(["Ingredient", "Quantity", "Unit Cost", "Total"])
        self.detail_table.horizontalHeader().setSectionResizeMode(0, QHeaderView.Stretch)
        self.detail_table.verticalHeader().setVisible(False)
        self.detail_table.setMaximumHeight(200)
        ing_layout.addWidget(self.detail_table)
        
        self.cost_label = QLabel("Total Cost: $0.00")
        self.cost_label.setStyleSheet("font-weight: 600; font-size: 14px;")
        ing_layout.addWidget(self.cost_label)
        
        layout.addWidget(ingredients_group)
    
    def _setup_notes_section(self, layout):
        """Setup the notes display section."""
        notes_group = QGroupBox("Notes")
        notes_layout = QVBoxLayout(notes_group)
        self.notes_text = QLabel("-")
        self.notes_text.setWordWrap(True)
        self.notes_text.setStyleSheet("color: #6e6e73;")
        notes_layout.addWidget(self.notes_text)
        layout.addWidget(notes_group)
    
    def _setup_scale_section(self, layout):
        """Setup the recipe scaling section."""
        scale_group = QGroupBox("Scale Recipe")
        scale_layout = QHBoxLayout(scale_group)
        
        self.scale_spin = QDoubleSpinBox()
        self.scale_spin.setRange(0.1, 10.0)
        self.scale_spin.setValue(1.0)
        self.scale_spin.setSingleStep(0.5)
        self.scale_spin.setPrefix("× ")
        scale_layout.addWidget(self.scale_spin)
        
        scale_btn = QPushButton("Calculate Scaled")
        scale_btn.clicked.connect(self.show_scaled)
        scale_layout.addWidget(scale_btn)
        
        layout.addWidget(scale_group)
    
    def load_recipe(self, recipe_id: int, recipe_service):
        """Load recipe details into the panel."""
        self.recipe_service = recipe_service
        calc = recipe_service.calculate_recipe(recipe_id)
        recipe_data = calc.get("recipe", {})
        
        self.selected_recipe = recipe_service.get_by_id(recipe_id)
        
        self.detail_name.setText(recipe_data.get("name", "Unknown"))
        self.detail_type.setText(f"{recipe_data.get('recipe_type', '')} • {recipe_data.get('lye_type', '')}")
        
        # Lye summary
        lye_calc = calc.get("lye_calculation", {})
        self.total_oils_label.setText(f"{calc.get('total_oils_weight', 0):.2f} g")
        self.lye_amount_label.setText(f"{lye_calc.get('lye_amount', 0):.2f} g ({recipe_data.get('lye_type', 'NaOH')})")
        self.water_amount_label.setText(f"{calc.get('water_amount', 0):.2f} g")
        self.superfat_label.setText(f"{recipe_data.get('superfat_percentage', 5)}%")
        self.total_batch_label.setText(f"{calc.get('total_batch_weight', 0):.2f} g")
        
        # Ingredients table
        self.detail_table.setRowCount(0)
        for ing in calc.get("ingredients", []):
            row = self.detail_table.rowCount()
            self.detail_table.insertRow(row)
            
            self.detail_table.setItem(row, 0, QTableWidgetItem(ing["name"]))
            self.detail_table.setItem(row, 1, QTableWidgetItem(f"{ing['quantity']:.2f} {ing['unit']}"))
            self.detail_table.setItem(row, 2, QTableWidgetItem(f"${ing['cost_per_unit']:.4f}"))
            self.detail_table.setItem(row, 3, QTableWidgetItem(f"${ing['total_cost']:.4f}"))
        
        self.cost_label.setText(f"Total Cost: ${calc.get('total_ingredient_cost', 0):.2f}")
        
        # Notes
        notes = self.selected_recipe.notes if self.selected_recipe else "-"
        self.notes_text.setText(notes or "No notes")
    
    def clear(self):
        """Clear the detail panel."""
        self.detail_name.setText("Select a recipe")
        self.detail_type.setText("")
        self.total_oils_label.setText("-")
        self.lye_amount_label.setText("-")
        self.water_amount_label.setText("-")
        self.superfat_label.setText("-")
        self.total_batch_label.setText("-")
        self.detail_table.setRowCount(0)
        self.cost_label.setText("Total Cost: $0.00")
        self.notes_text.setText("-")
        self.selected_recipe = None
    
    def show_scaled(self):
        """Show scaled recipe calculation."""
        if not self.selected_recipe or not self.recipe_service:
            return
        
        scale = self.scale_spin.value()
        scaled = self.recipe_service.scale_recipe(self.selected_recipe.id, scale)
        
        msg = f"Scaled Recipe (×{scale})\n\n"
        msg += f"Total Oils: {scaled.get('scaled_oils_weight', 0):.2f} g\n"
        msg += f"Lye: {scaled.get('lye_amount', 0):.2f} g\n"
        msg += f"Water: {scaled.get('water_amount', 0):.2f} g\n\n"
        msg += "Ingredients:\n"
        
        for ing in scaled.get("scaled_ingredients", []):
            msg += f"  • {ing['name']}: {ing['scaled_quantity']:.2f} g\n"
        
        QMessageBox.information(self, "Scaled Recipe", msg)
