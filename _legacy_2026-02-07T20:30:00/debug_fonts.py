
from PySide6.QtWidgets import QApplication
from PySide6.QtGui import QFontDatabase
import sys
import os

app = QApplication(sys.argv)

fonts_dir = os.path.join("src", "resources", "fonts")
regular = os.path.join(fonts_dir, "Merriweather-Regular.ttf")

if os.path.exists(regular):
    id = QFontDatabase.addApplicationFont(regular)
    print(f"Font add ID: {id}")
    if id != -1:
        families = QFontDatabase.applicationFontFamilies(id)
        print(f"Registered families: {families}")
    else:
        print("Failed to add font.")
else:
    print(f"Font file not found at: {regular}")

print("\nResult of checking for Emoji font:")
if "Noto Color Emoji" in QFontDatabase.families():
    print("✓ 'Noto Color Emoji' is available!")
else:
    print("✗ 'Noto Color Emoji' NOT found in Qt database.")
    # Search for any emoji font
    emoji_fonts = [f for f in QFontDatabase.families() if "emoji" in f.lower()]
    print(f"Other potential emoji fonts found: {emoji_fonts}")
