-- ============================================================
-- Migration: Multi-tenancy and RLS Security Refactor
-- Description: Adds user_id to all tables and enforces RLS policies
-- ============================================================

-- 1. Add user_id column to all tables
-- We use DEFAULT auth.uid() to automatically assign the current user on insert

DO $$ 
BEGIN
    -- Ingredients & Fatty Acid Profiles
    ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
    ALTER TABLE fatty_acid_profiles ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();

    -- Recipes & Recipe Ingredients
    ALTER TABLE recipes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
    ALTER TABLE recipe_ingredients ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();

    -- Production
    ALTER TABLE production_batches ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
    ALTER TABLE batch_ingredient_usage ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();

    -- Business Entities
    ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
    ALTER TABLE customers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
    ALTER TABLE expenses ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();

    -- Orders
    ALTER TABLE supply_orders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
    ALTER TABLE supply_order_items ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
    ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
    ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
END $$;

-- 2. Drop existing permissive policies
DROP POLICY IF EXISTS "Authenticated users only" ON ingredients;
DROP POLICY IF EXISTS "Authenticated users only" ON recipes;
DROP POLICY IF EXISTS "Authenticated users only" ON production_batches;
DROP POLICY IF EXISTS "Authenticated users only" ON suppliers;
DROP POLICY IF EXISTS "Authenticated users only" ON supply_orders;
DROP POLICY IF EXISTS "Authenticated users only" ON customers;
DROP POLICY IF EXISTS "Authenticated users only" ON sales_orders;
DROP POLICY IF EXISTS "Authenticated users only" ON expenses;
DROP POLICY IF EXISTS "Authenticated users only" ON recipe_ingredients;
DROP POLICY IF EXISTS "Authenticated users only" ON batch_ingredient_usage;
DROP POLICY IF EXISTS "Authenticated users only" ON supply_order_items;
DROP POLICY IF EXISTS "Authenticated users only" ON sales_order_items;
DROP POLICY IF EXISTS "Authenticated users only" ON fatty_acid_profiles;

-- 3. Create helper function for RLS
-- This function simplifies the policy definition
CREATE OR REPLACE FUNCTION is_owner(resource_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.uid() = resource_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Enable RLS and Create Secure Policies

-- Macro-like approach isn't available in standard SQL for creating policies, so we repeat.

-- Ingredients
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner can select ingredients" ON ingredients FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owner can insert ingredients" ON ingredients FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner can update ingredients" ON ingredients FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owner can delete ingredients" ON ingredients FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Fatty Acid Profiles
ALTER TABLE fatty_acid_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner can select profiles" ON fatty_acid_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owner can insert profiles" ON fatty_acid_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner can update profiles" ON fatty_acid_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owner can delete profiles" ON fatty_acid_profiles FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Recipes
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner can select recipes" ON recipes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owner can insert recipes" ON recipes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner can update recipes" ON recipes FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owner can delete recipes" ON recipes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Recipe Ingredients
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner can select recipe ingredients" ON recipe_ingredients FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owner can insert recipe ingredients" ON recipe_ingredients FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner can update recipe ingredients" ON recipe_ingredients FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owner can delete recipe ingredients" ON recipe_ingredients FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Production Batches
ALTER TABLE production_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner can select batches" ON production_batches FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owner can insert batches" ON production_batches FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner can update batches" ON production_batches FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owner can delete batches" ON production_batches FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Batch Ingredient Usage
ALTER TABLE batch_ingredient_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner can select batch usage" ON batch_ingredient_usage FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owner can insert batch usage" ON batch_ingredient_usage FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner can update batch usage" ON batch_ingredient_usage FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owner can delete batch usage" ON batch_ingredient_usage FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Suppliers
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner can select suppliers" ON suppliers FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owner can insert suppliers" ON suppliers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner can update suppliers" ON suppliers FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owner can delete suppliers" ON suppliers FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Supply Orders
ALTER TABLE supply_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner can select supply orders" ON supply_orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owner can insert supply orders" ON supply_orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner can update supply orders" ON supply_orders FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owner can delete supply orders" ON supply_orders FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Supply Order Items
ALTER TABLE supply_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner can select supply order items" ON supply_order_items FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owner can insert supply order items" ON supply_order_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner can update supply order items" ON supply_order_items FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owner can delete supply order items" ON supply_order_items FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Customers
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner can select customers" ON customers FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owner can insert customers" ON customers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner can update customers" ON customers FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owner can delete customers" ON customers FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Sales Orders
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner can select sales orders" ON sales_orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owner can insert sales orders" ON sales_orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner can update sales orders" ON sales_orders FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owner can delete sales orders" ON sales_orders FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Sales Order Items
ALTER TABLE sales_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner can select sales order items" ON sales_order_items FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owner can insert sales order items" ON sales_order_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner can update sales order items" ON sales_order_items FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owner can delete sales order items" ON sales_order_items FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Expenses
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner can select expenses" ON expenses FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owner can insert expenses" ON expenses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner can update expenses" ON expenses FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owner can delete expenses" ON expenses FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 5. Create storage buckets for images (in case they don't exist)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies (if you use storage)
CREATE POLICY "Authenticated users can upload images" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'images');

CREATE POLICY "Authenticated users can update images" ON storage.objects
FOR UPDATE TO authenticated WITH CHECK (bucket_id = 'images' AND owner = auth.uid());

-- Public view for images (if needed) or restricted
CREATE POLICY "Anyone can view images" ON storage.objects
FOR SELECT TO public USING (bucket_id = 'images');

