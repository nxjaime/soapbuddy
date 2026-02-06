"""
Main Window

The primary application window with tabbed interface.
"""
from PySide6.QtWidgets import (
    QMainWindow, QWidget, QVBoxLayout, QTabWidget,
    QMenuBar, QStatusBar, QMessageBox, QLabel, QPushButton, QGroupBox,
    QFileDialog
)
from PySide6.QtCore import Qt
from PySide6.QtGui import QAction
from src.views.ingredients_view import IngredientsView
from src.views.lye_calculator_view import LyeCalculatorView
from src.views.recipes_view import RecipesView
from src.views.production_view import ProductionView
from src.views.reports_view import ReportsView
from src.services.reports_service import ReportsService
from src.database.db import SessionLocal
from src.resources.styles import MAIN_STYLESHEET
from src.services.backup_service import BackupService
from src.views.settings_dialog import SettingsDialog
from PySide6.QtCore import QSettings, QTimer
from datetime import datetime, timedelta


class MainWindow(QMainWindow):
    """
    Main application window with tabbed navigation.
    """
    
    def __init__(self):
        super().__init__()
        self.setWindowTitle("SoapManager - Professional Soap Making Tool")
        self.resize(1200, 800)
        self.setMinimumSize(900, 600)
        
        # Apply stylesheet
        self.setStyleSheet(MAIN_STYLESHEET)
        
        # Central Widget
        self.setup_ui()
        
        # Menu Bar
        self.create_menu_bar()
        
        # Status Bar
        self.setStatusBar(QStatusBar(self))
        self.statusBar().showMessage("Ready")

        # Check for auto-backups after a short delay to let UI load
        QTimer.singleShot(1000, self.check_auto_backup)
    
    def setup_ui(self):
        """Setup the main UI with tabs."""
        central_widget = QWidget()
        layout = QVBoxLayout(central_widget)
        layout.setContentsMargins(0, 0, 0, 0)
        
        # Tab Widget
        self.tabs = QTabWidget()
        self.tabs.setDocumentMode(True)
        
        # Dashboard Tab
        self.dashboard = self._create_dashboard()
        self.tabs.addTab(self.dashboard, "🏠 Dashboard")
        
        # Ingredients Tab
        self.ingredients_view = IngredientsView(self)
        self.tabs.addTab(self.ingredients_view, "📦 Ingredients")
        
        # Lye Calculator Tab
        self.lye_calc_view = LyeCalculatorView(self)
        self.tabs.addTab(self.lye_calc_view, "🧪 Lye Calculator")
        
        # Recipes Tab
        self.recipes_view = RecipesView(self)
        self.tabs.addTab(self.recipes_view, "📝 Recipes")
        
        # Production Tab
        self.production_view = ProductionView(self)
        self.tabs.addTab(self.production_view, "🏭 Production")
        
        # Reports Tab
        self.reports_view = ReportsView(self)
        self.tabs.addTab(self.reports_view, "📊 Reports")
        
        # Refresh dashboard when tab changes
        self.tabs.currentChanged.connect(self._on_tab_changed)
        
        layout.addWidget(self.tabs)
        self.setCentralWidget(central_widget)
    
    def create_menu_bar(self):
        """Create the application menu bar."""
        menu_bar = self.menuBar()
        
        # File Menu
        file_menu = menu_bar.addMenu("&File")
        
        new_recipe = QAction("&New Recipe", self)
        new_recipe.setShortcut("Ctrl+N")
        file_menu.addAction(new_recipe)
        
        file_menu.addSeparator()
        
        import_action = QAction("&Import...", self)
        import_action.setShortcut("Ctrl+I")
        file_menu.addAction(import_action)
        
        export_action = QAction("&Export...", self)
        export_action.setShortcut("Ctrl+E")
        file_menu.addAction(export_action)
        
        file_menu.addSeparator()
        
        backup_action = QAction("&Backup Database...", self)
        backup_action.setStatusTip("Create a backup copy of the database")
        backup_action.triggered.connect(self.backup_database)
        file_menu.addAction(backup_action)
        
        file_menu.addSeparator()
        
        exit_action = file_menu.addAction("E&xit")
        exit_action.setShortcut("Ctrl+Q")
        exit_action.triggered.connect(self.close)
        
        # Edit Menu
        edit_menu = menu_bar.addMenu("&Edit")
        
        preferences = QAction("&Preferences...", self)
        preferences.setShortcut("Ctrl+,")
        preferences.triggered.connect(self.show_settings)
        edit_menu.addAction(preferences)
        
        # View Menu
        view_menu = menu_bar.addMenu("&View")
        
        view_dashboard = QAction("&Dashboard", self)
        view_dashboard.triggered.connect(lambda: self.tabs.setCurrentIndex(0))
        view_menu.addAction(view_dashboard)
        
        view_ingredients = QAction("&Ingredients", self)
        view_ingredients.triggered.connect(lambda: self.tabs.setCurrentIndex(1))
        view_menu.addAction(view_ingredients)
        
        view_calculator = QAction("&Lye Calculator", self)
        view_calculator.triggered.connect(lambda: self.tabs.setCurrentIndex(2))
        view_menu.addAction(view_calculator)
        
        # Tools Menu
        tools_menu = menu_bar.addMenu("&Tools")
        
        lye_calc = QAction("&Lye Calculator", self)
        lye_calc.triggered.connect(lambda: self.tabs.setCurrentIndex(2))
        tools_menu.addAction(lye_calc)
        
        unit_converter = QAction("&Unit Converter", self)
        tools_menu.addAction(unit_converter)
        
        # Help Menu
        help_menu = menu_bar.addMenu("&Help")
        
        docs_action = QAction("&Documentation", self)
        help_menu.addAction(docs_action)
        
        help_menu.addSeparator()
        
        about_action = help_menu.addAction("&About SoapManager")
        about_action.triggered.connect(self.show_about_dialog)
    
    def backup_database(self):
        """Handle database backup."""
        file_path, _ = QFileDialog.getSaveFileName(
            self,
            "Backup Database",
            "soapmanager_backup.db",
            "SQLite Database (*.db);;All Files (*)"
        )
        
        if file_path:
            try:
                BackupService.create_backup(file_path)
                QMessageBox.information(
                    self,
                    "Backup Successful",
                    f"Database successfully backed up to:\n{file_path}"
                )
            except Exception as e:
                QMessageBox.critical(
                    self,
                    "Backup Failed",
                    f"An error occurred while backing up the database:\n{str(e)}"
                )
    
    def show_about_dialog(self):
        """Show the About dialog."""
        QMessageBox.about(
            self,
            "About SoapManager",
            "<h2>SoapManager</h2>"
            "<p>Version 1.0.0</p>"
            "<p>A lightweight, cross-platform soap making inventory and recipe manager.</p>"
            "<p>Built with Python and PySide6 (Qt6)</p>"
            "<hr>"
            "<p><small>© 2024 SoapManager Team</small></p>"
        )

    def show_settings(self):
        """Open the settings dialog."""
        dialog = SettingsDialog(self)
        if dialog.exec():
            # Refresh if needed
            self.statusBar().showMessage("Settings saved")

    def check_auto_backup(self):
        """Check if an automated backup is due and run it."""
        settings = QSettings("SoapManager", "SoapManagerApp")
        
        if not settings.value("backup/auto_enabled", False, type=bool):
            return
        
        destination_type = settings.value("backup/destination_type", "local")
        
        # For local backups, we need a location
        if destination_type == "local":
            location = settings.value("backup/location", "")
            if not location:
                return
            
        frequency = settings.value("backup/frequency", "Daily")
        last_run_str = settings.value("backup/last_run", "")
        
        should_run = False
        if not last_run_str:
            should_run = True
        else:
            try:
                last_run = datetime.strptime(last_run_str, "%Y-%m-%d %H:%M:%S")
                now = datetime.now()
                
                if frequency == "Daily" and (now - last_run) > timedelta(days=1):
                    should_run = True
                elif frequency == "Weekly" and (now - last_run) > timedelta(weeks=1):
                    should_run = True
            except ValueError:
                should_run = True  # reset if format is wrong
                
        if should_run:
            try:
                if destination_type == "local":
                    location = settings.value("backup/location", "")
                    result = BackupService.create_auto_backup(location)
                else:
                    # Cloud backup (google_drive or dropbox)
                    result = BackupService.create_cloud_backup(destination_type)
                
                now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                settings.setValue("backup/last_run", now_str)
                self.statusBar().showMessage(f"Auto-backup completed: {result}", 5000)
            except Exception as e:
                self.statusBar().showMessage(f"Auto-backup failed: {str(e)}", 10000)


    def _create_dashboard(self) -> QWidget:
        """Create the dashboard with live stats."""
        from PySide6.QtWidgets import QHBoxLayout, QGroupBox, QGridLayout
        
        dashboard = QWidget()
        layout = QVBoxLayout(dashboard)
        layout.setContentsMargins(24, 24, 24, 24)
        
        # Welcome header
        welcome = QLabel("Welcome to SoapManager")
        welcome.setStyleSheet("font-size: 32px; font-weight: 700; color: #1d1d1f;")
        layout.addWidget(welcome, alignment=Qt.AlignCenter)
        
        subtitle = QLabel("Your professional soap making companion")
        subtitle.setStyleSheet("font-size: 16px; color: #6e6e73; margin-bottom: 24px;")
        layout.addWidget(subtitle, alignment=Qt.AlignCenter)
        
        # Stats cards
        stats_layout = QHBoxLayout()
        
        self.dash_ingredients = self._create_dash_card("📦 Ingredients", "0", "Total in inventory")
        stats_layout.addWidget(self.dash_ingredients)
        
        self.dash_recipes = self._create_dash_card("📝 Recipes", "0", "Saved recipes")
        stats_layout.addWidget(self.dash_recipes)
        
        self.dash_batches = self._create_dash_card("🏭 Batches", "0", "Total batches")
        stats_layout.addWidget(self.dash_batches)
        
        self.dash_alerts = self._create_dash_card("⚠️ Alerts", "0", "Low stock items", highlight=True)
        stats_layout.addWidget(self.dash_alerts)
        
        layout.addLayout(stats_layout)
        
        # Quick actions
        actions_group = QGroupBox("Quick Actions")
        actions_layout = QHBoxLayout(actions_group)
        
        new_recipe_btn = QPushButton("+ New Recipe")
        new_recipe_btn.clicked.connect(lambda: self.tabs.setCurrentIndex(3))
        actions_layout.addWidget(new_recipe_btn)
        
        new_batch_btn = QPushButton("🏭 New Batch")
        new_batch_btn.clicked.connect(lambda: self.tabs.setCurrentIndex(4))
        actions_layout.addWidget(new_batch_btn)
        
        view_reports_btn = QPushButton("📊 View Reports")
        view_reports_btn.setProperty("secondary", True)
        view_reports_btn.clicked.connect(lambda: self.tabs.setCurrentIndex(5))
        actions_layout.addWidget(view_reports_btn)
        
        actions_layout.addStretch()
        layout.addWidget(actions_group)
        
        layout.addStretch()
        
        # Load initial stats
        self._refresh_dashboard()
        
        return dashboard
    
    def _create_dash_card(self, title: str, value: str, subtitle: str, highlight: bool = False) -> QGroupBox:
        """Create a dashboard stat card."""
        from PySide6.QtWidgets import QGroupBox
        
        card = QGroupBox()
        card.setStyleSheet(f"""
            QGroupBox {{
                background-color: {'#fff3e0' if highlight else '#ffffff'};
                border: 1px solid #d2d2d7;
                border-radius: 12px;
                padding: 16px;
            }}
        """)
        
        layout = QVBoxLayout(card)
        
        title_label = QLabel(title)
        title_label.setStyleSheet("font-size: 14px; color: #6e6e73;")
        layout.addWidget(title_label)
        
        value_label = QLabel(value)
        value_label.setObjectName("value")
        value_label.setStyleSheet("font-size: 36px; font-weight: 700; color: #1d1d1f;")
        layout.addWidget(value_label)
        
        sub_label = QLabel(subtitle)
        sub_label.setStyleSheet("font-size: 12px; color: #8e8e93;")
        layout.addWidget(sub_label)
        
        return card
    
    def _refresh_dashboard(self):
        """Refresh dashboard stats."""
        try:
            db = SessionLocal()
            reports = ReportsService(db)
            stats = reports.get_dashboard_stats()
            db.close()
            
            # Update cards
            self.dash_ingredients.findChild(QLabel, "value").setText(str(stats["ingredients"]))
            self.dash_recipes.findChild(QLabel, "value").setText(str(stats["recipes"]))
            self.dash_batches.findChild(QLabel, "value").setText(str(stats["batches"]))
            self.dash_alerts.findChild(QLabel, "value").setText(str(stats["low_stock_items"]))
        except Exception:
            pass
    
    def _on_tab_changed(self, index: int):
        """Handle tab changes."""
        # Refresh dashboard when switching to it
        if index == 0:
            self._refresh_dashboard()

