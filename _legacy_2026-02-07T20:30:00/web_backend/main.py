"""
FastAPI Main Application for SoapBuddy Web
"""
import os
import sys

# Ensure parent directory is in path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..')))

from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional

from database import get_db, init_database
from schemas import (
    IngredientCreate, IngredientUpdate, IngredientResponse,
    RecipeCreate, RecipeUpdate, RecipeResponse, RecipeIngredientCreate,
    ProductionBatchCreate, ProductionBatchUpdate, ProductionBatchResponse,
    LyeCalculatorRequest, LyeCalculatorResponse,
    SupplierCreate, SupplierUpdate, SupplierResponse,
    CustomerCreate, CustomerUpdate, CustomerResponse,
    ExpenseCreate, ExpenseResponse,
    SupplyOrderCreate, SupplyOrderUpdate, SupplyOrderResponse,
    SalesOrderCreate, SalesOrderUpdate, SalesOrderResponse
)

# Import models
from src.models.models import (
    Ingredient, Recipe, RecipeIngredient, ProductionBatch, BatchIngredientUsage,
    Supplier, Customer, Expense, SupplyOrder, SupplyOrderItem, SalesOrder, SalesOrderItem
)
from src.services.soap_calculator import SoapCalculator

# Create FastAPI app
app = FastAPI(
    title="SoapBuddy API",
    description="Web API for SoapBuddy - Soap Making Inventory and Recipe Management",
    version="1.0.0"
)

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    """Initialize database on startup."""
    init_database()


# ===================== Health Check =====================
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "SoapBuddy API"}


# ===================== Ingredients API =====================
@app.get("/api/ingredients", response_model=List[IngredientResponse])
async def list_ingredients(
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """List all ingredients with optional filtering."""
    query = db.query(Ingredient)
    if category:
        query = query.filter(Ingredient.category == category)
    if search:
        query = query.filter(Ingredient.name.ilike(f"%{search}%"))
    return query.order_by(Ingredient.name).all()


@app.get("/api/ingredients/{ingredient_id}", response_model=IngredientResponse)
async def get_ingredient(ingredient_id: int, db: Session = Depends(get_db)):
    """Get a single ingredient by ID."""
    ingredient = db.query(Ingredient).filter(Ingredient.id == ingredient_id).first()
    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    return ingredient


@app.post("/api/ingredients", response_model=IngredientResponse)
async def create_ingredient(ingredient: IngredientCreate, db: Session = Depends(get_db)):
    """Create a new ingredient."""
    db_ingredient = Ingredient(**ingredient.model_dump())
    db.add(db_ingredient)
    db.commit()
    db.refresh(db_ingredient)
    return db_ingredient


@app.put("/api/ingredients/{ingredient_id}", response_model=IngredientResponse)
async def update_ingredient(
    ingredient_id: int,
    ingredient: IngredientUpdate,
    db: Session = Depends(get_db)
):
    """Update an existing ingredient."""
    db_ingredient = db.query(Ingredient).filter(Ingredient.id == ingredient_id).first()
    if not db_ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    
    update_data = ingredient.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_ingredient, key, value)
    
    db.commit()
    db.refresh(db_ingredient)
    return db_ingredient


@app.delete("/api/ingredients/{ingredient_id}")
async def delete_ingredient(ingredient_id: int, db: Session = Depends(get_db)):
    """Delete an ingredient."""
    db_ingredient = db.query(Ingredient).filter(Ingredient.id == ingredient_id).first()
    if not db_ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    db.delete(db_ingredient)
    db.commit()
    return {"message": "Ingredient deleted successfully"}


