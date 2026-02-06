"""
Recipe List Panel

Displays a searchable, filterable list of recipes with action buttons.
"""
from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QTableWidget, QTableWidgetItem,
    QPushButton, QLineEdit, QHeaderView, QAbstractItemView
)
from PySide6.QtCore import Qt, Signal


class RecipeListPanel(QWidget):
    """
    Left-side panel showing recipe list with search and action buttons.
    
    Signals:
        recipe_selected(int): Emitted when a recipe is selected, with recipe ID.
        add_clicked(): Emitted when Add button is clicked.
        edit_clicked(int): Emitted when Edit button is clicked, with recipe ID.
        clone_clicked(int): Emitted when Clone button is clicked, with recipe ID.
        delete_clicked(int): Emitted when Delete button is clicked, with recipe ID.
    """
    
    recipe_selected = Signal(int)
    add_clicked = Signal()
    edit_clicked = Signal(int)
    clone_clicked = Signal(int)
    delete_clicked = Signal(int)
    make_batch_clicked = Signal(int)
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setup_ui()
    
    def setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        
        # Search
        self.search_input = QLineEdit()
        self.search_input.setPlaceholderText("Search recipes...")
        self.search_input.textChanged.connect(self.filter_table)
        layout.addWidget(self.search_input)
        
        # Recipe Table
        self.table = QTableWidget()
        self.table.setColumnCount(4)
        self.table.setHorizontalHeaderLabels(["ID", "Name", "Type", "Cost"])
        self.table.horizontalHeader().setSectionResizeMode(1, QHeaderView.Stretch)
        self.table.setSelectionBehavior(QAbstractItemView.SelectRows)
        self.table.setSelectionMode(QAbstractItemView.SingleSelection)
        self.table.setEditTriggers(QAbstractItemView.NoEditTriggers)
        self.table.verticalHeader().setVisible(False)
        self.table.setColumnHidden(0, True)  # Hide ID
        self.table.itemSelectionChanged.connect(self._on_selection_changed)
        self.table.doubleClicked.connect(self._on_double_click)
        layout.addWidget(self.table)
        
        # Action buttons
        btn_row = QHBoxLayout()
        
        self.edit_btn = QPushButton("Edit")
        self.edit_btn.setProperty("secondary", True)
        self.edit_btn.clicked.connect(self._emit_edit)
        self.edit_btn.setEnabled(False)
        btn_row.addWidget(self.edit_btn)
        
        self.clone_btn = QPushButton("Clone")
        self.clone_btn.setProperty("secondary", True)
        self.clone_btn.clicked.connect(self._emit_clone)
        self.clone_btn.setEnabled(False)
        btn_row.addWidget(self.clone_btn)
        
        self.delete_btn = QPushButton("Delete")
        self.delete_btn.setProperty("danger", True)
        self.delete_btn.clicked.connect(self._emit_delete)
        self.delete_btn.setEnabled(False)
        btn_row.addWidget(self.delete_btn)
        
        btn_row.addStretch()
        
        self.make_batch_btn = QPushButton("🏭 Make Batch")
        self.make_batch_btn.clicked.connect(self._emit_make_batch)
        self.make_batch_btn.setEnabled(False)
        self.make_batch_btn.setToolTip("Create a production batch from this recipe")
        btn_row.addWidget(self.make_batch_btn)
        
        layout.addLayout(btn_row)
    
    def load_recipes(self, recipes: list, cost_calculator=None):
        """
        Load recipes into the table.
        
        Args:
            recipes: List of Recipe objects.
            cost_calculator: Optional callable(recipe_id) -> dict with 'total_ingredient_cost'.
        """
        self.table.setRowCount(0)
        
        for recipe in recipes:
            row = self.table.rowCount()
            self.table.insertRow(row)
            
            cost = 0
            if cost_calculator:
                calc = cost_calculator(recipe.id)
                cost = calc.get("total_ingredient_cost", 0)
            
            self.table.setItem(row, 0, QTableWidgetItem(str(recipe.id)))
            self.table.setItem(row, 1, QTableWidgetItem(recipe.name))
            self.table.setItem(row, 2, QTableWidgetItem(recipe.recipe_type or "-"))
            
            cost_item = QTableWidgetItem(f"${cost:.2f}")
            cost_item.setTextAlignment(Qt.AlignRight | Qt.AlignVCenter)
            self.table.setItem(row, 3, cost_item)
    
    def filter_table(self):
        """Filter table by search text."""
        search = self.search_input.text().lower()
        for row in range(self.table.rowCount()):
            name = self.table.item(row, 1).text().lower()
            self.table.setRowHidden(row, search not in name)
    
    def get_selected_id(self) -> int | None:
        """Get selected recipe ID."""
        selected = self.table.selectedItems()
        if selected:
            row = selected[0].row()
            return int(self.table.item(row, 0).text())
        return None
    
    def _on_selection_changed(self):
        """Handle recipe selection."""
        recipe_id = self.get_selected_id()
        has_selection = recipe_id is not None
        
        self.edit_btn.setEnabled(has_selection)
        self.clone_btn.setEnabled(has_selection)
        self.delete_btn.setEnabled(has_selection)
        self.make_batch_btn.setEnabled(has_selection)
        
        if has_selection:
            self.recipe_selected.emit(recipe_id)
    
    def _on_double_click(self):
        """Handle double-click to edit."""
        recipe_id = self.get_selected_id()
        if recipe_id:
            self.edit_clicked.emit(recipe_id)
    
    def _emit_edit(self):
        recipe_id = self.get_selected_id()
        if recipe_id:
            self.edit_clicked.emit(recipe_id)
    
    def _emit_clone(self):
        recipe_id = self.get_selected_id()
        if recipe_id:
            self.clone_clicked.emit(recipe_id)
    
    def _emit_delete(self):
        recipe_id = self.get_selected_id()
        if recipe_id:
            self.delete_clicked.emit(recipe_id)
    
    def _emit_make_batch(self):
        recipe_id = self.get_selected_id()
        if recipe_id:
            self.make_batch_clicked.emit(recipe_id)
