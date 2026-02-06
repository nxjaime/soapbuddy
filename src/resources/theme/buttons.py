"""
Button Styles
"""

BUTTON_STYLES = """
/* ============================================
   Buttons & Interaction
   ============================================ */

/* Global Cursor Rule for Clickable Elements */
QAbstractButton, QTabBar::tab, QComboBox, QCheckBox, QRadioButton {
    qproperty-cursor: "PointingHandCursor";
}

QPushButton {
    background-color: #0071e3;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 10px 20px;
    font-weight: 500;
    min-width: 80px;
    min-height: 36px;
}

QPushButton:hover {
    background-color: #0077ed;
}

QPushButton:pressed {
    background-color: #006edb;
}

QPushButton:focus {
    outline: 2px solid #0071e3;
    outline-offset: 2px;
}

QPushButton:disabled {
    background-color: #c7c7cc;
    color: #8e8e93;
}

QPushButton[secondary="true"] {
    background-color: #e8e8ed;
    color: #1d1d1f;
}

QPushButton[secondary="true"]:hover {
    background-color: #d2d2d7;
}

QPushButton[danger="true"] {
    background-color: #ff3b30;
}

QPushButton[danger="true"]:hover {
    background-color: #ff453a;
}

QDialogButtonBox QPushButton {
    min-width: 100px;
}
"""
