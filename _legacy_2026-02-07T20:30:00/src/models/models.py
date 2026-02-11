from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from src.database.db import Base

class Ingredient(Base):
    """
    Model representing a soap-making ingredient (oils, lye, additives).
    """
    __tablename__ = "ingredients"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    inci_code = Column(String(100), nullable=True)  # INCI naming standard
    category = Column(String(50), nullable=False)  # e.g., "Base Oil", "Lye", "Additive", "Packaging"
    
    # SAP values for lye calculations
    sap_naoh = Column(Float, nullable=True)  # Saponification value for NaOH
    sap_koh = Column(Float, nullable=True)   # Saponification value for KOH
    
    # Inventory tracking
    unit = Column(String(20), nullable=False, default="g")  # g, kg, oz, lb, ml, L
    quantity_on_hand = Column(Float, nullable=False, default=0.0)
    cost_per_unit = Column(Float, nullable=False, default=0.0)
    supplier = Column(String(100), nullable=True)
    
    # Metadata
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<Ingredient(id={self.id}, name='{self.name}', category='{self.category}')>"


class Recipe(Base):
    """
    Model representing a soap recipe.
    """
    __tablename__ = "recipes"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    recipe_type = Column(String(50), nullable=False, default="Soap")  # Soap, Lotion, etc.
    
    # Lye settings
    lye_type = Column(String(10), nullable=False, default="NaOH")  # NaOH, KOH, or Dual
    superfat_percentage = Column(Float, nullable=False, default=5.0)
    water_percentage = Column(Float, nullable=False, default=33.0)  # Water as % of oils
    
    # Batch size
    total_oils_weight = Column(Float, nullable=False, default=0.0)
    unit = Column(String(20), nullable=False, default="g")
    
    # Inventory & Sales
    stock_quantity = Column(Integer, nullable=False, default=0) # Finished goods in stock
    default_price = Column(Float, nullable=False, default=0.0) # Default unit price for sales
    
    # Metadata
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    ingredients = relationship("RecipeIngredient", back_populates="recipe", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Recipe(id={self.id}, name='{self.name}')>"


class RecipeIngredient(Base):
    """
    Association table linking recipes to ingredients with quantities.
    """
    __tablename__ = "recipe_ingredients"
    
    id = Column(Integer, primary_key=True, index=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id"), nullable=False)
    ingredient_id = Column(Integer, ForeignKey("ingredients.id"), nullable=False)
    quantity = Column(Float, nullable=False)
    unit = Column(String(20), nullable=False, default="g")
    
    # Relationships
    recipe = relationship("Recipe", back_populates="ingredients")
    ingredient = relationship("Ingredient")
    
    def __repr__(self):
        return f"<RecipeIngredient(recipe_id={self.recipe_id}, ingredient_id={self.ingredient_id}, qty={self.quantity})>"


class ProductionBatch(Base):
    """
    Model representing a production batch of soap.
    """
    __tablename__ = "production_batches"
    
    id = Column(Integer, primary_key=True, index=True)
    lot_number = Column(String(50), nullable=False, unique=True, index=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id"), nullable=False)
    
    # Batch details
    scale_factor = Column(Float, nullable=False, default=1.0)
    total_weight = Column(Float, nullable=False, default=0.0)  # Total batch weight
    yield_quantity = Column(Integer, nullable=False, default=0) # Number of units produced (bars, bottles)
    
    # Status tracking
    status = Column(String(20), nullable=False, default="Planned")  # Planned, In Progress, Curing, Complete, Cancelled
    
    # Dates
    planned_date = Column(DateTime, nullable=True)
    production_date = Column(DateTime, nullable=True)
    cure_end_date = Column(DateTime, nullable=True)  # When curing finishes
    
    # Costs
    total_cost = Column(Float, nullable=False, default=0.0)
    
    # Metadata
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    recipe = relationship("Recipe")
    
    def __repr__(self):
        return f"<ProductionBatch(lot='{self.lot_number}', status='{self.status}')>"


class BatchIngredientUsage(Base):
    """
    Tracks actual ingredient usage for a production batch.
    """
    __tablename__ = "batch_ingredient_usage"
    
    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("production_batches.id"), nullable=False)
    ingredient_id = Column(Integer, ForeignKey("ingredients.id"), nullable=False)
    
    planned_quantity = Column(Float, nullable=False)
    actual_quantity = Column(Float, nullable=True)  # Can differ from planned
    unit = Column(String(20), nullable=False, default="g")
    cost = Column(Float, nullable=False, default=0.0)
    
    
    # Relationships
    batch = relationship("ProductionBatch", backref="ingredient_usage")
    ingredient = relationship("Ingredient")
    
    def __repr__(self):
        return f"<BatchIngredientUsage(batch_id={self.batch_id}, ingredient_id={self.ingredient_id})>"


class FattyAcidProfile(Base):
    """
    Fatty acid profile for an ingredient (Base Oil) to calculate soap qualities.
    Values are percentages (0-100).
    """
    __tablename__ = "fatty_acid_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    ingredient_id = Column(Integer, ForeignKey("ingredients.id"), nullable=False, unique=True)
    
    # Major Fatty Acids
    lauric = Column(Float, default=0.0)      # Hardness, Cleansing, Bubbly
    myristic = Column(Float, default=0.0)    # Hardness, Cleansing, Bubbly
    palmitic = Column(Float, default=0.0)    # Hardness, Stable Creamy Lather
    stearic = Column(Float, default=0.0)     # Hardness, Stable Creamy Lather
    ricinoleic = Column(Float, default=0.0)  # Conditioning, Bubbly, Creamy (Castor only)
    oleic = Column(Float, default=0.0)       # Conditioning
    linoleic = Column(Float, default=0.0)    # Conditioning
    linolenic = Column(Float, default=0.0)   # Conditioning
    
    # Calculated properties cache (optional, but good for quick lookup)
    hardness = Column(Float, default=0.0)
    cleansing = Column(Float, default=0.0)
    conditioning = Column(Float, default=0.0)
    bubbly = Column(Float, default=0.0)
    creamy = Column(Float, default=0.0)
    iodine = Column(Float, default=0.0)
    ins = Column(Float, default=0.0)
    
    ingredient = relationship("Ingredient", backref="fatty_acid_profile", uselist=False)


class Supplier(Base):
    """
    Supplier details for ingredients and packaging.
    """
    __tablename__ = "suppliers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    contact_name = Column(String(100), nullable=True)
    email = Column(String(100), nullable=True)
    phone = Column(String(50), nullable=True)
    website = Column(String(200), nullable=True)
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<Supplier(name='{self.name}')>"


class SupplyOrder(Base):
    """
    Record of a purchase from a supplier.
    """
    __tablename__ = "supply_orders"
    
    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    order_date = Column(DateTime, default=datetime.utcnow)
    status = Column(String(20), default="Received") # Ordered, Shipped, Received
    total_cost = Column(Float, default=0.0)
    invoice_number = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    
    supplier = relationship("Supplier")
    items = relationship("SupplyOrderItem", back_populates="order", cascade="all, delete-orphan")


class SupplyOrderItem(Base):
    """
    Line item in a supply order.
    """
    __tablename__ = "supply_order_items"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("supply_orders.id"), nullable=False)
    ingredient_id = Column(Integer, ForeignKey("ingredients.id"), nullable=False)
    
    quantity = Column(Float, nullable=False)
    unit = Column(String(20), nullable=False)
    cost = Column(Float, nullable=False) # Total line cost
    lot_number = Column(String(50), nullable=True)
    expiry_date = Column(DateTime, nullable=True)
    
    order = relationship("SupplyOrder", back_populates="items")
    ingredient = relationship("Ingredient")


class Customer(Base):
    """
    Customer details for sales.
    """
    __tablename__ = "customers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    email = Column(String(100), nullable=True)
    phone = Column(String(50), nullable=True)
    address = Column(Text, nullable=True)
    customer_type = Column(String(20), default="Retail") # Retail, Wholesale, Consignment
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)


