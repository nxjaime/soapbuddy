-- ============================================================
-- SoapBuddy Canonical Schema — Production Snapshot
-- ============================================================
-- Generated: 2026-02-21 (Sprint 15)
-- Source of truth: Supabase project ezkqfuxzcbtywtfubmon
-- 
-- This file represents the COMPLETE database schema.
-- It is maintained as a reference and drift-check baseline.
-- All changes must go through tracked migrations via
--   mcp_supabase-mcp-server_apply_migration
-- ============================================================

-- ============================================================
-- 0. Private Schema — Admin Helper
-- ============================================================

CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- 1. Core Tables
-- ============================================================

-- Profiles (auth-linked, one per user)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_tier VARCHAR NOT NULL DEFAULT 'free'
        CHECK (plan_tier IN ('free', 'maker', 'manufacturer')),
    display_name VARCHAR,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_admin BOOLEAN DEFAULT false,
    settings JSONB DEFAULT '{}',
    business_address TEXT,
    business_logo_url TEXT,
    tax_id TEXT,
    website TEXT
);

-- Ingredients (raw materials)
CREATE TABLE IF NOT EXISTS ingredients (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL UNIQUE,
    category VARCHAR NOT NULL DEFAULT 'Other',
    inci_code VARCHAR,
    sap_naoh NUMERIC,
    sap_koh NUMERIC,
    unit VARCHAR NOT NULL DEFAULT 'g',
    quantity_on_hand NUMERIC NOT NULL DEFAULT 0.0,
    cost_per_unit NUMERIC(10, 4) NOT NULL DEFAULT 0.0,
    supplier VARCHAR,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id),
    barcode VARCHAR,
    reorder_threshold NUMERIC DEFAULT 0,
    expiry_date DATE
);

-- Recipes (soap formulas)
CREATE TABLE IF NOT EXISTS recipes (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    description TEXT,
    recipe_type VARCHAR NOT NULL DEFAULT 'Soap',
    lye_type VARCHAR NOT NULL DEFAULT 'NaOH',
    superfat_percentage NUMERIC NOT NULL DEFAULT 5.0,
    water_percentage NUMERIC NOT NULL DEFAULT 33.0,
    total_oils_weight NUMERIC NOT NULL DEFAULT 0.0,
    unit VARCHAR NOT NULL DEFAULT 'g',
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    default_price NUMERIC NOT NULL DEFAULT 0.0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id)
);

-- Recipe Ingredients (junction)
CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id SERIAL PRIMARY KEY,
    recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    ingredient_id INTEGER NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
    quantity NUMERIC NOT NULL,
    unit VARCHAR NOT NULL DEFAULT 'g',
    user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id)
);

-- Production Batches
CREATE TABLE IF NOT EXISTS production_batches (
    id SERIAL PRIMARY KEY,
    lot_number VARCHAR(50) UNIQUE NOT NULL,
    recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE RESTRICT,
    scale_factor NUMERIC NOT NULL DEFAULT 1.0,
    total_weight NUMERIC NOT NULL DEFAULT 0.0,
    yield_quantity INTEGER NOT NULL DEFAULT 0,
    status VARCHAR NOT NULL DEFAULT 'Planned',
    planned_date TIMESTAMPTZ,
    production_date TIMESTAMPTZ,
    cure_end_date TIMESTAMPTZ,
    total_cost NUMERIC DEFAULT 0.0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id)
);

-- Batch Ingredient Usage
CREATE TABLE IF NOT EXISTS batch_ingredient_usage (
    id SERIAL PRIMARY KEY,
    batch_id INTEGER NOT NULL REFERENCES production_batches(id) ON DELETE CASCADE,
    ingredient_id INTEGER NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
    quantity_used NUMERIC,
    unit VARCHAR NOT NULL DEFAULT 'g',
    cost NUMERIC NOT NULL DEFAULT 0.0,
    user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id),
    supply_order_item_id INTEGER REFERENCES supply_order_items(id),
    planned_quantity NUMERIC
);

