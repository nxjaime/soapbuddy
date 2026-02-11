import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from pathlib import Path

# Determine the application root directory
if getattr(sys, 'frozen', False):
    # If the application is run as a bundle (PyInstaller)
    APP_ROOT = Path(sys.executable).parent
else:
    # If the application is run from a Python interpreter
    APP_ROOT = Path(__file__).resolve().parent.parent.parent

# Database file path
DB_PATH = APP_ROOT / "soapmanager.db"
DATABASE_URL = f"sqlite:///{DB_PATH}"

# SQLAlchemy setup
Base = declarative_base()
engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    """
    Initialize the database by creating all tables defined in Base.metadata.
    """
    print(f"Initializing database at: {DB_PATH}")
    Base.metadata.create_all(bind=engine)

def get_db():
    """
    Dependency generator to get a database session.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
