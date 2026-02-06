"""
Pydantic schemas for API request/response validation.
"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# ============ Ingredient Schemas ============
class IngredientBase(BaseModel):
    name: str
    category: str
    inci_code: Optional[str] = None
    sap_naoh: Optional[float] = None
    sap_koh: Optional[float] = None
    unit: str = "g"
    quantity_on_hand: float = 0.0
    cost_per_unit: float = 0.0
    supplier: Optional[str] = None
    notes: Optional[str] = None


class IngredientCreate(IngredientBase):
    pass


class IngredientUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    inci_code: Optional[str] = None
    sap_naoh: Optional[float] = None
    sap_koh: Optional[float] = None
    unit: Optional[str] = None
    quantity_on_hand: Optional[float] = None
    cost_per_unit: Optional[float] = None
    supplier: Optional[str] = None
    notes: Optional[str] = None


class IngredientResponse(IngredientBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============ Fatty Acid Profile Schemas ============
class FattyAcidProfileBase(BaseModel):
    lauric: float = 0.0
    myristic: float = 0.0
    palmitic: float = 0.0
    stearic: float = 0.0
    ricinoleic: float = 0.0
    oleic: float = 0.0
    linoleic: float = 0.0
    linolenic: float = 0.0


class FattyAcidProfileCreate(FattyAcidProfileBase):
    ingredient_id: int


class FattyAcidProfileResponse(FattyAcidProfileBase):
    id: int
    # Calculated properties
    hardness: float
    cleansing: float
    conditioning: float
    bubbly: float
    creamy: float
    iodine: float
    ins: float

    class Config:
        from_attributes = True


# ============ Supplier Schemas ============
class SupplierBase(BaseModel):
    name: str
    contact_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    notes: Optional[str] = None


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    contact_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    notes: Optional[str] = None


class SupplierResponse(SupplierBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ============ Customer Schemas ============
class CustomerBase(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    customer_type: str = "Retail"
    notes: Optional[str] = None


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    customer_type: Optional[str] = None
    notes: Optional[str] = None


class CustomerResponse(CustomerBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ============ Expense Schemas ============
class ExpenseBase(BaseModel):
    date: datetime
    category: str
    description: str
    amount: float
    receipt_image_path: Optional[str] = None


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseResponse(ExpenseBase):
    id: int

    class Config:
        from_attributes = True


# ============ Recipe Ingredient Schemas ============
class RecipeIngredientBase(BaseModel):
    ingredient_id: int
    quantity: float
    unit: str = "g"


class RecipeIngredientCreate(RecipeIngredientBase):
    pass


class RecipeIngredientResponse(RecipeIngredientBase):
    id: int
    ingredient: Optional[IngredientResponse] = None

    class Config:
        from_attributes = True


# ============ Recipe Schemas ============
class RecipeBase(BaseModel):
    name: str
    description: Optional[str] = None
    recipe_type: str = "Soap"
    lye_type: str = "NaOH"
    superfat_percentage: float = 5.0
    water_percentage: float = 33.0
    total_oils_weight: float = 0.0
    unit: str = "g"
    # Inventory & Sales
    stock_quantity: int = 0
    default_price: float = 0.0
    notes: Optional[str] = None


class RecipeCreate(RecipeBase):
    ingredients: List[RecipeIngredientCreate] = []


class RecipeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    recipe_type: Optional[str] = None
    lye_type: Optional[str] = None
    superfat_percentage: Optional[float] = None
    water_percentage: Optional[float] = None
    total_oils_weight: Optional[float] = None
    unit: Optional[str] = None
    stock_quantity: Optional[int] = None
    default_price: Optional[float] = None
    notes: Optional[str] = None
    ingredients: Optional[List[RecipeIngredientCreate]] = None


class RecipeResponse(RecipeBase):
    id: int
    created_at: datetime
    updated_at: datetime
    ingredients: List[RecipeIngredientResponse] = []
    qualities: Optional[dict] = None  # Calculated soap qualities


    class Config:
        from_attributes = True


# ============ Production Batch Schemas ============
class ProductionBatchBase(BaseModel):
    recipe_id: int
    lot_number: str
    scale_factor: float = 1.0
    total_weight: float = 0.0
    yield_quantity: int = 0
    status: str = "Planned"
    planned_date: Optional[datetime] = None
    production_date: Optional[datetime] = None
    cure_end_date: Optional[datetime] = None
    total_cost: float = 0.0
    notes: Optional[str] = None


class ProductionBatchCreate(ProductionBatchBase):
    pass


class ProductionBatchUpdate(BaseModel):
    status: Optional[str] = None
    yield_quantity: Optional[int] = None
    production_date: Optional[datetime] = None
    cure_end_date: Optional[datetime] = None
    notes: Optional[str] = None


class ProductionBatchResponse(ProductionBatchBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============ Lye Calculator Schemas ============
class LyeCalculatorRequest(BaseModel):
    oils: List[dict]  # [{"ingredient_id": 1, "weight": 100}, ...]
    lye_type: str = "NaOH"  # NaOH, KOH, or Dual
    superfat_percentage: float = 5.0
    water_percentage: float = 33.0  # Water as % of oils
    naoh_ratio: float = 50.0  # For dual lye: % NaOH vs KOH


class LyeCalculatorResponse(BaseModel):
    total_oils: float
    lye_naoh: Optional[float] = None
    lye_koh: Optional[float] = None
    water: float
    superfat_percentage: float
    total_batch_weight: float


# ============ Supply Order Schemas ============
class SupplyOrderItemBase(BaseModel):
    ingredient_id: int
    quantity: float
    unit: str
    cost: float
    lot_number: Optional[str] = None
    expiry_date: Optional[datetime] = None


class SupplyOrderItemCreate(SupplyOrderItemBase):
    pass


class SupplyOrderItemResponse(SupplyOrderItemBase):
    id: int
    ingredient: Optional[IngredientResponse] = None

    class Config:
        from_attributes = True


class SupplyOrderBase(BaseModel):
    supplier_id: int
    order_date: Optional[datetime] = None
    status: str = "Received"
    total_cost: float = 0.0
    invoice_number: Optional[str] = None
    notes: Optional[str] = None


class SupplyOrderCreate(SupplyOrderBase):
    items: List[SupplyOrderItemCreate] = []


class SupplyOrderUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None


class SupplyOrderResponse(SupplyOrderBase):
    id: int
    items: List[SupplyOrderItemResponse] = []
    supplier: Optional[SupplierResponse] = None

    class Config:
        from_attributes = True


# ============ Sales Order Schemas ============
class SalesOrderItemBase(BaseModel):
    recipe_id: int
    quantity: int = 1
    unit_price: float = 0.0
    discount: float = 0.0
    batch_id: Optional[int] = None


class SalesOrderItemCreate(SalesOrderItemBase):
    pass


class SalesOrderItemResponse(SalesOrderItemBase):
    id: int
    recipe: Optional[RecipeResponse] = None

    class Config:
        from_attributes = True


class SalesOrderBase(BaseModel):
    customer_id: Optional[int] = None
    sale_date: Optional[datetime] = None
    status: str = "Completed"
    payment_status: str = "Paid"
    total_amount: float = 0.0


class SalesOrderCreate(SalesOrderBase):
    items: List[SalesOrderItemCreate] = []


class SalesOrderUpdate(BaseModel):
    status: Optional[str] = None
    payment_status: Optional[str] = None
    total_amount: Optional[float] = None


class SalesOrderResponse(SalesOrderBase):
    id: int
    items: List[SalesOrderItemResponse] = []
    customer: Optional[CustomerResponse] = None

    class Config:
        from_attributes = True
