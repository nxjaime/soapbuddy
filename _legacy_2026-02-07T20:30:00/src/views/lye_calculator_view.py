"""
Lye Calculator View

Interactive calculator for determining lye and water amounts.
"""
from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QFormLayout, QGroupBox,
    QLabel, QPushButton, QDoubleSpinBox, QComboBox, QTableWidget,
    QTableWidgetItem, QHeaderView, QAbstractItemView, QStyle, QMessageBox
)
from PySide6.QtCore import Qt
from src.views.components.lye_results_panel import LyeResultsPanel
from src.services.lye_calculator import LyeCalculator, DEFAULT_SAP_VALUES


class LyeCalculatorView(QWidget):
    """
    Interactive lye calculator widget.
    """
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.oil_entries = []
        self.setup_ui()
    
    def setup_ui(self):
        main_layout = QHBoxLayout(self)
        main_layout.setContentsMargins(24, 24, 24, 24)
        main_layout.setSpacing(24)
        
        # Left side - Input
        left_panel = QVBoxLayout()
        self._setup_header(left_panel)
        self._setup_settings(left_panel)
        self._setup_oil_input(left_panel)
        self._setup_oil_table(left_panel)
        left_panel.addStretch()
        main_layout.addLayout(left_panel, 1)
        
        # Right side - Results (using extracted component)
        self.results_panel = LyeResultsPanel(self)
        main_layout.addWidget(self.results_panel, 1)
    
    def _setup_header(self, layout):
        """Setup title and subtitle."""
        title = QLabel("🧪 Lye Calculator")
        title.setStyleSheet("font-size: 24px; font-weight: 700;")
        layout.addWidget(title)
        
        subtitle = QLabel("Calculate NaOH or KOH requirements for your recipe")
        subtitle.setStyleSheet("color: #6e6e73; margin-bottom: 12px;")
        layout.addWidget(subtitle)
    
    def _setup_settings(self, layout):
        """Setup recipe settings group."""
        settings_group = QGroupBox("Recipe Settings")
        settings_form = QFormLayout(settings_group)
        
        self.lye_type_combo = QComboBox()
        self.lye_type_combo.addItems(["NaOH (Sodium Hydroxide)", "KOH (Potassium Hydroxide)", "Dual Lye"])
        self.lye_type_combo.currentTextChanged.connect(self.calculate)
        settings_form.addRow("Lye Type:", self.lye_type_combo)
        
        self.superfat_spin = QDoubleSpinBox()
        self.superfat_spin.setRange(0, 30)
        self.superfat_spin.setValue(5.0)
        self.superfat_spin.setSuffix(" %")
        self.superfat_spin.valueChanged.connect(self.calculate)
        settings_form.addRow("Superfat:", self.superfat_spin)
        
        self.water_ratio_spin = QDoubleSpinBox()
        self.water_ratio_spin.setRange(1.0, 3.0)
        self.water_ratio_spin.setValue(2.0)
        self.water_ratio_spin.setDecimals(1)
        self.water_ratio_spin.setSingleStep(0.1)
        self.water_ratio_spin.setSuffix(" : 1 (water:lye)")
        settings_form.addRow("Water Ratio:", self.water_ratio_spin)
        
        layout.addWidget(settings_group)
    
    def _setup_oil_input(self, layout):
        """Setup oil input section."""
        add_oil_group = QGroupBox("Add Oils")
        add_oil_layout = QVBoxLayout(add_oil_group)
        
        # Standard oil selection
        oil_row = QHBoxLayout()
        
        self.oil_combo = QComboBox()
        self.oil_combo.addItems(sorted(DEFAULT_SAP_VALUES.keys()))
        self.oil_combo.setMinimumWidth(150)
        oil_row.addWidget(self.oil_combo)
        
        self.oil_weight_spin = QDoubleSpinBox()
        self.oil_weight_spin.setRange(0, 99999)
        self.oil_weight_spin.setValue(100)
        self.oil_weight_spin.setSuffix(" g")
        oil_row.addWidget(self.oil_weight_spin)
        
        add_oil_btn = QPushButton("Add")
        add_oil_btn.clicked.connect(self.add_oil)
        oil_row.addWidget(add_oil_btn)
        add_oil_layout.addLayout(oil_row)
        
        # Custom oil input
        from PySide6.QtWidgets import QLineEdit
        custom_row = QHBoxLayout()
        
        self.custom_name = QLineEdit()
        self.custom_name.setPlaceholderText("Custom oil name")
        custom_row.addWidget(self.custom_name)
        
        self.custom_sap = QDoubleSpinBox()
        self.custom_sap.setRange(0, 1)
        self.custom_sap.setDecimals(4)
        self.custom_sap.setValue(0.134)
        self.custom_sap.setPrefix("SAP: ")
        custom_row.addWidget(self.custom_sap)
        
        self.custom_weight = QDoubleSpinBox()
        self.custom_weight.setRange(0, 99999)
        self.custom_weight.setValue(100)
        self.custom_weight.setSuffix(" g")
        custom_row.addWidget(self.custom_weight)
        
        add_custom_btn = QPushButton("Add Custom")
        add_custom_btn.setProperty("secondary", True)
        add_custom_btn.clicked.connect(self.add_custom_oil)
        custom_row.addWidget(add_custom_btn)
        add_oil_layout.addLayout(custom_row)
        
        layout.addWidget(add_oil_group)
    
    def _setup_oil_table(self, layout):
        """Setup the oil table with clear button."""
        oil_table_group = QGroupBox("Recipe Oils")
        oil_table_layout = QVBoxLayout(oil_table_group)
        
        self.oil_table = QTableWidget()
        self.oil_table.setColumnCount(4)
        self.oil_table.setHorizontalHeaderLabels(["Oil", "Weight (g)", "SAP (NaOH)", ""])
        self.oil_table.horizontalHeader().setSectionResizeMode(0, QHeaderView.Stretch)
        self.oil_table.setSelectionBehavior(QAbstractItemView.SelectRows)
        self.oil_table.verticalHeader().setVisible(False)
        self.oil_table.setMaximumHeight(200)
        oil_table_layout.addWidget(self.oil_table)
        
        clear_btn = QPushButton("Clear All Oils")
        clear_btn.setProperty("danger", True)
        clear_btn.clicked.connect(self.clear_oils)
        oil_table_layout.addWidget(clear_btn)
        
        layout.addWidget(oil_table_group)
    
    def add_oil(self):
        """Add selected oil to the recipe."""
        name = self.oil_combo.currentText()
        weight = self.oil_weight_spin.value()
        sap = DEFAULT_SAP_VALUES.get(name, 0.134)
        
        if weight > 0:
            self.oil_entries.append({"name": name, "weight": weight, "sap_naoh": sap})
            self.update_oil_table()
            self.calculate()
    
    def add_custom_oil(self):
        """Add a custom oil."""
        name = self.custom_name.text().strip() or "Custom Oil"
        weight = self.custom_weight.value()
        sap = self.custom_sap.value()
        
        if weight > 0:
            self.oil_entries.append({"name": name, "weight": weight, "sap_naoh": sap})
            self.update_oil_table()
            self.calculate()
            self.custom_name.clear()
    
    def remove_oil(self, index):
        """Remove an oil from the recipe."""
        if 0 <= index < len(self.oil_entries):
            del self.oil_entries[index]
            self.update_oil_table()
            self.calculate()
    
    def clear_oils(self):
        """Clear all oils with confirmation."""
        if not self.oil_entries:
            return
        
        reply = QMessageBox.question(
            self, "Confirm Clear",
            "Remove all oils from the recipe?\n\nThis cannot be undone.",
            QMessageBox.Yes | QMessageBox.No,
            QMessageBox.No
        )
        
        if reply == QMessageBox.Yes:
            self.oil_entries.clear()
            self.update_oil_table()
            self.calculate()
    
    def update_oil_table(self):
        """Update the oil table display."""
        self.oil_table.setRowCount(0)
        
        for i, oil in enumerate(self.oil_entries):
            row = self.oil_table.rowCount()
            self.oil_table.insertRow(row)
            
            self.oil_table.setItem(row, 0, QTableWidgetItem(oil["name"]))
            self.oil_table.setItem(row, 1, QTableWidgetItem(f"{oil['weight']:.2f}"))
            self.oil_table.setItem(row, 2, QTableWidgetItem(f"{oil['sap_naoh']:.4f}"))
            
            remove_btn = QPushButton()
            remove_btn.setIcon(self.style().standardIcon(QStyle.SP_TrashIcon))
            remove_btn.setToolTip("Remove this oil")
            remove_btn.setMaximumWidth(36)
            remove_btn.setStyleSheet("background-color: transparent; border: 1px solid #ff3b30; border-radius: 4px;")
            remove_btn.clicked.connect(lambda checked, idx=i: self.remove_oil(idx))
            self.oil_table.setCellWidget(row, 3, remove_btn)
    
    def calculate(self):
        """Run the lye calculation and update results."""
        if not self.oil_entries:
            self.results_panel.clear()
            return
        
        lye_type = self._get_lye_type()
        superfat = self.superfat_spin.value()
        water_ratio = self.water_ratio_spin.value()
        
        result = LyeCalculator.calculate_lye(self.oil_entries, lye_type, superfat)
        self.results_panel.update_results(result, lye_type, superfat, water_ratio)
    
    def _get_lye_type(self) -> str:
        """Get lye type from combo selection."""
        lye_type_text = self.lye_type_combo.currentText()
        if "NaOH" in lye_type_text:
            return "NaOH"
        elif "KOH" in lye_type_text:
            return "KOH"
        return "Dual"
