from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from src.models.models import Ingredient, FattyAcidProfile

class SoapCalculator:
    """
    Calculates soap qualities based on the fatty acid profile of the recipe.
    Qualities are on a 0-100 scale (typically).
    """
    
    @staticmethod
    def calculate_qualities(ingredients: List[Dict]) -> Dict[str, float]:
        """
        Calculate qualities for a list of weighted ingredients.
        ingredients: List of dicts with 'ingredient_id' and 'weight'.
        Returns a dict of quality scores.
        """
        total_weight = sum(item['weight'] for item in ingredients)
        if total_weight == 0:
            return SoapCalculator._empty_qualities()
            
        qualities = {
            "hardness": 0.0,
            "cleansing": 0.0,
            "conditioning": 0.0,
            "bubbly": 0.0,
            "creamy": 0.0,
            "iodine": 0.0,
            "ins": 0.0
        }
        
        # We need to fetch the profiles. 
        # Ideally this method receives the Profile objects, but to keep it simple 
        # we assume the caller or a db helper provides the data.
        # Actually, let's process assuming we have the profiles.
        
        # NOTE: This method logic expects pre-fetched profiles or we query them.
        # Let's redesign to take a DB session to fetch profiles if needed.
        pass

    @staticmethod
    def calculate_from_recipe_ingredients(db: Session, recipe_ingredients: List) -> Dict[str, float]:
        """
        Calculate qualities from a list of recipe ingredients (SQLAlchemy objects or dicts).
        Each item must have 'ingredient_id' and 'quantity'.
        """
        total_weight = 0.0
        weighted_profiles = {
            "lauric": 0.0, "myristic": 0.0, "palmitic": 0.0, "stearic": 0.0,
            "ricinoleic": 0.0, "oleic": 0.0, "linoleic": 0.0, "linolenic": 0.0,
            "iodine": 0.0, "ins": 0.0
        }
        
        # Filter for oils only (ingredients with fatty acid profiles)
        valid_ingredients = []
        
        for item in recipe_ingredients:
            # Handle both object and dict access
            ing_id = item.ingredient_id if hasattr(item, 'ingredient_id') else item['ingredient_id']
            qty = item.quantity if hasattr(item, 'quantity') else item.get('weight', 0)
            
            profile = db.query(FattyAcidProfile).filter(
                FattyAcidProfile.ingredient_id == ing_id
            ).first()
            
            if profile and qty > 0:
                valid_ingredients.append((profile, qty))
                total_weight += qty
        
        if total_weight == 0:
            return SoapCalculator._empty_qualities()
            
        # Calculate weighted averages of Fatty Acids
        for profile, qty in valid_ingredients:
            ratio = qty / total_weight
            weighted_profiles["lauric"] += profile.lauric * ratio
            weighted_profiles["myristic"] += profile.myristic * ratio
            weighted_profiles["palmitic"] += profile.palmitic * ratio
            weighted_profiles["stearic"] += profile.stearic * ratio
            weighted_profiles["ricinoleic"] += profile.ricinoleic * ratio
            weighted_profiles["oleic"] += profile.oleic * ratio
            weighted_profiles["linoleic"] += profile.linoleic * ratio
            weighted_profiles["linolenic"] += profile.linolenic * ratio
            weighted_profiles["iodine"] += profile.iodine * ratio
            weighted_profiles["ins"] += profile.ins * ratio
            
        # Calculate Soap Qualities based on standard soapmaking formulas
        # Hardness: Lauric + Myristic + Palmitic + Stearic
        hardness = (weighted_profiles["lauric"] + weighted_profiles["myristic"] + 
                   weighted_profiles["palmitic"] + weighted_profiles["stearic"])
                   
        # Cleansing: Lauric + Myristic
        cleansing = weighted_profiles["lauric"] + weighted_profiles["myristic"]
        
        # Conditioning: Oleic + Linoleic + Linolenic + Ricinoleic (often just sum of soft oils)
        conditioning = (weighted_profiles["oleic"] + weighted_profiles["linoleic"] + 
                       weighted_profiles["linolenic"] + weighted_profiles["ricinoleic"])
                       
        # Bubbly: Lauric + Myristic + Ricinoleic
        bubbly = (weighted_profiles["lauric"] + weighted_profiles["myristic"] + 
                 weighted_profiles["ricinoleic"])
                 
        # Creamy: Palmitic + Stearic + Ricinoleic
        creamy = (weighted_profiles["palmitic"] + weighted_profiles["stearic"] + 
                 weighted_profiles["ricinoleic"])
                 
        return {
            "hardness": round(hardness, 1),
            "cleansing": round(cleansing, 1),
            "conditioning": round(conditioning, 1),
            "bubbly": round(bubbly, 1),
            "creamy": round(creamy, 1),
            "iodine": round(weighted_profiles["iodine"], 1),
            "ins": round(weighted_profiles["ins"], 1)
        }

    @staticmethod
    def _empty_qualities():
        return {k: 0.0 for k in ["hardness", "cleansing", "conditioning", "bubbly", "creamy", "iodine", "ins"]}
