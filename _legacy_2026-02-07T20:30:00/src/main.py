#!/usr/bin/env python3
"""
SoapManager - Main Entry Point

A lightweight, cross-platform soap making inventory and recipe manager.
"""
import sys
import os

# Ensure the project root is in the Python path
# This allows running the app as `python src/main.py` from the SoapManager directory
_project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if _project_root not in sys.path:
    sys.path.insert(0, _project_root)

# Now we can import from src.*
from PySide6.QtWidgets import QApplication
from src.views.main_window import MainWindow
from src.database.db import init_db
# Import models to register them with SQLAlchemy before init_db
from src.models import models  # noqa: F401


def main():
    """
    Main entry point for SoapManager.
    """
    # Create the Application
    app = QApplication(sys.argv)
    
    # Load custom fonts
    from PySide6.QtGui import QFontDatabase, QFont
    
    # Determine the base path for resources
    if getattr(sys, 'frozen', False):
        # If the application is run as a bundle, the PyInstaller bootloader
        # extends the sys module by a flag frozen=True and sets the app 
        # path into variable _MEIPASS.
        base_path = sys._MEIPASS
    else:
        base_path = os.path.dirname(__file__)

    fonts_dir = os.path.join(base_path, "resources", "fonts")
    
    # Load Merriweather font
    merriweather_regular = os.path.join(fonts_dir, "Merriweather-Regular.ttf")
    merriweather_bold = os.path.join(fonts_dir, "Merriweather-Bold.ttf")
    
    if os.path.exists(merriweather_regular):
        QFontDatabase.addApplicationFont(merriweather_regular)
    if os.path.exists(merriweather_bold):
        QFontDatabase.addApplicationFont(merriweather_bold)
    
    # Set Merriweather as the default application font
    app_font = QFont("Merriweather", 10)
    app.setFont(app_font)
    
    # Initialize the Database
    try:
        init_db()
    except Exception as e:
        print(f"Error initializing database: {e}", file=sys.stderr)
    
    # Create and Show the Main Window
    window = MainWindow()
    window.show()
    
    # Run the Event Loop
    sys.exit(app.exec())


if __name__ == "__main__":
    main()
