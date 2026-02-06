@echo off
set APP_NAME=SoapManager
set VERSION=0.1.0

echo Building %APP_NAME% v%VERSION% for Windows...

REM Install requirements
pip install -r requirements.txt
pip install pyinstaller

REM Clean previous builds
if exist build rmdir /s /q build
if exist dist rmdir /s /q dist

REM Compile binary
REM --add-data "src/resources;resources" ensures the fonts folder (inside src/resources) is copied to the bundle
pyinstaller --noconsole --onefile src/main.py --name %APP_NAME% --add-data "src/resources;resources"

echo Build complete! Executable is at dist\%APP_NAME%.exe
pause
