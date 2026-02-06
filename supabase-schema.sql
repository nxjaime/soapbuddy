-- ============================================================
-- SoapBuddy Database Schema for Supabase (PostgreSQL)
-- ============================================================
-- Run this in the Supabase SQL Editor to create all tables
-- ============================================================

-- Enable UUID extension (optional, for future use)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Core Tables
-- ============================================================

-- Ingredients (raw materials for soap making)
CREATE TABLE IF NOT EXISTS ingredients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'Other',
    inci_code VARCHAR(100),
    sap_naoh DECIMAL(10, 4),
    sap_koh DECIMAL(10, 4),
    unit VARCHAR(20) NOT NULL DEFAULT 'g',
    quantity_on_hand DECIMAL(10, 2) NOT NULL DEFAULT 0.0,
    cost_per_unit DECIMAL(10, 4) NOT NULL DEFAULT 0.0,
    supplier VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recipes (soap formulas)
CREATE TABLE IF NOT EXISTS recipes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    recipe_type VARCHAR(50) NOT NULL DEFAULT 'Soap',
    lye_type VARCHAR(10) NOT NULL DEFAULT 'NaOH',
    superfat_percentage DECIMAL(5, 2) NOT NULL DEFAULT 5.0,
    water_percentage DECIMAL(5, 2) NOT NULL DEFAULT 33.0,
    total_oils_weight DECIMAL(10, 2) NOT NULL DEFAULT 0.0,
    unit VARCHAR(20) NOT NULL DEFAULT 'g',
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    default_price DECIMAL(10, 2) NOT NULL DEFAULT 0.0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recipe Ingredients (many-to-many linking recipes to ingredients)
CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id SERIAL PRIMARY KEY,
    recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    ingredient_id INTEGER NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
    quantity DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(20) NOT NULL DEFAULT 'g'
);

-- Production Batches (manufacturing runs)
CREATE TABLE IF NOT EXISTS production_batches (
    id SERIAL PRIMARY KEY,
    lot_number VARCHAR(50) UNIQUE NOT NULL,
    recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE RESTRICT,
    scale_factor DECIMAL(10, 4) NOT NULL DEFAULT 1.0,
    total_weight DECIMAL(10, 2) NOT NULL DEFAULT 0.0,
    yield_quantity INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'Planned',
    planned_date TIMESTAMP WITH TIME ZONE,
    production_date TIMESTAMP WITH TIME ZONE,
    cure_end_date TIMESTAMP WITH TIME ZONE,
    total_cost DECIMAL(10, 2) DEFAULT 0.0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Batch Ingredient Usage (actual ingredients used in a batch)
CREATE TABLE IF NOT EXISTS batch_ingredient_usage (
    id SERIAL PRIMARY KEY,
    batch_id INTEGER NOT NULL REFERENCES production_batches(id) ON DELETE CASCADE,
    ingredient_id INTEGER NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
    quantity_used DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(20) NOT NULL DEFAULT 'g',
    cost DECIMAL(10, 2) NOT NULL DEFAULT 0.0
);

-- Fatty Acid Profiles (for soap quality calculations)
CREATE TABLE IF NOT EXISTS fatty_acid_profiles (
    id SERIAL PRIMARY KEY,
    ingredient_id INTEGER UNIQUE NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    lauric DECIMAL(5, 2) DEFAULT 0.0,
    myristic DECIMAL(5, 2) DEFAULT 0.0,
    palmitic DECIMAL(5, 2) DEFAULT 0.0,
    stearic DECIMAL(5, 2) DEFAULT 0.0,
    ricinoleic DECIMAL(5, 2) DEFAULT 0.0,
    oleic DECIMAL(5, 2) DEFAULT 0.0,
    linoleic DECIMAL(5, 2) DEFAULT 0.0,
    linolenic DECIMAL(5, 2) DEFAULT 0.0,
    hardness DECIMAL(5, 2) DEFAULT 0.0,
    cleansing DECIMAL(5, 2) DEFAULT 0.0,
    conditioning DECIMAL(5, 2) DEFAULT 0.0,
    bubbly DECIMAL(5, 2) DEFAULT 0.0,
    creamy DECIMAL(5, 2) DEFAULT 0.0,
    iodine DECIMAL(5, 2) DEFAULT 0.0,
    ins DECIMAL(5, 2) DEFAULT 0.0
);

-- ============================================================
-- Business Tables
-- ============================================================

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    contact_name VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(50),
    website VARCHAR(200),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Supply Orders (purchases from suppliers)
CREATE TABLE IF NOT EXISTS supply_orders (
    id SERIAL PRIMARY KEY,
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_cost DECIMAL(10, 2) NOT NULL DEFAULT 0.0,
    status VARCHAR(20) NOT NULL DEFAULT 'Ordered',
    invoice_number VARCHAR(50),
    notes TEXT
);

-- Supply Order Items (line items in purchase orders)
CREATE TABLE IF NOT EXISTS supply_order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES supply_orders(id) ON DELETE CASCADE,
    ingredient_id INTEGER NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
    quantity DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(20) NOT NULL DEFAULT 'g',
    cost DECIMAL(10, 2) NOT NULL,
    lot_number VARCHAR(50),
    expiry_date TIMESTAMP WITH TIME ZONE
);

