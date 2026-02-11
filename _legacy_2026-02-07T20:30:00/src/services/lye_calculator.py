"""
Lye Calculator Service

Provides calculations for NaOH and KOH requirements based on oil SAP values.
"""

class LyeCalculator:
    """
    Calculates lye requirements for soap making.
    
    SAP Values:
    - SAP (Saponification Value) indicates how much lye is needed to saponify 1g of a given oil.
    - NaOH SAP values are typically between 0.12-0.19
    - KOH SAP values are NaOH * 1.403
    """
    
    # Common conversion factor from NaOH to KOH
    KOH_CONVERSION_FACTOR = 1.403
    
    @staticmethod
    def calculate_lye(oils: list[dict], lye_type: str = "NaOH", superfat: float = 5.0) -> dict:
        """
        Calculate the amount of lye needed for a batch of oils.
        
        Args:
            oils: List of dicts with 'weight', 'sap_naoh' (and optionally 'sap_koh')
                  Example: [{"name": "Olive Oil", "weight": 500, "sap_naoh": 0.134}]
            lye_type: "NaOH", "KOH", or "Dual"
            superfat: Percentage of extra oil (unreacted), typically 3-8%
            
        Returns:
            Dict with lye amount, water range, and per-oil breakdown
        """
        total_oils = 0.0
        total_lye_naoh = 0.0
        total_lye_koh = 0.0
        breakdown = []
        
        for oil in oils:
            weight = oil.get("weight", 0)
            sap_naoh = oil.get("sap_naoh", 0)
            sap_koh = oil.get("sap_koh", sap_naoh * LyeCalculator.KOH_CONVERSION_FACTOR)
            
            lye_naoh_for_oil = weight * sap_naoh
            lye_koh_for_oil = weight * sap_koh
            
            total_oils += weight
            total_lye_naoh += lye_naoh_for_oil
            total_lye_koh += lye_koh_for_oil
            
            breakdown.append({
                "name": oil.get("name", "Unknown"),
                "weight": weight,
                "lye_naoh": round(lye_naoh_for_oil, 2),
                "lye_koh": round(lye_koh_for_oil, 2),
            })
        
        # Apply superfat reduction
        superfat_multiplier = 1 - (superfat / 100)
        adjusted_naoh = total_lye_naoh * superfat_multiplier
        adjusted_koh = total_lye_koh * superfat_multiplier
        
        # Water calculation (typical range: 1.5:1 to 2:1 water to lye ratio)
        # Or 33-38% of oil weight
        water_min = adjusted_naoh * 1.5 if lye_type == "NaOH" else adjusted_koh * 1.5
        water_max = adjusted_naoh * 2.5 if lye_type == "NaOH" else adjusted_koh * 2.5
        water_recommended = total_oils * 0.33  # 33% lye concentration
        
        result = {
            "total_oils": round(total_oils, 2),
            "lye_type": lye_type,
            "superfat_percentage": superfat,
            "breakdown": breakdown,
        }
        
        if lye_type == "NaOH":
            result["lye_amount"] = round(adjusted_naoh, 2)
        elif lye_type == "KOH":
            result["lye_amount"] = round(adjusted_koh, 2)
        else:  # Dual lye (typically 50/50 but can be customized)
            result["lye_naoh"] = round(adjusted_naoh * 0.5, 2)
            result["lye_koh"] = round(adjusted_koh * 0.5, 2)
            result["lye_amount"] = result["lye_naoh"] + result["lye_koh"]
        
        result["water_range"] = {
            "min": round(water_min, 2),
            "max": round(water_max, 2),
            "recommended": round(water_recommended, 2),
        }
        
        return result
    
    @staticmethod
    def convert_units(value: float, from_unit: str, to_unit: str) -> float:
        """
        Convert between common weight units.
        
        Supported: g, kg, oz, lb
        """
        # Convert everything to grams first
        to_grams = {
            "g": 1,
            "kg": 1000,
            "oz": 28.3495,
            "lb": 453.592,
        }
        
        if from_unit not in to_grams or to_unit not in to_grams:
            raise ValueError(f"Unsupported unit. Use: {list(to_grams.keys())}")
        
        grams = value * to_grams[from_unit]
        return round(grams / to_grams[to_unit], 4)


# Default SAP values for common oils (NaOH)
DEFAULT_SAP_VALUES = {
    "Olive Oil": 0.134,
    "Coconut Oil (76 deg)": 0.178,
    "Palm Oil": 0.141,
    "Castor Oil": 0.128,
    "Shea Butter": 0.128,
    "Cocoa Butter": 0.137,
    "Avocado Oil": 0.133,
    "Sweet Almond Oil": 0.136,
    "Sunflower Oil": 0.134,
    "Jojoba Oil": 0.066,
    "Lard": 0.138,
    "Tallow (Beef)": 0.140,
    "Rice Bran Oil": 0.128,
    "Grapeseed Oil": 0.126,
    "Hemp Seed Oil": 0.135,
    "Mango Butter": 0.128,
    "Babassu Oil": 0.175,
    "Palm Kernel Oil": 0.176,
    "Apricot Kernel Oil": 0.135,
    "Hazelnut Oil": 0.136,
}