-- Fatty Acid Profiles
CREATE TABLE IF NOT EXISTS fatty_acid_profiles (
    id SERIAL PRIMARY KEY,
    ingredient_id INTEGER UNIQUE NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    lauric NUMERIC DEFAULT 0.0,
    myristic NUMERIC DEFAULT 0.0,
    palmitic NUMERIC DEFAULT 0.0,
    stearic NUMERIC DEFAULT 0.0,
    ricinoleic NUMERIC DEFAULT 0.0,
    oleic NUMERIC DEFAULT 0.0,
    linoleic NUMERIC DEFAULT 0.0,
    linolenic NUMERIC DEFAULT 0.0,
    hardness NUMERIC DEFAULT 0.0,
    cleansing NUMERIC DEFAULT 0.0,
    conditioning NUMERIC DEFAULT 0.0,
    bubbly NUMERIC DEFAULT 0.0,
    creamy NUMERIC DEFAULT 0.0,
    iodine NUMERIC DEFAULT 0.0,
    ins NUMERIC DEFAULT 0.0,
    user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id)
);

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    contact_name VARCHAR,
    email VARCHAR,
    phone VARCHAR,
    website VARCHAR,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id)
);

-- Supply Orders
CREATE TABLE IF NOT EXISTS supply_orders (
    id SERIAL PRIMARY KEY,
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    order_date TIMESTAMPTZ DEFAULT NOW(),
    total_cost NUMERIC NOT NULL DEFAULT 0.0,
    status VARCHAR NOT NULL DEFAULT 'Ordered',
    invoice_number VARCHAR,
    notes TEXT,
    user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id)
);

-- Supply Order Items
CREATE TABLE IF NOT EXISTS supply_order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES supply_orders(id) ON DELETE CASCADE,
    ingredient_id INTEGER NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
    quantity NUMERIC NOT NULL,
    unit VARCHAR NOT NULL DEFAULT 'g',
    cost NUMERIC NOT NULL,
    lot_number VARCHAR,
    expiry_date TIMESTAMPTZ,
    user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id),
    quantity_base_unit NUMERIC
);

-- Customers
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    email VARCHAR,
    phone VARCHAR,
    address TEXT,
    customer_type VARCHAR DEFAULT 'Retail',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id)
);

-- Sales Orders
CREATE TABLE IF NOT EXISTS sales_orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    sale_date TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR NOT NULL DEFAULT 'Completed',
    payment_status VARCHAR NOT NULL DEFAULT 'Paid',
    total_amount NUMERIC NOT NULL DEFAULT 0.0,
    user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id)
);

-- Sales Order Items
CREATE TABLE IF NOT EXISTS sales_order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
    recipe_id INTEGER NOT NULL REFERENCES recipes(id),
    batch_id INTEGER REFERENCES production_batches(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC NOT NULL,
    discount NUMERIC DEFAULT 0.0,
    user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id)
);

-- Expenses
CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    date TIMESTAMPTZ DEFAULT NOW(),
    category VARCHAR NOT NULL,
    description VARCHAR NOT NULL,
    amount NUMERIC NOT NULL,
    receipt_image_path VARCHAR,
    user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id)
);

-- Inventory Locations
CREATE TABLE IF NOT EXISTS inventory_locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    type VARCHAR NOT NULL DEFAULT 'Warehouse',
    address TEXT,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id)
);

-- Inventory Items
CREATE TABLE IF NOT EXISTS inventory_items (
    id SERIAL PRIMARY KEY,
    batch_id INTEGER NOT NULL REFERENCES production_batches(id),
    location_id INTEGER NOT NULL REFERENCES inventory_locations(id),
    recipe_id INTEGER NOT NULL REFERENCES recipes(id),
    quantity INTEGER NOT NULL DEFAULT 0,
    moved_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id)
);

