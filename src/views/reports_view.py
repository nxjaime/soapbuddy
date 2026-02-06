"""
Reports View

Main widget for viewing reports and analytics.
"""
from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QTabWidget, QTableWidget,
    QTableWidgetItem, QPushButton, QLabel, QComboBox, QHeaderView,
    QGroupBox, QGridLayout, QFileDialog, QMessageBox
)
from PySide6.QtCore import Qt
from src.services.reports_service import ReportsService
from src.database.db import SessionLocal


class ReportsView(QWidget):
    """
    Main reports and analytics view.
    """
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.db = SessionLocal()
        self.reports_service = ReportsService(self.db)
        self.setup_ui()
        self.load_all_reports()
    
    def setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(24, 24, 24, 24)
        layout.setSpacing(16)
        
        # Header
        header = QHBoxLayout()
        title = QLabel("Reports & Analytics")
        title.setStyleSheet("font-size: 24px; font-weight: 700;")
        header.addWidget(title)
        
        header.addStretch()
        
        refresh_btn = QPushButton("🔄 Refresh")
        refresh_btn.clicked.connect(self.load_all_reports)
        header.addWidget(refresh_btn)
        
        layout.addLayout(header)
        
        # Report Tabs
        self.tabs = QTabWidget()
        
        # Inventory Tab
        self.tabs.addTab(self._create_inventory_tab(), "📦 Inventory")
        
        # Production Tab
        self.tabs.addTab(self._create_production_tab(), "🏭 Production")
        
        # Costs Tab
        self.tabs.addTab(self._create_costs_tab(), "💰 Costs")
        
        layout.addWidget(self.tabs)
    
    def _create_inventory_tab(self) -> QWidget:
        """Create the inventory report tab."""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        
        # Summary cards
        summary_layout = QHBoxLayout()
        
        self.inv_total_card = self._create_stat_card("Total Ingredients", "0")
        summary_layout.addWidget(self.inv_total_card)
        
        self.inv_value_card = self._create_stat_card("Total Value", "$0.00")
        summary_layout.addWidget(self.inv_value_card)
        
        self.inv_low_stock_card = self._create_stat_card("Low Stock Items", "0", highlight=True)
        summary_layout.addWidget(self.inv_low_stock_card)
        
        layout.addLayout(summary_layout)
        
        # By Category table
        cat_group = QGroupBox("Inventory by Category")
        cat_layout = QVBoxLayout(cat_group)
        
        self.category_table = QTableWidget()
        self.category_table.setColumnCount(4)
        self.category_table.setHorizontalHeaderLabels(["Category", "Items", "Quantity", "Value"])
        self.category_table.horizontalHeader().setSectionResizeMode(0, QHeaderView.Stretch)
        self.category_table.verticalHeader().setVisible(False)
        cat_layout.addWidget(self.category_table)
        
        layout.addWidget(cat_group)
        
        # Low Stock table
        low_group = QGroupBox("Low Stock Alerts")
        low_layout = QVBoxLayout(low_group)
        
        self.low_stock_table = QTableWidget()
        self.low_stock_table.setColumnCount(4)
        self.low_stock_table.setHorizontalHeaderLabels(["Ingredient", "Category", "Quantity", "Status"])
        self.low_stock_table.horizontalHeader().setSectionResizeMode(0, QHeaderView.Stretch)
        self.low_stock_table.verticalHeader().setVisible(False)
        low_layout.addWidget(self.low_stock_table)
        
        export_btn = QPushButton("Export to CSV")
        export_btn.clicked.connect(lambda: self._export_table(self.low_stock_table, "low_stock"))
        low_layout.addWidget(export_btn)
        
        layout.addWidget(low_group)
        
        return widget
    
    def _create_production_tab(self) -> QWidget:
        """Create the production report tab."""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        
        # Period selector
        period_layout = QHBoxLayout()
        period_layout.addWidget(QLabel("Period:"))
        self.period_combo = QComboBox()
        self.period_combo.addItems(["Last 7 days", "Last 30 days", "Last 90 days", "All time"])
        self.period_combo.currentTextChanged.connect(self._load_production_report)
        period_layout.addWidget(self.period_combo)
        period_layout.addStretch()
        layout.addLayout(period_layout)
        
        # Summary cards
        summary_layout = QHBoxLayout()
        
        self.prod_batches_card = self._create_stat_card("Total Batches", "0")
        summary_layout.addWidget(self.prod_batches_card)
        
        self.prod_weight_card = self._create_stat_card("Total Weight", "0 g")
        summary_layout.addWidget(self.prod_weight_card)
        
        self.prod_cost_card = self._create_stat_card("Total Cost", "$0.00")
        summary_layout.addWidget(self.prod_cost_card)
        
        layout.addLayout(summary_layout)
        
        # Status breakdown
        status_group = QGroupBox("Batches by Status")
        status_layout = QHBoxLayout(status_group)
        
        self.status_labels = {}
        for status in ["Planned", "In Progress", "Curing", "Complete", "Cancelled"]:
            label = QLabel(f"{status}: 0")
            label.setStyleSheet("padding: 8px; background: #f5f5f7; border-radius: 4px;")
            status_layout.addWidget(label)
            self.status_labels[status] = label
        
        layout.addWidget(status_group)
        
        # Production history table
        history_group = QGroupBox("Production History")
        history_layout = QVBoxLayout(history_group)
        
        self.history_table = QTableWidget()
        self.history_table.setColumnCount(6)
        self.history_table.setHorizontalHeaderLabels(["Lot #", "Recipe", "Status", "Scale", "Weight", "Cost"])
        self.history_table.horizontalHeader().setSectionResizeMode(1, QHeaderView.Stretch)
        self.history_table.verticalHeader().setVisible(False)
        history_layout.addWidget(self.history_table)
        
        export_btn = QPushButton("Export to CSV")
        export_btn.clicked.connect(lambda: self._export_table(self.history_table, "production_history"))
        history_layout.addWidget(export_btn)
        
        layout.addWidget(history_group)
        
        return widget
    
    def _create_costs_tab(self) -> QWidget:
        """Create the costs report tab."""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        
        # Recipe costs table
        recipe_group = QGroupBox("Recipe Costs")
        recipe_layout = QVBoxLayout(recipe_group)
        
        self.recipe_costs_table = QTableWidget()
        self.recipe_costs_table.setColumnCount(5)
        self.recipe_costs_table.setHorizontalHeaderLabels(["Recipe", "Type", "Ingredient Cost", "Batch Weight", "Cost/100g"])
        self.recipe_costs_table.horizontalHeader().setSectionResizeMode(0, QHeaderView.Stretch)
        self.recipe_costs_table.verticalHeader().setVisible(False)
        recipe_layout.addWidget(self.recipe_costs_table)
        
        export_btn = QPushButton("Export to CSV")
        export_btn.clicked.connect(lambda: self._export_table(self.recipe_costs_table, "recipe_costs"))
        recipe_layout.addWidget(export_btn)
        
        layout.addWidget(recipe_group)
        
        # Ingredient usage table
        usage_group = QGroupBox("Ingredient Usage (Last 30 Days)")
        usage_layout = QVBoxLayout(usage_group)
        
        self.usage_table = QTableWidget()
        self.usage_table.setColumnCount(4)
        self.usage_table.setHorizontalHeaderLabels(["Ingredient", "Category", "Quantity Used", "Total Cost"])
        self.usage_table.horizontalHeader().setSectionResizeMode(0, QHeaderView.Stretch)
        self.usage_table.verticalHeader().setVisible(False)
        usage_layout.addWidget(self.usage_table)
        
        layout.addWidget(usage_group)
        
        return widget
    
    def _create_stat_card(self, title: str, value: str, highlight: bool = False) -> QGroupBox:
        """Create a stat card widget."""
        card = QGroupBox()
        card.setStyleSheet(f"""
            QGroupBox {{
                background-color: {'#fff3e0' if highlight else '#ffffff'};
                border-radius: 8px;
                padding: 16px;
            }}
        """)
        
        layout = QVBoxLayout(card)
        
        title_label = QLabel(title)
        title_label.setStyleSheet("color: #6e6e73; font-size: 12px;")
        layout.addWidget(title_label)
        
        value_label = QLabel(value)
        value_label.setObjectName("value")
        value_label.setStyleSheet("font-size: 24px; font-weight: 700;")
        layout.addWidget(value_label)
        
        return card
    
    def _update_stat_card(self, card: QGroupBox, value: str):
        """Update a stat card's value."""
        value_label = card.findChild(QLabel, "value")
        if value_label:
            value_label.setText(value)
    
    def load_all_reports(self):
        """Load all report data."""
        self._load_inventory_report()
        self._load_production_report()
        self._load_costs_report()
    
    def _load_inventory_report(self):
        """Load inventory report data."""
        # Summary
        summary = self.reports_service.get_inventory_summary()
        self._update_stat_card(self.inv_total_card, str(summary["total_ingredients"]))
        self._update_stat_card(self.inv_value_card, f"${summary['total_value']:.2f}")
        
        # Low stock
        low_stock = self.reports_service.get_low_stock_items()
        self._update_stat_card(self.inv_low_stock_card, str(len(low_stock)))
        
        # Category table
        categories = self.reports_service.get_inventory_by_category()
        self.category_table.setRowCount(0)
        for cat in categories:
            row = self.category_table.rowCount()
            self.category_table.insertRow(row)
            self.category_table.setItem(row, 0, QTableWidgetItem(cat["category"]))
            self.category_table.setItem(row, 1, QTableWidgetItem(str(cat["count"])))
            self.category_table.setItem(row, 2, QTableWidgetItem(f"{cat['total_quantity']:.2f}"))
            self.category_table.setItem(row, 3, QTableWidgetItem(f"${cat['total_value']:.2f}"))
        
        # Low stock table
        self.low_stock_table.setRowCount(0)
        for item in low_stock:
            row = self.low_stock_table.rowCount()
            self.low_stock_table.insertRow(row)
            self.low_stock_table.setItem(row, 0, QTableWidgetItem(item["name"]))
            self.low_stock_table.setItem(row, 1, QTableWidgetItem(item["category"]))
            self.low_stock_table.setItem(row, 2, QTableWidgetItem(f"{item['quantity']:.2f} {item['unit']}"))
            
            status_item = QTableWidgetItem(item["status"])
            if item["status"] == "Out of Stock":
                status_item.setForeground(Qt.red)
            else:
                status_item.setForeground(Qt.darkYellow)
            self.low_stock_table.setItem(row, 3, status_item)
    
    def _load_production_report(self):
        """Load production report data."""
        # Get period
        period_text = self.period_combo.currentText()
        days = {"Last 7 days": 7, "Last 30 days": 30, "Last 90 days": 90, "All time": 9999}.get(period_text, 30)
        
        # Summary
        summary = self.reports_service.get_production_summary(days)
        self._update_stat_card(self.prod_batches_card, str(summary["total_batches"]))
        self._update_stat_card(self.prod_weight_card, f"{summary['total_weight']:.0f} g")
        self._update_stat_card(self.prod_cost_card, f"${summary['total_cost']:.2f}")
        
        # Status breakdown
        for status, label in self.status_labels.items():
            count = summary["by_status"].get(status, 0)
            label.setText(f"{status}: {count}")
        
        # History table
        history = self.reports_service.get_production_history()
        self.history_table.setRowCount(0)
        for batch in history:
            row = self.history_table.rowCount()
            self.history_table.insertRow(row)
            self.history_table.setItem(row, 0, QTableWidgetItem(batch["lot_number"]))
            self.history_table.setItem(row, 1, QTableWidgetItem(batch["recipe_name"]))
            self.history_table.setItem(row, 2, QTableWidgetItem(batch["status"]))
            self.history_table.setItem(row, 3, QTableWidgetItem(f"×{batch['scale']:.1f}"))
            self.history_table.setItem(row, 4, QTableWidgetItem(f"{batch['weight']:.0f} g"))
            self.history_table.setItem(row, 5, QTableWidgetItem(f"${batch['cost']:.2f}"))
    
    def _load_costs_report(self):
        """Load costs report data."""
        # Recipe costs
        recipes = self.reports_service.get_recipe_costs()
        self.recipe_costs_table.setRowCount(0)
        for recipe in recipes:
            row = self.recipe_costs_table.rowCount()
            self.recipe_costs_table.insertRow(row)
            self.recipe_costs_table.setItem(row, 0, QTableWidgetItem(recipe["name"]))
            self.recipe_costs_table.setItem(row, 1, QTableWidgetItem(recipe["type"] or "-"))
            self.recipe_costs_table.setItem(row, 2, QTableWidgetItem(f"${recipe['ingredient_cost']:.2f}"))
            self.recipe_costs_table.setItem(row, 3, QTableWidgetItem(f"{recipe['total_weight']:.0f} g"))
            self.recipe_costs_table.setItem(row, 4, QTableWidgetItem(f"${recipe['cost_per_100g']:.2f}"))
        
        # Ingredient usage
        usage = self.reports_service.get_ingredient_usage()
        self.usage_table.setRowCount(0)
        for ing in usage:
            row = self.usage_table.rowCount()
            self.usage_table.insertRow(row)
            self.usage_table.setItem(row, 0, QTableWidgetItem(ing["name"]))
            self.usage_table.setItem(row, 1, QTableWidgetItem(ing["category"]))
            self.usage_table.setItem(row, 2, QTableWidgetItem(f"{ing['quantity_used']:.2f} g"))
            self.usage_table.setItem(row, 3, QTableWidgetItem(f"${ing['total_cost']:.2f}"))
    
    def _export_table(self, table: QTableWidget, default_name: str):
        """Export a table to CSV."""
        filepath, _ = QFileDialog.getSaveFileName(
            self, "Export CSV", f"{default_name}.csv", "CSV Files (*.csv)"
        )
        
        if not filepath:
            return
        
        # Get table data
        data = []
        headers = [table.horizontalHeaderItem(i).text() for i in range(table.columnCount())]
        
        for row in range(table.rowCount()):
            row_data = {}
            for col in range(table.columnCount()):
                item = table.item(row, col)
                row_data[headers[col]] = item.text() if item else ""
            data.append(row_data)
        
        if self.reports_service.export_to_csv(data, filepath):
            QMessageBox.information(self, "Export Complete", f"Data exported to:\n{filepath}")
        else:
            QMessageBox.warning(self, "Export Failed", "Failed to export data.")
    
    def closeEvent(self, event):
        """Close database session."""
        self.db.close()
        super().closeEvent(event)
