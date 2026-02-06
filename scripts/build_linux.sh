#!/bin/bash
set -e

APP_NAME="soapmanager"
VERSION="0.1.0"
ARCH="all"

echo "Building $APP_NAME v$VERSION for Linux..."

# Install requirements
pip install -r requirements.txt
pip install pyinstaller

# Clean previous builds
rm -rf build dist

# 1. Create the binary
echo "Compiling binary..."
pyinstaller --noconsole --onefile src/main.py --name $APP_NAME --add-data "src/resources:resources"

# 2. Create Structure for .deb
echo "Creating .deb package structure..."
DEB_DIR="dist/${APP_NAME}_${VERSION}_${ARCH}"
mkdir -p "$DEB_DIR/DEBIAN"
mkdir -p "$DEB_DIR/usr/bin"
mkdir -p "$DEB_DIR/usr/share/applications"
mkdir -p "$DEB_DIR/usr/share/icons/hicolor/scalable/apps"

# Copy binary
cp "dist/$APP_NAME" "$DEB_DIR/usr/bin/$APP_NAME"
chmod +x "$DEB_DIR/usr/bin/$APP_NAME"

# Create Control File
cat > "$DEB_DIR/DEBIAN/control" <<EOF
Package: $APP_NAME
Version: $VERSION
Section: utils
Priority: optional
Architecture: $ARCH
Maintainer: SoapManager Team <dev@soapmanager.com>
Description: A lightweight soap making inventory and recipe manager.
EOF

# Create Desktop Entry
cat > "$DEB_DIR/usr/share/applications/$APP_NAME.desktop" <<EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=SoapManager
Comment=Professional Soap Making Tool
Exec=/usr/bin/$APP_NAME
Icon=$APP_NAME
Terminal=false
Categories=Utility;
EOF

# 3. Build .deb
echo "Building .deb file..."
dpkg-deb --build "$DEB_DIR"

echo "Build complete! Package is at dist/${APP_NAME}_${VERSION}_${ARCH}.deb"
