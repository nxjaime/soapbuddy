"""
Ingredient Dialog

Modal dialog for adding/editing ingredients.
"""
from PySide6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QFormLayout,
    QLineEdit, QDoubleSpinBox, QComboBox, QTextEdit,
    QPushButton, QLabel, QDialogButtonBox, QMessageBox
)
from PySide6.QtCore import Qt


class IngredientDialog(QDialog):
    """
    Dialog for creating or editing an ingredient.
    """
    
    CATEGORIES = ["Base Oil", "Butter", "Lye", "Additive", "Fragrance", "Colorant", "Packaging", "Other"]
    UNITS = ["g", "kg", "oz", "lb", "ml", "L", "each"]
    
    def __init__(self, parent=None, ingredient=None):
        super().__init__(parent)
        self.ingredient = ingredient
        self.setWindowTitle("Edit Ingredient" if ingredient else "Add Ingredient")
        self.setMinimumWidth(450)
        self.setup_ui()
        
        if ingredient:
            self.populate_fields()
    
    def setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setSpacing(16)
        
        # Form Layout
        form = QFormLayout()
        form.setSpacing(12)
        
        # Name
        self.name_input = QLineEdit()
        self.name_input.setPlaceholderText("e.g., Olive Oil (Extra Virgin)")
        form.addRow("Name *:", self.name_input)
        
        # Category
        self.category_combo = QComboBox()
        self.category_combo.addItems(self.CATEGORIES)
        form.addRow("Category *:", self.category_combo)
        
        # INCI Code
        self.inci_input = QLineEdit()
        self.inci_input.setPlaceholderText("e.g., Olea Europaea Fruit Oil")
        form.addRow("INCI Code:", self.inci_input)
        
        # SAP Values section
        sap_label = QLabel("SAP Values (for lye calculation)")
        sap_label.setProperty("subheading", True)
        form.addRow(sap_label)
        
        # SAP NaOH
        self.sap_naoh_input = QDoubleSpinBox()
        self.sap_naoh_input.setRange(0, 1)
        self.sap_naoh_input.setDecimals(4)
        self.sap_naoh_input.setSingleStep(0.001)
        self.sap_naoh_input.setSpecialValueText("N/A")
        form.addRow("SAP (NaOH):", self.sap_naoh_input)
        
        # SAP KOH
        self.sap_koh_input = QDoubleSpinBox()
        self.sap_koh_input.setRange(0, 1)
        self.sap_koh_input.setDecimals(4)
        self.sap_koh_input.setSingleStep(0.001)
        self.sap_koh_input.setSpecialValueText("N/A")
        form.addRow("SAP (KOH):", self.sap_koh_input)
        
        # Inventory section
        inv_label = QLabel("Inventory & Cost")
        inv_label.setProperty("subheading", True)
        form.addRow(inv_label)
        
        # Unit
        self.unit_combo = QComboBox()
        self.unit_combo.addItems(self.UNITS)
        form.addRow("Unit:", self.unit_combo)
        
        # Quantity on hand
        self.qty_input = QDoubleSpinBox()
        self.qty_input.setRange(0, 999999)
        self.qty_input.setDecimals(2)
        form.addRow("Quantity on Hand:", self.qty_input)
        
        # Cost per unit
        self.cost_input = QDoubleSpinBox()
        self.cost_input.setRange(0, 99999)
        self.cost_input.setDecimals(4)
        self.cost_input.setPrefix("$ ")
        form.addRow("Cost per Unit:", self.cost_input)
        
        # Supplier
        self.supplier_input = QLineEdit()
        self.supplier_input.setPlaceholderText("e.g., Bramble Berry")
        form.addRow("Supplier:", self.supplier_input)
        
        # Notes
        self.notes_input = QTextEdit()
        self.notes_input.setMaximumHeight(80)
        self.notes_input.setPlaceholderText("Additional notes...")
        form.addRow("Notes:", self.notes_input)
        
        layout.addLayout(form)
        
        # Buttons
        button_box = QDialogButtonBox(
            QDialogButtonBox.Save | QDialogButtonBox.Cancel
        )
        button_box.accepted.connect(self.validate_and_accept)
        button_box.rejected.connect(self.reject)
        layout.addWidget(button_box)
    
    def populate_fields(self):
        """Populate fields with existing ingredient data."""
        ing = self.ingredient
        self.name_input.setText(ing.name or "")
        
        idx = self.category_combo.findText(ing.category or "")
        if idx >= 0:
            self.category_combo.setCurrentIndex(idx)
        
        self.inci_input.setText(ing.inci_code or "")
        self.sap_naoh_input.setValue(ing.sap_naoh or 0)
        self.sap_koh_input.setValue(ing.sap_koh or 0)
        
        unit_idx = self.unit_combo.findText(ing.unit or "g")
        if unit_idx >= 0:
            self.unit_combo.setCurrentIndex(unit_idx)
        
        self.qty_input.setValue(ing.quantity_on_hand or 0)
        self.cost_input.setValue(ing.cost_per_unit or 0)
        self.supplier_input.setText(ing.supplier or "")
        self.notes_input.setPlainText(ing.notes or "")
    
    def validate_and_accept(self):
        """Validate inputs before accepting."""
        if not self.name_input.text().strip():
            QMessageBox.warning(self, "Validation Error", "Name is required.")
            self.name_input.setFocus()
            return
        self.accept()
    
    def get_data(self) -> dict:
        """Return the form data as a dictionary."""
        return {
            "name": self.name_input.text().strip(),
            "category": self.category_combo.currentText(),
            "inci_code": self.inci_input.text().strip() or None,
            "sap_naoh": self.sap_naoh_input.value() or None,
            "sap_koh": self.sap_koh_input.value() or None,
            "unit": self.unit_combo.currentText(),
            "quantity_on_hand": self.qty_input.value(),
            "cost_per_unit": self.cost_input.value(),
            "supplier": self.supplier_input.text().strip() or None,
            "notes": self.notes_input.toPlainText().strip() or None,
        }
