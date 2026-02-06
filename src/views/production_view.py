"""
Production View

Main widget for managing production batches.
"""
from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QTableWidget, QTableWidgetItem,
    QPushButton, QLineEdit, QComboBox, QLabel, QMessageBox, QHeaderView,
    QAbstractItemView, QSplitter
)
from PySide6.QtCore import Qt
from src.views.components.batch_detail_panel import BatchDetailPanel
from src.services.production_service import ProductionService
from src.database.db import SessionLocal


class ProductionView(QWidget):
    """
    Main production batch management view.
    """
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.db = SessionLocal()
        self.production_service = ProductionService(self.db)
        self.setup_ui()
        self.connect_signals()
        self.load_data()
    
    def setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(24, 24, 24, 24)
        layout.setSpacing(16)
        
        # Header
        self._setup_header(layout)
        
        # Splitter
        splitter = QSplitter(Qt.Horizontal)
        
        # Left - Batch list
        left_widget = self._create_list_panel()
        splitter.addWidget(left_widget)
        
        # Right - Batch detail
        self.detail_panel = BatchDetailPanel(self)
        splitter.addWidget(self.detail_panel)
        
        splitter.setSizes([400, 500])
        layout.addWidget(splitter)
    
    def _setup_header(self, layout):
        """Setup header with title and filter."""
        header_layout = QHBoxLayout()
        
        title = QLabel("Production")
        title.setStyleSheet("font-size: 24px; font-weight: 700;")
        header_layout.addWidget(title)
        
        header_layout.addStretch()
        
        # Status filter
        header_layout.addWidget(QLabel("Status:"))
        self.status_filter = QComboBox()
        self.status_filter.addItems(["All", "Planned", "In Progress", "Curing", "Complete", "Cancelled"])
        self.status_filter.currentTextChanged.connect(self.filter_by_status)
        header_layout.addWidget(self.status_filter)
        
        layout.addLayout(header_layout)
    
    def _create_list_panel(self) -> QWidget:
        """Create the batch list panel."""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setContentsMargins(0, 0, 0, 0)
        
        # Search
        self.search_input = QLineEdit()
        self.search_input.setPlaceholderText("Search by lot number or recipe...")
        self.search_input.textChanged.connect(self.filter_table)
        layout.addWidget(self.search_input)
        
        # Batch Table
        self.table = QTableWidget()
        self.table.setColumnCount(5)
        self.table.setHorizontalHeaderLabels(["ID", "Lot #", "Recipe", "Status", "Date"])
        self.table.horizontalHeader().setSectionResizeMode(2, QHeaderView.Stretch)
        self.table.setSelectionBehavior(QAbstractItemView.SelectRows)
        self.table.setSelectionMode(QAbstractItemView.SingleSelection)
        self.table.setEditTriggers(QAbstractItemView.NoEditTriggers)
        self.table.verticalHeader().setVisible(False)
        self.table.setColumnHidden(0, True)  # Hide ID
        self.table.itemSelectionChanged.connect(self.on_selection_changed)
        layout.addWidget(self.table)
        
        return widget
    
    def connect_signals(self):
        """Connect component signals."""
        self.detail_panel.status_changed.connect(self.on_status_changed)
    
    def load_data(self):
        """Load batches into the table."""
        status_filter = self.status_filter.currentText()
        status = None if status_filter == "All" else status_filter
        
        batches = self.production_service.get_all(status)
        
        self.table.setRowCount(0)
        
        for batch in batches:
            row = self.table.rowCount()
            self.table.insertRow(row)
            
            self.table.setItem(row, 0, QTableWidgetItem(str(batch.id)))
            self.table.setItem(row, 1, QTableWidgetItem(batch.lot_number))
            
            recipe_name = batch.recipe.name if batch.recipe else "Unknown"
            self.table.setItem(row, 2, QTableWidgetItem(recipe_name))
            
            status_item = QTableWidgetItem(batch.status)
            self._style_status_cell(status_item, batch.status)
            self.table.setItem(row, 3, status_item)
            
            date_str = batch.production_date.strftime("%Y-%m-%d") if batch.production_date else \
                       batch.planned_date.strftime("%Y-%m-%d") if batch.planned_date else "-"
            self.table.setItem(row, 4, QTableWidgetItem(date_str))
    
    def _style_status_cell(self, item: QTableWidgetItem, status: str):
        """Apply styling to status cell."""
        from PySide6.QtGui import QColor
        colors = {
            "Planned": QColor("#1565c0"),
            "In Progress": QColor("#ef6c00"),
            "Curing": QColor("#c2185b"),
            "Complete": QColor("#2e7d32"),
            "Cancelled": QColor("#757575")
        }
        item.setForeground(colors.get(status, QColor("#000000")))
    
    def filter_table(self):
        """Filter table by search text."""
        search = self.search_input.text().lower()
        for row in range(self.table.rowCount()):
            lot = self.table.item(row, 1).text().lower()
            recipe = self.table.item(row, 2).text().lower()
            self.table.setRowHidden(row, search not in lot and search not in recipe)
    
    def filter_by_status(self):
        """Reload data with status filter."""
        self.load_data()
    
    def on_selection_changed(self):
        """Handle batch selection."""
        selected = self.table.selectedItems()
        if selected:
            row = selected[0].row()
            batch_id = int(self.table.item(row, 0).text())
            self.detail_panel.load_batch(batch_id, self.production_service)
    
    def on_status_changed(self):
        """Handle status change from detail panel."""
        # Reload to reflect changes
        batch_id = None
        selected = self.table.selectedItems()
        if selected:
            batch_id = int(self.table.item(selected[0].row(), 0).text())
        
        self.load_data()
        
        # Re-select the batch
        if batch_id:
            for row in range(self.table.rowCount()):
                if int(self.table.item(row, 0).text()) == batch_id:
                    self.table.selectRow(row)
                    self.detail_panel.load_batch(batch_id, self.production_service)
                    break
    
    def create_batch_from_recipe(self, recipe_id: int, scale_factor: float = 1.0):
        """Create a new batch from a recipe (called from Recipes view)."""
        try:
            batch = self.production_service.create_batch(recipe_id, scale_factor)
            self.load_data()
            self._show_status(f"Created batch {batch.lot_number}")
            return batch
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Failed to create batch: {e}")
            return None
    
    def _show_status(self, msg: str):
        """Show message in status bar."""
        try:
            self.parent().parent().statusBar().showMessage(msg, 3000)
        except Exception:
            pass
    
    def closeEvent(self, event):
        """Close database session."""
        self.db.close()
        super().closeEvent(event)
