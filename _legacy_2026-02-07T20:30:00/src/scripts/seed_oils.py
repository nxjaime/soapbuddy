"""
Script to seed the ingredient database with common soapmaking oils and their fatty acid profiles.
Usage: python3 src/scripts/seed_oils.py
"""
import sys
import os

# Add the project root to the python path
sys.path.append(os.getcwd())

from sqlalchemy.orm import Session
from web.backend.database import get_db, init_database
from src.models.models import Ingredient, FattyAcidProfile, Base

# Common Oils Data
# Values are approximate averages.
# Fatty Acids: Lauric, Myristic, Palmitic, Stearic, Ricinoleic, Oleic, Linoleic, Linolenic
COMMON_OILS = [
    {
        "name": "Coconut Oil, 76 deg",
        "sap_naoh": 0.183,
        "sap_koh": 0.257,
        "profile": {
            "lauric": 48.0, "myristic": 19.0, "palmitic": 9.0, "stearic": 3.0,
            "ricinoleic": 0.0, "oleic": 8.0, "linoleic": 2.0, "linolenic": 0.0,
            "iodine": 10.0, "ins": 258.0
        }
    },
    {
        "name": "Olive Oil",
        "sap_naoh": 0.135,
        "sap_koh": 0.190,
        "profile": {
            "lauric": 0.0, "myristic": 0.0, "palmitic": 14.0, "stearic": 3.0,
            "ricinoleic": 0.0, "oleic": 69.0, "linoleic": 12.0, "linolenic": 1.0,
            "iodine": 85.0, "ins": 105.0
        }
    },
    {
        "name": "Palm Oil",
        "sap_naoh": 0.142,
        "sap_koh": 0.199,
        "profile": {
            "lauric": 0.0, "myristic": 1.0, "palmitic": 44.0, "stearic": 5.0,
            "ricinoleic": 0.0, "oleic": 39.0, "linoleic": 10.0, "linolenic": 0.0,
            "iodine": 53.0, "ins": 145.0
        }
    },
    {
        "name": "Castor Oil",
        "sap_naoh": 0.128,
        "sap_koh": 0.180,
        "profile": {
            "lauric": 0.0, "myristic": 0.0, "palmitic": 1.0, "stearic": 1.0,
            "ricinoleic": 90.0, "oleic": 4.0, "linoleic": 4.0, "linolenic": 0.0,
            "iodine": 86.0, "ins": 95.0
        }
    },
    {
        "name": "Shea Butter",
        "sap_naoh": 0.128,
        "sap_koh": 0.179,
        "profile": {
            "lauric": 0.0, "myristic": 0.0, "palmitic": 5.0, "stearic": 40.0,
            "ricinoleic": 0.0, "oleic": 48.0, "linoleic": 6.0, "linolenic": 0.0,
            "iodine": 59.0, "ins": 116.0
        }
    },
    {
        "name": "Cocoa Butter",
        "sap_naoh": 0.137,
        "sap_koh": 0.193,
        "profile": {
            "lauric": 0.0, "myristic": 0.0, "palmitic": 28.0, "stearic": 33.0,
            "ricinoleic": 0.0, "oleic": 35.0, "linoleic": 3.0, "linolenic": 0.0,
            "iodine": 37.0, "ins": 157.0
        }
    },
    {
        "name": "Sweet Almond Oil",
        "sap_naoh": 0.137,
        "sap_koh": 0.192,
        "profile": {
            "lauric": 0.0, "myristic": 0.0, "palmitic": 7.0, "stearic": 2.0,
            "ricinoleic": 0.0, "oleic": 71.0, "linoleic": 18.0, "linolenic": 0.0,
            "iodine": 99.0, "ins": 97.0
        }
    },
    {
        "name": "Avocado Oil",
        "sap_naoh": 0.133,
        "sap_koh": 0.187,
        "profile": {
            "lauric": 0.0, "myristic": 0.0, "palmitic": 20.0, "stearic": 2.0,
            "ricinoleic": 0.0, "oleic": 58.0, "linoleic": 12.0, "linolenic": 0.0,
            "iodine": 86.0, "ins": 99.0
        }
    }
]

def seed_oils():
    print("Initializing database...")
    init_database()
    
    db = next(get_db())
    count = 0
    
    print("Seeding oils...")
    for oil_data in COMMON_OILS:
        # Check if exists
        existing = db.query(Ingredient).filter(Ingredient.name == oil_data["name"]).first()
        if existing:
            print(f"Skipping {oil_data['name']} (already exists)")
            
            # Check if profile exists, if not create it
            if not existing.fatty_acid_profile:
                print(f"  - Adding missing profile for {oil_data['name']}")
                profile = FattyAcidProfile(
                    ingredient_id=existing.id,
                    **oil_data["profile"]
                )
                db.add(profile)
            continue
            
        # Create Ingredient
        ingredient = Ingredient(
            name=oil_data["name"],
            category="Base Oil",
            sap_naoh=oil_data["sap_naoh"],
            sap_koh=oil_data["sap_koh"],
            quantity_on_hand=1000.0, # Start with some stock
            unit="g"
        )
        db.add(ingredient)
        db.flush() # Get ID
        
        # Create Profile
        profile = FattyAcidProfile(
            ingredient_id=ingredient.id,
            **oil_data["profile"]
        )
        db.add(profile)
        count += 1
        print(f"Added {oil_data['name']}")
    
    db.commit()
    print(f"Done! Added {count} new oils.")

if __name__ == "__main__":
    seed_oils()