# ===================== Recipes API =====================
@app.get("/api/recipes", response_model=List[RecipeResponse])
async def list_recipes(
    recipe_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """List all recipes with optional filtering."""
    query = db.query(Recipe)
    if recipe_type:
        query = query.filter(Recipe.recipe_type == recipe_type)
    if search:
        query = query.filter(Recipe.name.ilike(f"%{search}%"))
    return query.order_by(Recipe.name).all()


@app.get("/api/recipes/{recipe_id}", response_model=RecipeResponse)
async def get_recipe(recipe_id: int, db: Session = Depends(get_db)):
    """Get a single recipe by ID with its ingredients."""
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    # Calculate soap qualities if applicable
    if recipe.recipe_type == "Soap" or recipe.recipe_type == "Cream Soap":
        try:
            recipe.qualities = SoapCalculator.calculate_from_recipe_ingredients(db, recipe.ingredients)
        except Exception as e:
            print(f"Error calculating qualities: {e}")
            
    return recipe


@app.post("/api/recipes", response_model=RecipeResponse)
async def create_recipe(recipe: RecipeCreate, db: Session = Depends(get_db)):
    """Create a new recipe with ingredients."""
    # Extract ingredients from the request
    ingredients_data = recipe.ingredients
    recipe_data = recipe.model_dump(exclude={"ingredients"})
    
    # Create the recipe
    db_recipe = Recipe(**recipe_data)
    db.add(db_recipe)
    db.flush()  # Get the recipe ID
    
    # Add ingredients
    for ing in ingredients_data:
        db_recipe_ingredient = RecipeIngredient(
            recipe_id=db_recipe.id,
            **ing.model_dump()
        )
        db.add(db_recipe_ingredient)
    
    db.commit()
    db.refresh(db_recipe)
    return db_recipe


@app.put("/api/recipes/{recipe_id}", response_model=RecipeResponse)
async def update_recipe(
    recipe_id: int,
    recipe: RecipeUpdate,
    db: Session = Depends(get_db)
):
    """Update an existing recipe."""
    db_recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not db_recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    update_data = recipe.model_dump(exclude_unset=True, exclude={"ingredients"})
    for key, value in update_data.items():
        setattr(db_recipe, key, value)
    
    # Update ingredients if provided
    if recipe.ingredients is not None:
        # Remove existing ingredients
        db.query(RecipeIngredient).filter(RecipeIngredient.recipe_id == recipe_id).delete()
        # Add new ingredients
        for ing in recipe.ingredients:
            db_recipe_ingredient = RecipeIngredient(
                recipe_id=recipe_id,
                **ing.model_dump()
            )
            db.add(db_recipe_ingredient)
    
    db.commit()
    db.refresh(db_recipe)
    return db_recipe


@app.delete("/api/recipes/{recipe_id}")
async def delete_recipe(recipe_id: int, db: Session = Depends(get_db)):
    """Delete a recipe."""
    db_recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not db_recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    db.delete(db_recipe)
    db.commit()
    return {"message": "Recipe deleted successfully"}


# ===================== Production Batches API =====================
@app.get("/api/batches", response_model=List[ProductionBatchResponse])
async def list_batches(
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """List all production batches."""
    query = db.query(ProductionBatch)
    if status:
        query = query.filter(ProductionBatch.status == status)
    return query.order_by(ProductionBatch.created_at.desc()).all()


@app.get("/api/batches/{batch_id}", response_model=ProductionBatchResponse)
async def get_batch(batch_id: int, db: Session = Depends(get_db)):
    """Get a single production batch by ID."""
    batch = db.query(ProductionBatch).filter(ProductionBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    return batch


@app.post("/api/batches", response_model=ProductionBatchResponse)
async def create_batch(batch: ProductionBatchCreate, db: Session = Depends(get_db)):
    """Create a new production batch and calculate ingredient needs."""
    # 1. Create the Batch
    db_batch = ProductionBatch(**batch.model_dump())
    db.add(db_batch)
    db.flush()  # Get ID and default values
    
    # 2. Lookup Recipe Ingredients
    recipe = db.query(Recipe).filter(Recipe.id == batch.recipe_id).first()
    if not recipe:
        db.rollback()
        raise HTTPException(status_code=404, detail="Recipe not found")
        
    # 3. Calculate Scale Factor? 
    # Logic: If batch.total_weight is provided, compare with recipe.total_oils_weight?
    # For now, let's assume the frontend sends a 'scale_factor' or we trust the raw recipe if scale_factor is 1.0.
    # The batch model has 'scale_factor'. Let's use that to scale ingredients.
    
    scale = db_batch.scale_factor
    
    for recipe_ing in recipe.ingredients:
        # Calculate planned quantity
        planned_qty = recipe_ing.quantity * scale
        
        # Estimate cost (FIFO/Moving Average would be better, but using current cost_per_unit for now)
        ingredient = db.query(Ingredient).filter(Ingredient.id == recipe_ing.ingredient_id).first()
        estimated_cost = planned_qty * ingredient.cost_per_unit if ingredient else 0.0
        
        usage = BatchIngredientUsage(
            batch_id=db_batch.id,
            ingredient_id=recipe_ing.ingredient_id,
            planned_quantity=planned_qty,
            unit=recipe_ing.unit,
            cost=estimated_cost
        )
        db.add(usage)
        
    db.commit()
    db.refresh(db_batch)
    return db_batch


@app.put("/api/batches/{batch_id}", response_model=ProductionBatchResponse)
async def update_batch(
    batch_id: int,
    batch: ProductionBatchUpdate,
    db: Session = Depends(get_db)
):
    """Update a production batch."""
    db_batch = db.query(ProductionBatch).filter(ProductionBatch.id == batch_id).first()
    if not db_batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    
    update_data = batch.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_batch, key, value)
    
    db.commit()
    
    # Inventory Deduction Logic
    # If status changed to "Complete", deduct ingredients and add finished goods.
    if update_data.get("status") == "Complete":
        # 1. Deduct Ingredients
        # Check if usages have actual_quantity set (null means not deducted)
        usages = db.query(BatchIngredientUsage).filter(BatchIngredientUsage.batch_id == batch_id).all()
        for usage in usages:
            if usage.actual_quantity is None: # Not yet deducted/finalized
                # Default actual to planned if not specified
                actual = usage.planned_quantity
                usage.actual_quantity = actual
                
                # Deduct from Inventory
                ingredient = db.query(Ingredient).filter(Ingredient.id == usage.ingredient_id).first()
                if ingredient:
                    ingredient.quantity_on_hand -= actual
        
        # 2. Add Finished Goods to Stock
        recipe = db.query(Recipe).filter(Recipe.id == db_batch.recipe_id).first()
        if recipe:
            # Add yield quantity to stock
            # Only if yield_quantity is positive
            yield_qty = db_batch.yield_quantity
            if yield_qty > 0:
                recipe.stock_quantity += yield_qty
        
        db.commit()

    db.refresh(db_batch)
    return db_batch


# ===================== Lye Calculator API =====================
@app.post("/api/calculator/lye", response_model=LyeCalculatorResponse)
async def calculate_lye(
    request: LyeCalculatorRequest,
    db: Session = Depends(get_db)
):
    """Calculate lye and water amounts for a soap recipe."""
    total_oils = 0.0
    lye_naoh = 0.0
    lye_koh = 0.0
    
    for oil in request.oils:
        ingredient = db.query(Ingredient).filter(Ingredient.id == oil.get("ingredient_id")).first()
        if not ingredient:
            continue
        
        weight = oil.get("weight", 0)
        total_oils += weight
        
        # Calculate lye based on SAP values
        if request.lye_type == "NaOH" and ingredient.sap_naoh:
            lye_naoh += weight * (ingredient.sap_naoh / 1000)
        elif request.lye_type == "KOH" and ingredient.sap_koh:
            lye_koh += weight * (ingredient.sap_koh / 1000)
        elif request.lye_type == "Dual":
            if ingredient.sap_naoh:
                lye_naoh += weight * (ingredient.sap_naoh / 1000) * (request.naoh_ratio / 100)
            if ingredient.sap_koh:
                lye_koh += weight * (ingredient.sap_koh / 1000) * ((100 - request.naoh_ratio) / 100)
    
    # Apply superfat discount
    superfat_factor = 1 - (request.superfat_percentage / 100)
    lye_naoh *= superfat_factor
    lye_koh *= superfat_factor
    
    # Calculate water
    water = total_oils * (request.water_percentage / 100)
    
    # Total batch weight
    total_batch = total_oils + (lye_naoh if request.lye_type != "KOH" else 0) + \
                  (lye_koh if request.lye_type != "NaOH" else 0) + water
    
    return LyeCalculatorResponse(
        total_oils=round(total_oils, 2),
        lye_naoh=round(lye_naoh, 2) if lye_naoh > 0 else None,
        lye_koh=round(lye_koh, 2) if lye_koh > 0 else None,
        water=round(water, 2),
        superfat_percentage=request.superfat_percentage,
        total_batch_weight=round(total_batch, 2)
    )


# ===================== Dashboard Stats API =====================
@app.get("/api/dashboard/stats")
async def dashboard_stats(db: Session = Depends(get_db)):
    """Get dashboard statistics."""
    ingredient_count = db.query(Ingredient).count()
    recipe_count = db.query(Recipe).count()
    batch_count = db.query(ProductionBatch).count()
    active_batches = db.query(ProductionBatch).filter(
        ProductionBatch.status.in_(["Planned", "In Progress", "Curing"])
    ).count()
    
    # Low stock items (less than 100g/units)
    low_stock = db.query(Ingredient).filter(Ingredient.quantity_on_hand < 100).count()
    
    return {
        "ingredients": ingredient_count,
        "recipes": recipe_count,
        "batches": batch_count,
        "active_batches": active_batches,
        "low_stock_items": low_stock
    }


# ===================== Suppliers API =====================
@app.get("/api/suppliers", response_model=List[SupplierResponse])
async def list_suppliers(db: Session = Depends(get_db)):
    return db.query(Supplier).order_by(Supplier.name).all()


@app.post("/api/suppliers", response_model=SupplierResponse)
async def create_supplier(supplier: SupplierCreate, db: Session = Depends(get_db)):
    db_supplier = Supplier(**supplier.model_dump())
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    return db_supplier


@app.put("/api/suppliers/{supplier_id}", response_model=SupplierResponse)
async def update_supplier(supplier_id: int, supplier: SupplierUpdate, db: Session = Depends(get_db)):
    db_supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not db_supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    update_data = supplier.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_supplier, key, value)
    
    db.commit()
    db.refresh(db_supplier)
    return db_supplier


@app.delete("/api/suppliers/{supplier_id}")
async def delete_supplier(supplier_id: int, db: Session = Depends(get_db)):
    db_supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not db_supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    db.delete(db_supplier)
    db.commit()
    return {"message": "Supplier deleted successfully"}


# ===================== Customers API =====================
@app.get("/api/customers", response_model=List[CustomerResponse])
async def list_customers(db: Session = Depends(get_db)):
    return db.query(Customer).order_by(Customer.name).all()


@app.post("/api/customers", response_model=CustomerResponse)
async def create_customer(customer: CustomerCreate, db: Session = Depends(get_db)):
    db_customer = Customer(**customer.model_dump())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer


@app.put("/api/customers/{customer_id}", response_model=CustomerResponse)
async def update_customer(customer_id: int, customer: CustomerUpdate, db: Session = Depends(get_db)):
    db_customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    update_data = customer.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_customer, key, value)
    
    db.commit()
    db.refresh(db_customer)
    return db_customer


