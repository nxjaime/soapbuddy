"""
Lye Results Panel

Displays lye calculation results and per-oil breakdown.
"""
from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QGroupBox, QLabel, QTableWidget,
    QTableWidgetItem, QHeaderView, QFrame
)


class LyeResultsPanel(QWidget):
    """
    Panel displaying lye calculation results.
    """
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setup_ui()
    
    def setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        
        # Results Group
        results_group = QGroupBox("Calculation Results")
        results_group.setStyleSheet("QGroupBox { background-color: #e8f5e9; }")
        results_layout = QVBoxLayout(results_group)
        
        # Total Oils
        self.total_oils_label = QLabel("Total Oils: 0.00 g")
        self.total_oils_label.setStyleSheet("font-size: 16px;")
        results_layout.addWidget(self.total_oils_label)
        
        # Divider
        line = QFrame()
        line.setFrameShape(QFrame.HLine)
        line.setStyleSheet("background-color: #c8e6c9;")
        results_layout.addWidget(line)
        
        # Lye Amount (Big!)
        self.lye_result_label = QLabel("Lye: 0.00 g")
        self.lye_result_label.setStyleSheet("font-size: 32px; font-weight: 700; color: #1b5e20;")
        results_layout.addWidget(self.lye_result_label)
        
        self.lye_type_label = QLabel("NaOH (Sodium Hydroxide)")
        self.lye_type_label.setStyleSheet("color: #388e3c;")
        results_layout.addWidget(self.lye_type_label)
        
        line2 = QFrame()
        line2.setFrameShape(QFrame.HLine)
        line2.setStyleSheet("background-color: #c8e6c9;")
        results_layout.addWidget(line2)
        
        # Water Amount
        self.water_label = QLabel("Water: 0.00 g")
        self.water_label.setStyleSheet("font-size: 20px; font-weight: 600; color: #0277bd;")
        results_layout.addWidget(self.water_label)
        
        # Water range
        self.water_range_label = QLabel("Range: 0.00 - 0.00 g")
        self.water_range_label.setStyleSheet("color: #6e6e73; font-size: 12px;")
        results_layout.addWidget(self.water_range_label)
        
        # Superfat info
        self.superfat_label = QLabel("Superfat: 5%")
        self.superfat_label.setStyleSheet("color: #6e6e73; margin-top: 8px;")
        results_layout.addWidget(self.superfat_label)
        
        results_layout.addStretch()
        layout.addWidget(results_group)
        
        # Breakdown table
        breakdown_group = QGroupBox("Per-Oil Breakdown")
        breakdown_layout = QVBoxLayout(breakdown_group)
        
        self.breakdown_table = QTableWidget()
        self.breakdown_table.setColumnCount(3)
        self.breakdown_table.setHorizontalHeaderLabels(["Oil", "Weight (g)", "Lye Required (g)"])
        self.breakdown_table.horizontalHeader().setSectionResizeMode(0, QHeaderView.Stretch)
        self.breakdown_table.verticalHeader().setVisible(False)
        breakdown_layout.addWidget(self.breakdown_table)
        
        layout.addWidget(breakdown_group)
    
    def update_results(self, result: dict, lye_type: str, superfat: float, water_ratio: float):
        """Update the results display with calculation data."""
        self.total_oils_label.setText(f"Total Oils: {result.get('total_oils', 0):.2f} g")
        
        lye_amount = result.get("lye_amount", 0)
        self.lye_result_label.setText(f"Lye: {lye_amount:.2f} g")
        
        # Format lye type display
        if lye_type == "NaOH":
            self.lye_type_label.setText("NaOH (Sodium Hydroxide)")
        elif lye_type == "KOH":
            self.lye_type_label.setText("KOH (Potassium Hydroxide)")
        else:
            self.lye_type_label.setText("Dual Lye")
        
        # Calculate water based on user-selected ratio
        water = lye_amount * water_ratio
        self.water_label.setText(f"Water: {water:.2f} g")
        
        water_range = result.get("water_range", {})
        self.water_range_label.setText(
            f"Range: {water_range.get('min', 0):.2f} - {water_range.get('max', 0):.2f} g"
        )
        
        self.superfat_label.setText(f"Superfat: {superfat}%")
        
        # Update breakdown table
        self.breakdown_table.setRowCount(0)
        for item in result.get("breakdown", []):
            row = self.breakdown_table.rowCount()
            self.breakdown_table.insertRow(row)
            self.breakdown_table.setItem(row, 0, QTableWidgetItem(item["name"]))
            self.breakdown_table.setItem(row, 1, QTableWidgetItem(f"{item['weight']:.2f}"))
            
            lye_key = "lye_naoh" if lye_type == "NaOH" else "lye_koh"
            self.breakdown_table.setItem(row, 2, QTableWidgetItem(f"{item.get(lye_key, 0):.2f}"))
    
    def clear(self):
        """Reset results to default state."""
        self.total_oils_label.setText("Total Oils: 0.00 g")
        self.lye_result_label.setText("Lye: 0.00 g")
        self.water_label.setText("Water: 0.00 g")
        self.water_range_label.setText("Range: 0.00 - 0.00 g")
        self.breakdown_table.setRowCount(0)
