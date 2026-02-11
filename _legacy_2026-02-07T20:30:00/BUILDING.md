# Building SoapManager

SoapManager can be packaged as a standalone executable for both Linux (`.deb`) and Windows (`.exe`).

## Prerequisites

*   Python 3.10+
*   `pip`
*   `bzip2-devel` `libffi-devel` `zlib-devel` (and other standard Python build dependencies, though usually solved by having Python installed)

## Building for Linux

To build the Debian package (`.deb`) for Linux:

1.  Open a terminal in the project root (`SoapManager/`).
2.  Run the build script:
    ```bash
    ./scripts/build_linux.sh
    ```
3.  The output file will be located in `dist/soapmanager_0.1.0_all.deb`.

This script uses `pyinstaller` to create a single binary, then packages it into a standard `.deb` structure with a desktop entry and icon.

## Building for Windows

To build the executable (`.exe`) for Windows:

> [!IMPORTANT]
> You **must** run this build process on a Windows machine. Cross-compilation from Linux to Windows with PyInstaller/PySide6 is not supported.

1.  Open a Command Prompt or PowerShell in the project root (`SoapManager\`).
2.  Ensure you have your Python environment activated (if using venv).
3.  Run the build script:
    ```cmd
    scripts\build_windows.bat
    ```
4.  The output file will be located in `dist\SoapManager.exe`.

This script installs dependencies, runs `pyinstaller` with the `--noconsole` flag (to hide the terminal window), and bundles necessary resources (like fonts).
