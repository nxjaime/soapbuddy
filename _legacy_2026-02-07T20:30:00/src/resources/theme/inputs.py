"""
Input Field Styles
"""

INPUT_STYLES = """
/* ============================================
   Input Fields
   ============================================ */

QLineEdit, QSpinBox, QDoubleSpinBox, QComboBox {
    background-color: #ffffff;
    border: 1px solid #d2d2d7;
    border-radius: 8px;
    padding: 10px 12px;
    min-height: 20px;
    selection-background-color: #0071e3;
}

QLineEdit:focus, QSpinBox:focus, QDoubleSpinBox:focus, QComboBox:focus {
    border: 2px solid #0071e3;
    padding: 9px 11px;
}

QComboBox::drop-down {
    border: none;
    width: 30px;
}

QComboBox::down-arrow {
    width: 12px;
    height: 12px;
}

QTextEdit {
    background-color: #ffffff;
    border: 1px solid #d2d2d7;
    border-radius: 8px;
    padding: 10px;
}

QTextEdit:focus {
    border: 2px solid #0071e3;
}
"""
