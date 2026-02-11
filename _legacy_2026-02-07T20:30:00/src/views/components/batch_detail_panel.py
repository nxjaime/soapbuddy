"""
Production Batch Detail Panel

Displays detailed information about a selected production batch.
"""
from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QGroupBox, QLabel, QTableWidget,
    QTableWidgetItem, QHeaderView, QPushButton, QFrame
)
from PySide6.QtCore import Qt, Signal


class BatchDetailPanel(QWidget):
    """
    Right-side panel showing production batch details.
    
    Signals:
        status_changed: Emitted when a status action is taken.
    """
    
    status_changed = Signal()
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.production_service = None
        self.current_batch = None
        self.setup_ui()
    
    def setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(16, 0, 0, 0)
        
        # Batch header
        self.lot_label = QLabel("Select a batch")
        self.lot_label.setStyleSheet("font-size: 20px; font-weight: 600;")
        layout.addWidget(self.lot_label)
        
        self.recipe_label = QLabel("")
        self.recipe_label.setStyleSheet("color: #6e6e73;")
        layout.addWidget(self.recipe_label)
        
        # Status badge
        self.status_label = QLabel("")
        self.status_label.setStyleSheet("font-weight: 600; padding: 4px 12px; border-radius: 4px;")
        layout.addWidget(self.status_label)
        
        # Divider
        line = QFrame()
        line.setFrameShape(QFrame.HLine)
        line.setStyleSheet("background-color: #d2d2d7;")
        layout.addWidget(line)
        
        # Details group
        self._setup_details_group(layout)
        
        # Ingredients group
        self._setup_ingredients_group(layout)
        
        layout.addStretch()
        
        # Action buttons
        self._setup_actions(layout)
    
    def _setup_details_group(self, layout):
        """Setup the batch details group."""
        details_group = QGroupBox("Batch Details")
        from PySide6.QtWidgets import QFormLayout
        details_layout = QFormLayout(details_group)
        
        self.scale_label = QLabel("-")
        details_layout.addRow("Scale Factor:", self.scale_label)
        
        self.weight_label = QLabel("-")
        details_layout.addRow("Total Weight:", self.weight_label)
        
        self.cost_label = QLabel("-")
        self.cost_label.setStyleSheet("font-weight: 600;")
        details_layout.addRow("Total Cost:", self.cost_label)
        
        self.planned_label = QLabel("-")
        details_layout.addRow("Planned Date:", self.planned_label)
        
        self.production_label = QLabel("-")
        details_layout.addRow("Production Date:", self.production_label)
        
        self.cure_label = QLabel("-")
        details_layout.addRow("Cure Ready:", self.cure_label)
        
        layout.addWidget(details_group)
    
    def _setup_ingredients_group(self, layout):
        """Setup the ingredients table."""
        ing_group = QGroupBox("Ingredients Used")
        ing_layout = QVBoxLayout(ing_group)
        
        self.ing_table = QTableWidget()
        self.ing_table.setColumnCount(4)
        self.ing_table.setHorizontalHeaderLabels(["Ingredient", "Planned", "Actual", "Cost"])
        self.ing_table.horizontalHeader().setSectionResizeMode(0, QHeaderView.Stretch)
        self.ing_table.verticalHeader().setVisible(False)
        self.ing_table.setMaximumHeight(150)
        ing_layout.addWidget(self.ing_table)
        
        layout.addWidget(ing_group)
    
    def _setup_actions(self, layout):
        """Setup action buttons based on status."""
        actions_group = QGroupBox("Actions")
        self.actions_layout = QHBoxLayout(actions_group)
        
        self.start_btn = QPushButton("▶ Start Production")
        self.start_btn.clicked.connect(self._start_production)
        self.actions_layout.addWidget(self.start_btn)
        
        self.cure_btn = QPushButton("🕐 Move to Curing")
        self.cure_btn.setProperty("secondary", True)
        self.cure_btn.clicked.connect(self._move_to_curing)
        self.actions_layout.addWidget(self.cure_btn)
        
        self.complete_btn = QPushButton("✓ Complete")
        self.complete_btn.clicked.connect(self._complete_batch)
        self.actions_layout.addWidget(self.complete_btn)
        
        self.cancel_btn = QPushButton("Cancel")
        self.cancel_btn.setProperty("danger", True)
        self.cancel_btn.clicked.connect(self._cancel_batch)
        self.actions_layout.addWidget(self.cancel_btn)
        
        layout.addWidget(actions_group)
    
    def load_batch(self, batch_id: int, production_service):
        """Load batch details into the panel."""
        self.production_service = production_service
        summary = production_service.get_batch_summary(batch_id)
        
        if not summary:
            self.clear()
            return
        
        self.current_batch = production_service.get_by_id(batch_id)
        
        self.lot_label.setText(summary["lot_number"])
        self.recipe_label.setText(f"Recipe: {summary['recipe_name']}")
        
        # Status with color
        status = summary["status"]
        self.status_label.setText(status)
        self._style_status(status)
        
        # Details
        self.scale_label.setText(f"×{summary['scale_factor']:.1f}")
        self.weight_label.setText(f"{summary['total_weight']:.2f} g")
        self.cost_label.setText(f"${summary['total_cost']:.2f}")
        
        self.planned_label.setText(
            summary["planned_date"].strftime("%Y-%m-%d") if summary["planned_date"] else "-"
        )
        self.production_label.setText(
            summary["production_date"].strftime("%Y-%m-%d %H:%M") if summary["production_date"] else "-"
        )
        self.cure_label.setText(
            summary["cure_end_date"].strftime("%Y-%m-%d") if summary["cure_end_date"] else "-"
        )
        
        # Ingredients table
        self.ing_table.setRowCount(0)
        for ing in summary.get("ingredients", []):
            row = self.ing_table.rowCount()
            self.ing_table.insertRow(row)
            
            self.ing_table.setItem(row, 0, QTableWidgetItem(ing["name"]))
            self.ing_table.setItem(row, 1, QTableWidgetItem(f"{ing['planned']:.2f} {ing['unit']}"))
            actual = ing["actual"] if ing["actual"] else "-"
            self.ing_table.setItem(row, 2, QTableWidgetItem(
                f"{actual:.2f} {ing['unit']}" if isinstance(actual, float) else actual
            ))
            self.ing_table.setItem(row, 3, QTableWidgetItem(f"${ing['cost']:.2f}"))
        
        # Update button visibility
        self._update_buttons(status)
    
    def _style_status(self, status: str):
        """Apply color styling to status label."""
        colors = {
            "Planned": "background-color: #e3f2fd; color: #1565c0;",
            "In Progress": "background-color: #fff3e0; color: #ef6c00;",
            "Curing": "background-color: #fce4ec; color: #c2185b;",
            "Complete": "background-color: #e8f5e9; color: #2e7d32;",
            "Cancelled": "background-color: #fafafa; color: #757575;"
        }
        self.status_label.setStyleSheet(
            colors.get(status, "") + " font-weight: 600; padding: 4px 12px; border-radius: 4px;"
        )
    
    def _update_buttons(self, status: str):
        """Show/hide buttons based on status."""
        self.start_btn.setVisible(status == "Planned")
        self.cure_btn.setVisible(status == "In Progress")
        self.complete_btn.setVisible(status in ["Curing", "In Progress"])
        self.cancel_btn.setVisible(status not in ["Complete", "Cancelled"])
    
    def _start_production(self):
        if not self.current_batch or not self.production_service:
            return
        
        from PySide6.QtWidgets import QMessageBox
        success, msg = self.production_service.start_production(self.current_batch.id)
        
        if success:
            QMessageBox.information(self, "Production Started", msg)
        else:
            QMessageBox.warning(self, "Cannot Start", msg)
        
        self.status_changed.emit()
    
    def _move_to_curing(self):
        if not self.current_batch or not self.production_service:
            return
        
        from PySide6.QtWidgets import QMessageBox
        success, msg = self.production_service.move_to_curing(self.current_batch.id)
        
        if success:
            QMessageBox.information(self, "Curing", msg)
        else:
            QMessageBox.warning(self, "Error", msg)
        
        self.status_changed.emit()
    
    def _complete_batch(self):
        if not self.current_batch or not self.production_service:
            return
        
        from PySide6.QtWidgets import QMessageBox
        success, msg = self.production_service.complete_batch(self.current_batch.id)
        
        if success:
            QMessageBox.information(self, "Complete", msg)
        else:
            QMessageBox.warning(self, "Error", msg)
        
        self.status_changed.emit()
    
    def _cancel_batch(self):
        if not self.current_batch or not self.production_service:
            return
        
        from PySide6.QtWidgets import QMessageBox
        reply = QMessageBox.question(
            self, "Confirm Cancel",
            f"Cancel batch {self.current_batch.lot_number}?\n\n"
            "Do you want to restore inventory?",
            QMessageBox.Yes | QMessageBox.No | QMessageBox.Cancel,
            QMessageBox.Cancel
        )
        
        if reply == QMessageBox.Cancel:
            return
        
        restore = reply == QMessageBox.Yes
        success, msg = self.production_service.cancel_batch(self.current_batch.id, restore)
        
        if success:
            QMessageBox.information(self, "Cancelled", msg)
        else:
            QMessageBox.warning(self, "Error", msg)
        
        self.status_changed.emit()
    
    def clear(self):
        """Clear the detail panel."""
        self.lot_label.setText("Select a batch")
        self.recipe_label.setText("")
        self.status_label.setText("")
        self.scale_label.setText("-")
        self.weight_label.setText("-")
        self.cost_label.setText("-")
        self.planned_label.setText("-")
        self.production_label.setText("-")
        self.cure_label.setText("-")
        self.ing_table.setRowCount(0)
        self.current_batch = None