# ===================== Expenses API =====================
@app.get("/api/expenses", response_model=List[ExpenseResponse])
async def list_expenses(db: Session = Depends(get_db)):
    return db.query(Expense).order_by(Expense.date.desc()).all()


@app.post("/api/expenses", response_model=ExpenseResponse)
async def create_expense(expense: ExpenseCreate, db: Session = Depends(get_db)):
    db_expense = Expense(**expense.model_dump())
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense


@app.delete("/api/expenses/{expense_id}")
async def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    """Delete an expense."""
    db_expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    db.delete(db_expense)
    db.commit()
    return {"message": "Expense deleted successfully"}


@app.put("/api/expenses/{expense_id}", response_model=ExpenseResponse)
async def update_expense(expense_id: int, expense: ExpenseCreate, db: Session = Depends(get_db)):
    """Update an expense."""
    db_expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    for key, value in expense.model_dump().items():
        setattr(db_expense, key, value)
    db.commit()
    db.refresh(db_expense)
    return db_expense


# ===================== Supply Orders API =====================
@app.get("/api/supply-orders", response_model=List[SupplyOrderResponse])
async def list_supply_orders(db: Session = Depends(get_db)):
    """List all supply orders."""
    return db.query(SupplyOrder).order_by(SupplyOrder.order_date.desc()).all()