-- Molds
CREATE TABLE IF NOT EXISTS molds (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'Loaf',
    volume_ml NUMERIC DEFAULT 0,
    length_cm NUMERIC,
    width_cm NUMERIC,
    height_cm NUMERIC,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Formulations
CREATE TABLE IF NOT EXISTS formulations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    name TEXT NOT NULL,
    description TEXT,
    oils JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE formulations IS 'Stores saved soap formulations from the Formula Designer';
COMMENT ON COLUMN formulations.oils IS 'JSONB array of oil objects: [{ingredient_id: uuid, name: string, percentage: number}]';

-- ============================================================
-- 2. Stripe/Billing Tables
-- ============================================================

CREATE TABLE IF NOT EXISTS stripe_customers (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id),
    stripe_customer_id TEXT UNIQUE
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    status TEXT CHECK (status IN ('trialing','active','canceled','incomplete','incomplete_expired','past_due','unpaid','paused')),
    price_id TEXT,
    quantity INTEGER,
    cancel_at_period_end BOOLEAN,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    created TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    ended_at TIMESTAMPTZ,
    cancel_at TIMESTAMPTZ,
    canceled_at TIMESTAMPTZ,
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ
);

-- ============================================================
-- 3. PDF Signer Tables
-- ============================================================

CREATE TABLE IF NOT EXISTS pdf_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    file_path TEXT,
    fields JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS signed_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES pdf_documents(id),
    signer_name TEXT,
    signer_email TEXT,
    signed_at TIMESTAMPTZ DEFAULT NOW(),
    pdf_url TEXT,
    form_data JSONB DEFAULT '{}',
    user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id)
);

