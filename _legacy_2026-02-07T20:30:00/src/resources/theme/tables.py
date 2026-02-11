"""
Table and Data Display Styles
"""

TABLE_STYLES = """
/* ============================================
   Tables
   ============================================ */

QTableWidget, QTableView {
    background-color: #ffffff;
    alternate-background-color: #f8f8f8;
    border: 1px solid #d2d2d7;
    border-radius: 12px;
    gridline-color: #e5e5ea;
    selection-background-color: #0071e3;
    selection-color: white;
}

QTableWidget::item, QTableView::item {
    padding: 12px;
    border-bottom: 1px solid #f2f2f7;
    color: #1d1d1f;
}

QTableWidget::item:alternate, QTableView::item:alternate {
    background-color: #f8f8f8;
}

QTableWidget::item:selected, QTableView::item:selected {
    background-color: #0071e3;
    color: white;
}

QTableWidget::item:focus, QTableView::item:focus {
    outline: 2px solid #0071e3;
}

QHeaderView::section {
    background-color: #f5f5f7;
    border: none;
    border-bottom: 2px solid #d2d2d7;
    padding: 12px;
    font-weight: 600;
    color: #6e6e73;
}
"""
