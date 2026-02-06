"""
Database configuration and session management for the web backend.
Reuses the SQLAlchemy models from the desktop app.
"""
import os
import sys

# Add the parent SoapManager directory to the path so we can import existing models
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..')))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Database file location (shared with desktop app for now)
DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    f"sqlite:///{os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', 'soapmanager.db'))}"
)

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Import the Base from the original models
from src.database.db import Base
from src.models.models import (
    Ingredient, Recipe, RecipeIngredient, ProductionBatch, BatchIngredientUsage,
    FattyAcidProfile, Supplier, SupplyOrder, SupplyOrderItem,
    Customer, SalesOrder, SalesOrderItem, Expense
)


def get_db():
    """Dependency that provides a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_database():
    """Initialize the database tables."""
    # Ensure we create tables with the correct engine
    # Import Base and all models to ensure metadata is populated
    from src.database.db import Base
    from src.models.models import (
        Ingredient, Recipe, RecipeIngredient, ProductionBatch, BatchIngredientUsage,
        FattyAcidProfile, Supplier, SupplyOrder, SupplyOrderItem,
        Customer, SalesOrder, SalesOrderItem, Expense
    )
    Base.metadata.create_all(bind=engine)