class SalesOrder(Base):
    """
    Record of a sale to a customer.
    """
    __tablename__ = "sales_orders"
    
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True) # Nullable for quick retail sales
    sale_date = Column(DateTime, default=datetime.utcnow)
    status = Column(String(20), default="Completed") # Draft, Confirmed, Shipped, Completed, Paid
    payment_status = Column(String(20), default="Paid") # Unpaid, Paid, Partial
    total_amount = Column(Float, default=0.0)
    
    customer = relationship("Customer")
    items = relationship("SalesOrderItem", back_populates="order", cascade="all, delete-orphan")


class SalesOrderItem(Base):
    """
    Line item in a sales order.
    """
    __tablename__ = "sales_order_items"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("sales_orders.id"), nullable=False)
    # Could link to Recipe (as Product Type) or specific Batch if tracking inventory strictly
    # For now, linking to Recipe as the "Product" definition
    recipe_id = Column(Integer, ForeignKey("recipes.id"), nullable=False)
    batch_id = Column(Integer, ForeignKey("production_batches.id"), nullable=True) # Optional trace to specific batch
    
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Float, nullable=False)
    discount = Column(Float, default=0.0)
    
    order = relationship("SalesOrder", back_populates="items")
    recipe = relationship("Recipe")
    batch = relationship("ProductionBatch")


class Expense(Base):
    """
    Other business expenses (non-ingredient).
    """
    __tablename__ = "expenses"
    
    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime, default=datetime.utcnow)
    category = Column(String(50), nullable=False) # Equipment, Marketing, Utilities, etc.
    description = Column(String(200), nullable=False)
    amount = Column(Float, nullable=False)
    receipt_image_path = Column(String(200), nullable=True)

