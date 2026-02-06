# SoapManager

A lightweight, cross-platform desktop application for soap making inventory management, recipe formulation, and cost tracking.

## Features

- ✅ **Ingredients Inventory** - Track oils, butters, lye, additives, fragrances, and colorants
- ✅ **Lye Calculator** - NaOH/KOH calculations with 20+ built-in SAP values
- ✅ **Recipe Management** - Create, edit, clone, and scale recipes
- ✅ **Cost Calculation** - Automatic per-batch cost tracking
- 🔜 **Production Tracking** - Batch management with lot numbers
- 🔜 **Reports** - Inventory reports, cost analysis, traceability

## Tech Stack

- **Language:** Python 3.10+
- **UI Framework:** PySide6 (Qt6)
- **Database:** SQLite + SQLAlchemy ORM
- **Styling:** Custom QSS (Qt Style Sheets)

## Installation

### Development Setup

```bash
# Clone the repository
cd SoapManager

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# (Optional) Seed database with sample ingredients
python scripts/seed_db.py

# Run the application
python src/main.py
```

### System Requirements (Linux)

On Debian/Ubuntu-based systems, you may need:

```bash
sudo apt install libxcb-cursor0
```

## Building Executables

### Linux (.deb)

```bash
chmod +x scripts/build_linux.sh
./scripts/build_linux.sh
```

The `.deb` package will be in `dist/`.

### Windows (.exe)

```cmd
scripts\build_windows.bat
```

The `.exe` will be in `dist/`.

## Project Structure

```
SoapManager/
├── src/
│   ├── database/         # DB connection and session
│   ├── models/           # SQLAlchemy ORM models
│   ├── views/            # PySide6 UI components
│   ├── services/         # Business logic
│   ├── resources/        # Styles, icons
│   └── main.py           # Entry point
├── scripts/              # Build and utility scripts
├── tests/                # Unit tests
└── requirements.txt
```

## Screenshots

*(Coming soon)*

## License

MIT License - Free for personal and commercial use.

## Contributing

Contributions welcome! Please open an issue first to discuss proposed changes.
