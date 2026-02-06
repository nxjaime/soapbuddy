"""
Seed Database

Populate the database with sample ingredients (common soap-making oils).
"""
import sys
import os

# Add project root to path
_project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if _project_root not in sys.path:
    sys.path.insert(0, _project_root)

from src.database.db import SessionLocal, init_db
from src.models.models import Ingredient
from src.services.lye_calculator import DEFAULT_SAP_VALUES

# Sample ingredients with typical SAP values and costs
SAMPLE_INGREDIENTS = [
    # Base Oils
    {"name": "Olive Oil (Extra Virgin)", "category": "Base Oil", "sap_naoh": 0.134, "cost_per_unit": 0.015, "unit": "g", "quantity_on_hand": 5000, "inci_code": "Olea Europaea Fruit Oil"},
    {"name": "Coconut Oil (76°)", "category": "Base Oil", "sap_naoh": 0.178, "cost_per_unit": 0.008, "unit": "g", "quantity_on_hand": 3000, "inci_code": "Cocos Nucifera Oil"},
    {"name": "Palm Oil", "category": "Base Oil", "sap_naoh": 0.141, "cost_per_unit": 0.006, "unit": "g", "quantity_on_hand": 2500, "inci_code": "Elaeis Guineensis Oil"},
    {"name": "Castor Oil", "category": "Base Oil", "sap_naoh": 0.128, "cost_per_unit": 0.012, "unit": "g", "quantity_on_hand": 1000, "inci_code": "Ricinus Communis Seed Oil"},
    {"name": "Sweet Almond Oil", "category": "Base Oil", "sap_naoh": 0.136, "cost_per_unit": 0.025, "unit": "g", "quantity_on_hand": 500, "inci_code": "Prunus Amygdalus Dulcis Oil"},
    {"name": "Avocado Oil", "category": "Base Oil", "sap_naoh": 0.133, "cost_per_unit": 0.030, "unit": "g", "quantity_on_hand": 300, "inci_code": "Persea Gratissima Oil"},
    {"name": "Sunflower Oil", "category": "Base Oil", "sap_naoh": 0.134, "cost_per_unit": 0.005, "unit": "g", "quantity_on_hand": 2000, "inci_code": "Helianthus Annuus Seed Oil"},
    {"name": "Rice Bran Oil", "category": "Base Oil", "sap_naoh": 0.128, "cost_per_unit": 0.010, "unit": "g", "quantity_on_hand": 1500, "inci_code": "Oryza Sativa Bran Oil"},
    
    # Butters
    {"name": "Shea Butter", "category": "Butter", "sap_naoh": 0.128, "cost_per_unit": 0.020, "unit": "g", "quantity_on_hand": 1000, "inci_code": "Butyrospermum Parkii Butter"},
    {"name": "Cocoa Butter", "category": "Butter", "sap_naoh": 0.137, "cost_per_unit": 0.025, "unit": "g", "quantity_on_hand": 800, "inci_code": "Theobroma Cacao Seed Butter"},
    {"name": "Mango Butter", "category": "Butter", "sap_naoh": 0.128, "cost_per_unit": 0.022, "unit": "g", "quantity_on_hand": 500, "inci_code": "Mangifera Indica Seed Butter"},
    
    # Lye
    {"name": "Sodium Hydroxide (NaOH)", "category": "Lye", "sap_naoh": None, "cost_per_unit": 0.005, "unit": "g", "quantity_on_hand": 2000, "inci_code": "Sodium Hydroxide"},
    {"name": "Potassium Hydroxide (KOH)", "category": "Lye", "sap_naoh": None, "cost_per_unit": 0.008, "unit": "g", "quantity_on_hand": 1000, "inci_code": "Potassium Hydroxide"},
    
    # Additives
    {"name": "Sodium Lactate", "category": "Additive", "sap_naoh": None, "cost_per_unit": 0.015, "unit": "g", "quantity_on_hand": 500, "inci_code": "Sodium Lactate"},
    {"name": "Kaolin Clay", "category": "Additive", "sap_naoh": None, "cost_per_unit": 0.010, "unit": "g", "quantity_on_hand": 300, "inci_code": "Kaolin"},
    {"name": "Colloidal Oatmeal", "category": "Additive", "sap_naoh": None, "cost_per_unit": 0.008, "unit": "g", "quantity_on_hand": 400, "inci_code": "Avena Sativa Kernel Flour"},
    {"name": "Activated Charcoal", "category": "Additive", "sap_naoh": None, "cost_per_unit": 0.050, "unit": "g", "quantity_on_hand": 100, "inci_code": "Charcoal Powder"},
    
    # Fragrances
    {"name": "Lavender Essential Oil", "category": "Fragrance", "sap_naoh": None, "cost_per_unit": 0.150, "unit": "g", "quantity_on_hand": 100, "inci_code": "Lavandula Angustifolia Oil"},
    {"name": "Peppermint Essential Oil", "category": "Fragrance", "sap_naoh": None, "cost_per_unit": 0.120, "unit": "g", "quantity_on_hand": 75, "inci_code": "Mentha Piperita Oil"},
    {"name": "Tea Tree Essential Oil", "category": "Fragrance", "sap_naoh": None, "cost_per_unit": 0.100, "unit": "g", "quantity_on_hand": 80, "inci_code": "Melaleuca Alternifolia Leaf Oil"},
    {"name": "Eucalyptus Essential Oil", "category": "Fragrance", "sap_naoh": None, "cost_per_unit": 0.080, "unit": "g", "quantity_on_hand": 90, "inci_code": "Eucalyptus Globulus Leaf Oil"},
    
    # Colorants
    {"name": "Titanium Dioxide", "category": "Colorant", "sap_naoh": None, "cost_per_unit": 0.030, "unit": "g", "quantity_on_hand": 200, "inci_code": "CI 77891"},
    {"name": "Ultramarine Blue", "category": "Colorant", "sap_naoh": None, "cost_per_unit": 0.040, "unit": "g", "quantity_on_hand": 50, "inci_code": "CI 77007"},
    {"name": "Iron Oxide Yellow", "category": "Colorant", "sap_naoh": None, "cost_per_unit": 0.035, "unit": "g", "quantity_on_hand": 50, "inci_code": "CI 77492"},
]


def seed_database():
    """Add sample ingredients to the database."""
    init_db()
    db = SessionLocal()
    
    try:
        # Check if already seeded
        existing = db.query(Ingredient).count()
        if existing > 0:
            print(f"Database already has {existing} ingredients. Skipping seed.")
            return
        
        for ing_data in SAMPLE_INGREDIENTS:
            # Calculate KOH SAP from NaOH SAP
            sap_naoh = ing_data.get("sap_naoh")
            sap_koh = sap_naoh * 1.403 if sap_naoh else None
            
            ingredient = Ingredient(
                name=ing_data["name"],
                category=ing_data["category"],
                sap_naoh=sap_naoh,
                sap_koh=sap_koh,
                cost_per_unit=ing_data["cost_per_unit"],
                unit=ing_data["unit"],
                quantity_on_hand=ing_data["quantity_on_hand"],
                inci_code=ing_data.get("inci_code"),
            )
            db.add(ingredient)
        
        db.commit()
        print(f"✅ Successfully added {len(SAMPLE_INGREDIENTS)} sample ingredients!")
        
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
