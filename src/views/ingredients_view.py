"""
Ingredients View

Main widget for managing ingredients inventory.
"""
from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QTableWidget, QTableWidgetItem,
    QPushButton, QLineEdit, QComboBox, QLabel, QMessageBox, QHeaderView,
    QAbstractItemView
)
from PySide6.QtCore import Qt
from src.views.ingredient_dialog import IngredientDialog
from src.services.ingredient_service import IngredientService
from src.database.db import SessionLocal


class IngredientsView(QWidget):
    """
    Widget displaying a table of ingredients with CRUD operations.
    """
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.db = SessionLocal()
        self.service = IngredientService(self.db)
        self.setup_ui()
        self.load_data()
    
    def setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(24, 24, 24, 24)
        layout.setSpacing(16)
        
        # Header
        header_layout = QHBoxLayout()
        
        title = QLabel("Ingredients Inventory")
        title.setProperty("heading", True)
        title.setStyleSheet("font-size: 24px; font-weight: 700;")
        header_layout.addWidget(title)
        
        header_layout.addStretch()
        
        # Add button
        self.add_btn = QPushButton("+ Add Ingredient")
        self.add_btn.clicked.connect(self.add_ingredient)
        header_layout.addWidget(self.add_btn)
        
        layout.addLayout(header_layout)
        
        # Toolbar (Search + Filter)
        toolbar = QHBoxLayout()
        
        self.search_input = QLineEdit()
        self.search_input.setPlaceholderText("Search ingredients...")
        self.search_input.textChanged.connect(self.filter_table)
        self.search_input.setMaximumWidth(300)
        toolbar.addWidget(self.search_input)
        
        self.category_filter = QComboBox()
        self.category_filter.addItem("All Categories")
        self.category_filter.addItems(IngredientDialog.CATEGORIES)
        self.category_filter.currentTextChanged.connect(self.filter_table)
        toolbar.addWidget(self.category_filter)
        
        toolbar.addStretch()
        
        # Edit and Delete buttons
        self.edit_btn = QPushButton("Edit")
        self.edit_btn.setProperty("secondary", True)
        self.edit_btn.clicked.connect(self.edit_ingredient)
        self.edit_btn.setEnabled(False)
        toolbar.addWidget(self.edit_btn)
        
        self.delete_btn = QPushButton("Delete")
        self.delete_btn.setProperty("danger", True)
        self.delete_btn.clicked.connect(self.delete_ingredient)
        self.delete_btn.setEnabled(False)
        toolbar.addWidget(self.delete_btn)
        
        layout.addLayout(toolbar)
        
        # Table
        self.table = QTableWidget()
        self.table.setColumnCount(8)
        self.table.setHorizontalHeaderLabels([
            "ID", "Name", "Category", "SAP (NaOH)", "Unit", "Qty on Hand", "Cost/Unit", "Supplier"
        ])
        self.table.horizontalHeader().setSectionResizeMode(1, QHeaderView.Stretch)
        self.table.setSelectionBehavior(QAbstractItemView.SelectRows)
        self.table.setSelectionMode(QAbstractItemView.SingleSelection)
        self.table.setEditTriggers(QAbstractItemView.NoEditTriggers)
        self.table.setAlternatingRowColors(True)
        self.table.verticalHeader().setVisible(False)
        self.table.setColumnHidden(0, True)  # Hide ID column
        self.table.itemSelectionChanged.connect(self.on_selection_changed)
        self.table.doubleClicked.connect(self.edit_ingredient)
        
        layout.addWidget(self.table)
        
        # Summary bar
        self.summary_label = QLabel()
        self.summary_label.setStyleSheet("color: #6e6e73;")
        layout.addWidget(self.summary_label)
    
    def load_data(self, ingredients=None):
        """Load ingredients into the table."""
        if ingredients is None:
            ingredients = self.service.get_all()
        
        self.table.setRowCount(0)
        
        for ing in ingredients:
            row = self.table.rowCount()
            self.table.insertRow(row)
            
            self.table.setItem(row, 0, QTableWidgetItem(str(ing.id)))
            self.table.setItem(row, 1, QTableWidgetItem(ing.name))
            self.table.setItem(row, 2, QTableWidgetItem(ing.category))
            self.table.setItem(row, 3, QTableWidgetItem(f"{ing.sap_naoh:.4f}" if ing.sap_naoh else "-"))
            self.table.setItem(row, 4, QTableWidgetItem(ing.unit))
            
            qty_item = QTableWidgetItem(f"{ing.quantity_on_hand:.2f}")
            qty_item.setTextAlignment(Qt.AlignRight | Qt.AlignVCenter)
            self.table.setItem(row, 5, qty_item)
            
            cost_item = QTableWidgetItem(f"${ing.cost_per_unit:.4f}")
            cost_item.setTextAlignment(Qt.AlignRight | Qt.AlignVCenter)
            self.table.setItem(row, 6, cost_item)
            
            self.table.setItem(row, 7, QTableWidgetItem(ing.supplier or "-"))
        
        self.update_summary()
    
    def filter_table(self):
        """Filter table based on search and category."""
        search_text = self.search_input.text().lower()
        category = self.category_filter.currentText()
        
        for row in range(self.table.rowCount()):
            name = self.table.item(row, 1).text().lower()
            cat = self.table.item(row, 2).text()
            
            name_match = search_text in name
            cat_match = category == "All Categories" or cat == category
            
            self.table.setRowHidden(row, not (name_match and cat_match))
    
    def on_selection_changed(self):
        """Enable/disable buttons based on selection."""
        has_selection = len(self.table.selectedItems()) > 0
        self.edit_btn.setEnabled(has_selection)
        self.delete_btn.setEnabled(has_selection)
    
    def get_selected_id(self) -> int | None:
        """Get the ID of the selected ingredient."""
        selected = self.table.selectedItems()
        if selected:
            row = selected[0].row()
            return int(self.table.item(row, 0).text())
        return None
    
    def add_ingredient(self):
        """Open dialog to add a new ingredient."""
        dialog = IngredientDialog(self)
        if dialog.exec():
            data = dialog.get_data()
            self.service.create(**data)
            self.load_data()
            self.parent().parent().statusBar().showMessage("Ingredient added successfully", 3000)
    
    def edit_ingredient(self):
        """Open dialog to edit selected ingredient."""
        ing_id = self.get_selected_id()
        if ing_id:
            ingredient = self.service.get_by_id(ing_id)
            dialog = IngredientDialog(self, ingredient=ingredient)
            if dialog.exec():
                data = dialog.get_data()
                self.service.update(ing_id, **data)
                self.load_data()
                self.parent().parent().statusBar().showMessage("Ingredient updated successfully", 3000)
    
    def delete_ingredient(self):
        """Delete selected ingredient after confirmation."""
        ing_id = self.get_selected_id()
        if ing_id:
            ingredient = self.service.get_by_id(ing_id)
            reply = QMessageBox.question(
                self, "Confirm Delete",
                f"Are you sure you want to delete '{ingredient.name}'?\n\nThis action cannot be undone.",
                QMessageBox.Yes | QMessageBox.No,
                QMessageBox.No
            )
            if reply == QMessageBox.Yes:
                self.service.delete(ing_id)
                self.load_data()
                self.parent().parent().statusBar().showMessage("Ingredient deleted", 3000)
    
    def update_summary(self):
        """Update the summary label."""
        total = self.table.rowCount()
        # Count low stock items (less than 100g or units)
        low_stock = sum(
            1 for row in range(total)
            if float(self.table.item(row, 5).text()) < 100
        )
        self.summary_label.setText(f"Total: {total} ingredients  •  Low stock: {low_stock}")
    
    def closeEvent(self, event):
        """Close database session on widget close."""
        self.db.close()
        super().closeEvent(event)
