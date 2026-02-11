"""
Layout Styles - Tabs, Menus, Dialogs, Scrollbars, etc.
"""

LAYOUT_STYLES = """
/* ============================================
   Menu Bar
   ============================================ */

QMenuBar {
    background-color: #ffffff;
    border-bottom: 1px solid #d2d2d7;
    padding: 4px 8px;
}

QMenuBar::item {
    background-color: transparent;
    padding: 6px 12px;
    border-radius: 6px;
}

QMenuBar::item:selected {
    background-color: #e8e8ed;
}

QMenu {
    background-color: #ffffff;
    border: 1px solid #d2d2d7;
    border-radius: 8px;
    padding: 4px;
}

QMenu::item {
    padding: 8px 24px;
    border-radius: 4px;
}

QMenu::item:selected {
    background-color: #0071e3;
    color: white;
}

/* ============================================
   Tabs
   ============================================ */

QTabWidget::pane {
    border: 1px solid #d2d2d7;
    border-radius: 12px;
    background-color: #ffffff;
    margin-top: -1px;
}

QTabBar::tab {
    background-color: #e8e8ed;
    border: none;
    padding: 12px 24px;
    margin-right: 4px;
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
    font-weight: 500;
}

QTabBar::tab:selected {
    background-color: #ffffff;
    border-bottom: 2px solid #0071e3;
}

QTabBar::tab:hover:!selected {
    background-color: #d2d2d7;
}

QTabBar::tab:focus {
    outline: 2px solid #0071e3;
}

/* ============================================
   Status Bar
   ============================================ */

QStatusBar {
    background-color: #f5f5f7;
    border-top: 1px solid #d2d2d7;
    padding: 4px 12px;
    color: #6e6e73;
}

/* ============================================
   Scroll Bars
   ============================================ */

QScrollBar:vertical {
    border: none;
    background-color: #f5f5f7;
    width: 12px;
    border-radius: 6px;
}

QScrollBar::handle:vertical {
    background-color: #c7c7cc;
    border-radius: 6px;
    min-height: 30px;
}

QScrollBar::handle:vertical:hover {
    background-color: #a1a1a6;
}

QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical {
    height: 0;
}

/* ============================================
   Dialogs
   ============================================ */

QDialog {
    background-color: #f5f5f7;
}

/* ============================================
   Group Boxes
   ============================================ */

QGroupBox {
    background-color: #ffffff;
    border: 1px solid #d2d2d7;
    border-radius: 12px;
    margin-top: 12px;
    padding: 16px;
    font-weight: 600;
}

QGroupBox::title {
    subcontrol-origin: margin;
    subcontrol-position: top left;
    padding: 4px 12px;
    color: #1d1d1f;
}

/* ============================================
   Progress Bars
   ============================================ */

QProgressBar {
    background-color: #e8e8ed;
    border: none;
    border-radius: 4px;
    height: 8px;
    text-align: center;
}

QProgressBar::chunk {
    background-color: #34c759;
    border-radius: 4px;
}
"""