-- ============================================================
-- 4. Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_ingredients_name ON ingredients(name);
CREATE INDEX IF NOT EXISTS idx_ingredients_category ON ingredients(category);
CREATE INDEX IF NOT EXISTS idx_ingredients_user ON ingredients(user_id);
CREATE INDEX IF NOT EXISTS idx_recipes_name ON recipes(name);
CREATE INDEX IF NOT EXISTS idx_recipes_type ON recipes(recipe_type);
CREATE INDEX IF NOT EXISTS idx_recipes_user ON recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_batches_lot ON production_batches(lot_number);
CREATE INDEX IF NOT EXISTS idx_batches_recipe ON production_batches(recipe_id);
CREATE INDEX IF NOT EXISTS idx_batches_status ON production_batches(status);
CREATE INDEX IF NOT EXISTS idx_batches_user ON production_batches(user_id);
CREATE INDEX IF NOT EXISTS idx_batch_usage_batch ON batch_ingredient_usage(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_usage_ingredient ON batch_ingredient_usage(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_items_order ON sales_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_supply_items_order ON supply_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_supply_supplier ON supply_orders(supplier_id);

-- ============================================================
-- 5. Helper Functions (RPC)
-- ============================================================

-- Timestamp auto-update
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Recipe stock management
CREATE OR REPLACE FUNCTION increment_stock(recipe_id INTEGER, amount INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE recipes SET stock_quantity = stock_quantity + amount WHERE id = recipe_id;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION decrement_stock(recipe_id INTEGER, amount INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE recipes SET stock_quantity = GREATEST(0, stock_quantity - amount) WHERE id = recipe_id;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Unit conversion
CREATE OR REPLACE FUNCTION convert_weight(
    p_quantity NUMERIC, p_from_unit VARCHAR, p_to_unit VARCHAR
) RETURNS NUMERIC AS $$
DECLARE
    grams NUMERIC;
    conversion CONSTANT JSONB := '{"g":1,"kg":1000,"oz":28.3495,"lb":453.592,"ml":1,"l":1000,"floz":29.5735}'::jsonb;
BEGIN
    IF p_from_unit = p_to_unit THEN RETURN p_quantity; END IF;
    grams := p_quantity * (conversion->>p_from_unit)::numeric;
    RETURN ROUND(grams / (conversion->>p_to_unit)::numeric, 4);
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;

-- Batch lifecycle: start
CREATE OR REPLACE FUNCTION start_batch(p_batch_id INTEGER)
RETURNS VOID AS $$ BEGIN
    UPDATE production_batches
    SET status = 'In Progress', production_date = NOW(), updated_at = NOW()
    WHERE id = p_batch_id;
END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Batch lifecycle: allocate ingredients
CREATE OR REPLACE FUNCTION allocate_batch_ingredients(p_batch_id INTEGER)
RETURNS VOID AS $$
DECLARE v_usage RECORD;
BEGIN
    FOR v_usage IN
        SELECT ingredient_id, quantity_used, unit FROM batch_ingredient_usage WHERE batch_id = p_batch_id
    LOOP
        UPDATE ingredients
        SET quantity_on_hand = GREATEST(0, quantity_on_hand - v_usage.quantity_used), updated_at = NOW()
        WHERE id = v_usage.ingredient_id;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Batch lifecycle: complete
CREATE OR REPLACE FUNCTION complete_batch(p_batch_id INTEGER, p_yield_quantity INTEGER DEFAULT 0)
RETURNS VOID AS $$ BEGIN
    UPDATE production_batches
    SET status = CASE WHEN cure_end_date IS NOT NULL AND cure_end_date > NOW() THEN 'Curing' ELSE 'Completed' END,
        yield_quantity = CASE WHEN p_yield_quantity > 0 THEN p_yield_quantity ELSE yield_quantity END,
        updated_at = NOW()
    WHERE id = p_batch_id;
    IF p_yield_quantity > 0 THEN
        PERFORM increment_stock(
            (SELECT recipe_id FROM production_batches WHERE id = p_batch_id),
            p_yield_quantity
        );
    END IF;
END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Finalize batch (legacy, deducts ingredients + completes)
CREATE OR REPLACE FUNCTION finalize_batch(p_batch_id INTEGER)
RETURNS VOID AS $$
DECLARE v_recipe_id INTEGER; v_yield INTEGER; v_usage RECORD;
BEGIN
    SELECT recipe_id, yield_quantity INTO v_recipe_id, v_yield
    FROM production_batches WHERE id = p_batch_id;
    FOR v_usage IN SELECT ingredient_id, quantity_used FROM batch_ingredient_usage WHERE batch_id = p_batch_id
    LOOP
        UPDATE ingredients SET quantity_on_hand = GREATEST(0, quantity_on_hand - v_usage.quantity_used),
            updated_at = NOW() WHERE id = v_usage.ingredient_id;
    END LOOP;
    IF v_yield > 0 THEN
        UPDATE recipes SET stock_quantity = stock_quantity + v_yield WHERE id = v_recipe_id;
    END IF;
    UPDATE production_batches SET status = 'Completed', updated_at = NOW() WHERE id = p_batch_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Receive supply order (WAC inventory update)
CREATE OR REPLACE FUNCTION receive_supply_order(p_order_id INTEGER)
RETURNS VOID AS $$
DECLARE v_item RECORD; v_cur_qty NUMERIC; v_cur_cost NUMERIC; v_new_qty NUMERIC; v_new_cost NUMERIC;
BEGIN
    UPDATE supply_orders SET status = 'Received' WHERE id = p_order_id;
    FOR v_item IN SELECT ingredient_id, quantity, cost FROM supply_order_items WHERE order_id = p_order_id
    LOOP
        SELECT quantity_on_hand, cost_per_unit INTO v_cur_qty, v_cur_cost
        FROM ingredients WHERE id = v_item.ingredient_id;
        v_new_qty := COALESCE(v_cur_qty, 0) + v_item.quantity;
        v_new_cost := CASE WHEN v_new_qty > 0
            THEN ((COALESCE(v_cur_qty, 0) * COALESCE(v_cur_cost, 0)) + (v_item.quantity * v_item.cost)) / v_new_qty
            ELSE v_item.cost END;
        UPDATE ingredients SET quantity_on_hand = v_new_qty, cost_per_unit = v_new_cost, updated_at = NOW()
        WHERE id = v_item.ingredient_id;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Transactional recipe ingredient update
CREATE OR REPLACE FUNCTION update_recipe_ingredients(p_recipe_id INT, p_ingredients JSONB)
RETURNS VOID AS $$
BEGIN
    DELETE FROM recipe_ingredients WHERE recipe_id = p_recipe_id;
    INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit)
    SELECT p_recipe_id, (elem->>'ingredient_id')::int, (elem->>'quantity')::numeric,
           COALESCE(elem->>'unit', 'g')
    FROM jsonb_array_elements(p_ingredients) AS elem;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recipe limit trigger (tier-based)
CREATE OR REPLACE FUNCTION check_recipe_limit()
RETURNS TRIGGER AS $$
DECLARE
    recipe_count INTEGER;
    user_tier TEXT;
    max_recipes INTEGER;
BEGIN
    SELECT plan_tier INTO user_tier FROM profiles WHERE id = NEW.user_id;
    recipe_count := (SELECT COUNT(*) FROM recipes WHERE user_id = NEW.user_id);
    max_recipes := CASE user_tier
        WHEN 'manufacturer' THEN 999999
        WHEN 'maker' THEN 50
        ELSE 5
    END;
    IF recipe_count >= max_recipes THEN
        RAISE EXCEPTION 'Recipe limit reached for % plan (max %)', COALESCE(user_tier, 'free'), max_recipes;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Profile escalation guard
CREATE OR REPLACE FUNCTION prevent_profile_escalation()
RETURNS TRIGGER AS $$
BEGIN
    IF current_setting('role') = 'service_role' THEN RETURN NEW; END IF;
    IF OLD.is_admin IS DISTINCT FROM NEW.is_admin THEN
        RAISE EXCEPTION 'Cannot modify is_admin via client API';
    END IF;
    IF OLD.plan_tier IS DISTINCT FROM NEW.plan_tier THEN
        IF NOT OLD.is_admin THEN
            RAISE EXCEPTION 'Only admins can modify plan_tier';
        END IF;
        IF OLD.id = auth.uid() THEN
            RAISE EXCEPTION 'Admins cannot modify their own plan_tier';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- New user auto-profile
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, plan_tier)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 'free');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 6. Triggers
-- ============================================================

CREATE TRIGGER update_ingredients_updated_at
    BEFORE UPDATE ON ingredients FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_recipes_updated_at
    BEFORE UPDATE ON recipes FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_batches_updated_at
    BEFORE UPDATE ON production_batches FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER check_recipe_limit_trigger
    BEFORE INSERT ON recipes FOR EACH ROW EXECUTE FUNCTION check_recipe_limit();

CREATE TRIGGER enforce_recipe_limit
    BEFORE INSERT ON recipes FOR EACH ROW EXECUTE FUNCTION check_recipe_limit();

CREATE TRIGGER trg_prevent_profile_escalation
    BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION prevent_profile_escalation();

-- Auth trigger (on auth.users, applied via Supabase dashboard)
-- CREATE TRIGGER on_auth_user_created
--     AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 7. Row Level Security (RLS) — Hardened (Sprint 14)
-- ============================================================

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
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE molds ENABLE ROW LEVEL SECURITY;
ALTER TABLE formulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE signed_documents ENABLE ROW LEVEL SECURITY;

-- ---- User-scoped tables (13 core tables) ----
-- Pattern: SELECT/INSERT/UPDATE/DELETE scoped to auth.uid() = user_id

-- ingredients
CREATE POLICY "ingredients_select" ON ingredients FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "ingredients_insert" ON ingredients FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ingredients_update" ON ingredients FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ingredients_delete" ON ingredients FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- recipes
CREATE POLICY "recipes_select" ON recipes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "recipes_insert" ON recipes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "recipes_update" ON recipes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "recipes_delete" ON recipes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- recipe_ingredients
CREATE POLICY "recipe_ingredients_select" ON recipe_ingredients FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "recipe_ingredients_insert" ON recipe_ingredients FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "recipe_ingredients_update" ON recipe_ingredients FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "recipe_ingredients_delete" ON recipe_ingredients FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- production_batches
CREATE POLICY "batches_select" ON production_batches FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "batches_insert" ON production_batches FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "batches_update" ON production_batches FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "batches_delete" ON production_batches FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- batch_ingredient_usage
CREATE POLICY "batch_usage_select" ON batch_ingredient_usage FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "batch_usage_insert" ON batch_ingredient_usage FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "batch_usage_update" ON batch_ingredient_usage FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "batch_usage_delete" ON batch_ingredient_usage FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- fatty_acid_profiles
CREATE POLICY "fatty_acid_select" ON fatty_acid_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "fatty_acid_insert" ON fatty_acid_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "fatty_acid_update" ON fatty_acid_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "fatty_acid_delete" ON fatty_acid_profiles FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- suppliers
CREATE POLICY "suppliers_select" ON suppliers FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "suppliers_insert" ON suppliers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "suppliers_update" ON suppliers FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "suppliers_delete" ON suppliers FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- supply_orders
CREATE POLICY "supply_orders_select" ON supply_orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "supply_orders_insert" ON supply_orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "supply_orders_update" ON supply_orders FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "supply_orders_delete" ON supply_orders FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- supply_order_items
CREATE POLICY "supply_items_select" ON supply_order_items FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "supply_items_insert" ON supply_order_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "supply_items_update" ON supply_order_items FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "supply_items_delete" ON supply_order_items FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- customers
CREATE POLICY "customers_select" ON customers FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "customers_insert" ON customers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "customers_update" ON customers FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "customers_delete" ON customers FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- sales_orders
CREATE POLICY "sales_select" ON sales_orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "sales_insert" ON sales_orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sales_update" ON sales_orders FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sales_delete" ON sales_orders FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- sales_order_items
CREATE POLICY "sales_items_select" ON sales_order_items FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "sales_items_insert" ON sales_order_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sales_items_update" ON sales_order_items FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sales_items_delete" ON sales_order_items FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- expenses
CREATE POLICY "expenses_select" ON expenses FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "expenses_insert" ON expenses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "expenses_update" ON expenses FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "expenses_delete" ON expenses FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ---- Inventory tables ----

-- inventory_locations
CREATE POLICY "inv_locations_select" ON inventory_locations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "inv_locations_insert" ON inventory_locations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "inv_locations_update" ON inventory_locations FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "inv_locations_delete" ON inventory_locations FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- inventory_items
CREATE POLICY "inv_items_select" ON inventory_items FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "inv_items_insert" ON inventory_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "inv_items_update" ON inventory_items FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "inv_items_delete" ON inventory_items FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ---- Feature tables ----

-- molds
CREATE POLICY "molds_all" ON molds FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- formulations
CREATE POLICY "formulations_all" ON formulations FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- pdf_documents
CREATE POLICY "pdf_docs_all" ON pdf_documents FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- signed_documents
CREATE POLICY "signed_docs_all" ON signed_documents FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ---- Billing tables ----

-- stripe_customers
CREATE POLICY "stripe_customers_all" ON stripe_customers FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- subscriptions
CREATE POLICY "subscriptions_all" ON subscriptions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ---- Profiles (special) ----

-- Users can read their own profile
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
-- Users can update their own profile (escalation guard in trigger)
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
-- Admins can read all profiles
CREATE POLICY "profiles_admin_select" ON profiles FOR SELECT TO authenticated USING (private.is_admin());
-- Admins can update other profiles (for tier management)
CREATE POLICY "profiles_admin_update" ON profiles FOR UPDATE TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());

-- ============================================================
-- END OF SCHEMA
-- ============================================================
