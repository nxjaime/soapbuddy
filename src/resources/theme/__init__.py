"""
Theme System

Modular theming with separate style components.
"""
from src.resources.theme.colors import COLORS
from src.resources.theme.buttons import BUTTON_STYLES
from src.resources.theme.inputs import INPUT_STYLES
from src.resources.theme.tables import TABLE_STYLES
from src.resources.theme.layout import LAYOUT_STYLES

# Compose the complete stylesheet
MAIN_STYLESHEET = f"""
/* ============================================
   SoapManager Theme - Composed Stylesheet
   ============================================ */

{COLORS}

* {{
    font-family: "Merriweather", "Noto Color Emoji", "Segoe UI Emoji", serif;
}}

{BUTTON_STYLES}
{INPUT_STYLES}
{TABLE_STYLES}
{LAYOUT_STYLES}
"""

__all__ = ["MAIN_STYLESHEET", "COLORS"]