@app.get("/api/supply-orders/{order_id}", response_model=SupplyOrderResponse)
async def get_supply_order(order_id: int, db: Session = Depends(get_db)):
    """Get a single supply order."""
    order = db.query(SupplyOrder).filter(SupplyOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@app.post("/api/supply-orders", response_model=SupplyOrderResponse)
async def create_supply_order(order: SupplyOrderCreate, db: Session = Depends(get_db)):
    """Create a new supply order and update inventory if received."""
    items_data = order.items
    order_data = order.model_dump(exclude={"items"})
    
    db_order = SupplyOrder(**order_data)
    db.add(db_order)
    db.flush()
    
    for item in items_data:
        db_item = SupplyOrderItem(
            order_id=db_order.id,
            **item.model_dump()
        )
        db.add(db_item)
        
        # Inventory Logic: Update Ingredient Stock
        if order.status == "Received":
            ingredient = db.query(Ingredient).filter(Ingredient.id == item.ingredient_id).first()
            if ingredient:
                # Update quantity
                # TODO: Handle unit conversion if necessary. Assuming matching units for MVP.
                ingredient.quantity_on_hand += item.quantity
                
                # Update cost (Latest Cost strategy)
                if item.quantity > 0:
                    unit_cost = item.cost / item.quantity
                    ingredient.cost_per_unit = unit_cost
    
    db.commit()
    db.refresh(db_order)
    return db_order


# ===================== Sales Orders API =====================
@app.get("/api/sales-orders", response_model=List[SalesOrderResponse])
async def list_sales_orders(db: Session = Depends(get_db)):
    """List all sales orders."""
    return db.query(SalesOrder).order_by(SalesOrder.sale_date.desc()).all()


@app.get("/api/sales-orders/{order_id}", response_model=SalesOrderResponse)
async def get_sales_order(order_id: int, db: Session = Depends(get_db)):
    """Get a single sales order."""
    order = db.query(SalesOrder).filter(SalesOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@app.post("/api/sales-orders", response_model=SalesOrderResponse)
async def create_sales_order(order: SalesOrderCreate, db: Session = Depends(get_db)):
    """Create a new sales order."""
    items_data = order.items
    order_data = order.model_dump(exclude={"items"})
    
    db_order = SalesOrder(**order_data)
    db.add(db_order)
    db.flush()
    
    for item in items_data:
        db_item = SalesOrderItem(
            order_id=db_order.id,
            **item.model_dump()
        )
        db.add(db_item)
        
        # Inventory Logic: Deduct Stock
        if order.status == "Completed":
            recipe = db.query(Recipe).filter(Recipe.id == item.recipe_id).first()
            if recipe:
                recipe.stock_quantity -= item.quantity
    
    db.commit()
    db.refresh(db_order)
    return db_order
    
    db.commit()
    db.refresh(db_order)
    return db_order


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