-- Customers
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(50),
    address TEXT,
    customer_type VARCHAR(20) DEFAULT 'Retail',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sales Orders
CREATE TABLE IF NOT EXISTS sales_orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    sale_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'Completed',
    payment_status VARCHAR(20) NOT NULL DEFAULT 'Paid',
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.0
);

-- Sales Order Items (line items in sales)
CREATE TABLE IF NOT EXISTS sales_order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
    recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE RESTRICT,
    batch_id INTEGER REFERENCES production_batches(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    discount DECIMAL(10, 2) DEFAULT 0.0
);

-- Expenses (non-ingredient business expenses)
CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    category VARCHAR(50) NOT NULL,
    description VARCHAR(200) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    receipt_image_path VARCHAR(200)
);

-- ============================================================
-- Indexes for Performance
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_ingredients_name ON ingredients(name);
CREATE INDEX IF NOT EXISTS idx_ingredients_category ON ingredients(category);
CREATE INDEX IF NOT EXISTS idx_recipes_name ON recipes(name);
CREATE INDEX IF NOT EXISTS idx_recipes_type ON recipes(recipe_type);
CREATE INDEX IF NOT EXISTS idx_batches_lot ON production_batches(lot_number);
CREATE INDEX IF NOT EXISTS idx_batches_status ON production_batches(status);
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_sales_orders_date ON sales_orders(sale_date);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);

-- ============================================================
-- Helper Functions (RPC)
-- ============================================================

-- Function to increment recipe stock (called when batch completes)
CREATE OR REPLACE FUNCTION increment_stock(recipe_id INTEGER, amount INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE recipes
    SET stock_quantity = stock_quantity + amount,
        updated_at = NOW()
    WHERE id = recipe_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement recipe stock (called when sale completes)
CREATE OR REPLACE FUNCTION decrement_stock(recipe_id INTEGER, amount INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE recipes
    SET stock_quantity = GREATEST(stock_quantity - amount, 0),
        updated_at = NOW()
    WHERE id = recipe_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Auto-update timestamps trigger
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_ingredients_updated_at
    BEFORE UPDATE ON ingredients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_recipes_updated_at
    BEFORE UPDATE ON recipes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_batches_updated_at
    BEFORE UPDATE ON production_batches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Row Level Security (RLS) Policies
-- Enable these after setting up authentication
-- ============================================================

-- Enable RLS on all tables (but allow public access for now)
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_ingredient_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE fatty_acid_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE supply_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE supply_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Temporary: Allow all operations for anonymous users
-- Replace with proper user-based policies after adding auth
CREATE POLICY "Allow all for anon" ON ingredients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON recipes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON recipe_ingredients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON production_batches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON batch_ingredient_usage FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON fatty_acid_profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON suppliers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON supply_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON supply_order_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON sales_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON sales_order_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON expenses FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- Sample Data (optional - uncomment to add)
-- ============================================================

/*
-- Sample ingredients
INSERT INTO ingredients (name, category, sap_naoh, sap_koh) VALUES
    ('Olive Oil', 'Base Oil', 0.135, 0.19),
    ('Coconut Oil', 'Base Oil', 0.178, 0.257),
    ('Palm Oil', 'Base Oil', 0.141, 0.199),
    ('Castor Oil', 'Base Oil', 0.128, 0.18),
    ('Shea Butter', 'Butter', 0.128, 0.18),
    ('Sodium Hydroxide (NaOH)', 'Lye', NULL, NULL),
    ('Potassium Hydroxide (KOH)', 'Lye', NULL, NULL),
    ('Distilled Water', 'Liquid', NULL, NULL),
    ('Lavender Essential Oil', 'Essential Oil', NULL, NULL),
    ('Activated Charcoal', 'Additive', NULL, NULL);
*/

-- ============================================================
-- Schema Complete!
-- ============================================================
