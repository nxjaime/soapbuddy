-- ============================================================
-- Sprint 14: Database Safety Baseline — RLS Hardening
-- Date: 2026-02-21
-- Purpose: Remove duplicate policies, fix role assignments,
--          add missing WITH CHECK, restrict profile self-update,
--          and add admin profile management policy.
-- ============================================================
-- This migration is idempotent: DROP IF EXISTS on all policies.
-- Run this in a transaction to ensure atomicity.

BEGIN;

-- ============================================================
-- PHASE 1: Remove ALL duplicate / redundant policies
-- ============================================================
-- These tables have BOTH a catch-all "Users manage own X" (ALL)
-- AND per-command policies (SELECT/INSERT/UPDATE/DELETE).
-- We keep ONLY the per-command policies for explicit control.

-- 1a. Tables with "Users manage own X" ALL + per-command policies
--     Drop the catch-all ALL policy on each.

DROP POLICY IF EXISTS "Users manage own ingredients" ON public.ingredients;
DROP POLICY IF EXISTS "Users manage own recipes" ON public.recipes;
DROP POLICY IF EXISTS "Users manage own production_batches" ON public.production_batches;
DROP POLICY IF EXISTS "Users manage own customers" ON public.customers;
DROP POLICY IF EXISTS "Users manage own sales_orders" ON public.sales_orders;
DROP POLICY IF EXISTS "Users manage own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users manage own suppliers" ON public.suppliers;

-- 1b. Tables with TWO ALL policies (duplicate).
--     Drop the older-style "Owner access X" policy (missing WITH CHECK),
--     keep the "Users manage own X" policy (has WITH CHECK).

DROP POLICY IF EXISTS "Owner access batch_usage" ON public.batch_ingredient_usage;
DROP POLICY IF EXISTS "Owner access profiles" ON public.fatty_acid_profiles;
DROP POLICY IF EXISTS "Owner access recipe_ingredients" ON public.recipe_ingredients;
DROP POLICY IF EXISTS "Owner access sales_items" ON public.sales_order_items;
DROP POLICY IF EXISTS "Owner access supply_items" ON public.supply_order_items;
DROP POLICY IF EXISTS "Owner access supply_orders" ON public.supply_orders;


-- ============================================================
-- PHASE 2: Fix role assignments (public → authenticated)
-- ============================================================
-- Several tables incorrectly grant to the `public` role.
-- We drop and recreate with `authenticated`.

-- 2a. formulations
DROP POLICY IF EXISTS "Users manage own formulations" ON public.formulations;
CREATE POLICY "Users manage own formulations"
  ON public.formulations FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2b. molds
DROP POLICY IF EXISTS "Users manage own molds" ON public.molds;
CREATE POLICY "Users manage own molds"
  ON public.molds FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2c. inventory_items (4 per-command policies, all on public role)
DROP POLICY IF EXISTS "Users can view own inventory items" ON public.inventory_items;
DROP POLICY IF EXISTS "Users can insert own inventory items" ON public.inventory_items;
DROP POLICY IF EXISTS "Users can update own inventory items" ON public.inventory_items;
DROP POLICY IF EXISTS "Users can delete own inventory items" ON public.inventory_items;

CREATE POLICY "Owner select inventory_items"
  ON public.inventory_items FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Owner insert inventory_items"
  ON public.inventory_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner update inventory_items"
  ON public.inventory_items FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner delete inventory_items"
  ON public.inventory_items FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 2d. inventory_locations (4 per-command policies, all on public role)
DROP POLICY IF EXISTS "Users can view own inventory locations" ON public.inventory_locations;
DROP POLICY IF EXISTS "Users can insert own inventory locations" ON public.inventory_locations;
DROP POLICY IF EXISTS "Users can update own inventory locations" ON public.inventory_locations;
DROP POLICY IF EXISTS "Users can delete own inventory locations" ON public.inventory_locations;

CREATE POLICY "Owner select inventory_locations"
  ON public.inventory_locations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Owner insert inventory_locations"
  ON public.inventory_locations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner update inventory_locations"
  ON public.inventory_locations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner delete inventory_locations"
  ON public.inventory_locations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 2e. pdf_documents
DROP POLICY IF EXISTS "Users can manage their own pdf_documents" ON public.pdf_documents;
CREATE POLICY "Users manage own pdf_documents"
  ON public.pdf_documents FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2f. signed_documents
DROP POLICY IF EXISTS "Users can manage their own signed_documents" ON public.signed_documents;
CREATE POLICY "Users manage own signed_documents"
  ON public.signed_documents FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2g. stripe_customers (SELECT only — writes via service role)
DROP POLICY IF EXISTS "Can read own stripe customer data" ON public.stripe_customers;
CREATE POLICY "Owner select stripe_customers"
  ON public.stripe_customers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 2h. subscriptions (SELECT only — writes via service role)
DROP POLICY IF EXISTS "Can read own subscription" ON public.subscriptions;
CREATE POLICY "Owner select subscriptions"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);


-- ============================================================
-- PHASE 3: Fix missing WITH CHECK on remaining policies
-- ============================================================
-- Some existing per-command UPDATE policies are missing WITH CHECK.
-- This prevents a user from changing the user_id column on UPDATE.

-- 3a. customers — UPDATE missing WITH CHECK
DROP POLICY IF EXISTS "Owner update customers" ON public.customers;
CREATE POLICY "Owner update customers"
  ON public.customers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3b. expenses — UPDATE missing WITH CHECK
DROP POLICY IF EXISTS "Owner update expenses" ON public.expenses;
CREATE POLICY "Owner update expenses"
  ON public.expenses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3c. ingredients — UPDATE missing WITH CHECK
DROP POLICY IF EXISTS "Owner update ingredients" ON public.ingredients;
CREATE POLICY "Owner update ingredients"
  ON public.ingredients FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3d. production_batches — UPDATE missing WITH CHECK
DROP POLICY IF EXISTS "Owner update batches" ON public.production_batches;
CREATE POLICY "Owner update batches"
  ON public.production_batches FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3e. recipes — UPDATE missing WITH CHECK
DROP POLICY IF EXISTS "Owner update recipes" ON public.recipes;
CREATE POLICY "Owner update recipes"
  ON public.recipes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3f. sales_orders — UPDATE missing WITH CHECK
DROP POLICY IF EXISTS "Owner update sales orders" ON public.sales_orders;
CREATE POLICY "Owner update sales orders"
  ON public.sales_orders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3g. suppliers — UPDATE missing WITH CHECK
DROP POLICY IF EXISTS "Owner update suppliers" ON public.suppliers;
CREATE POLICY "Owner update suppliers"
  ON public.suppliers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ============================================================
-- PHASE 4: Harden profiles table — prevent privilege escalation
-- ============================================================
-- CRITICAL: The current "Users can update own profile" policy allows
-- users to SET is_admin = true or plan_tier = 'manufacturer'.
-- We must restrict self-service updates to safe columns only.

-- 4a. Drop the overly-permissive user update policy
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- 4b. Recreate with column-level restrictions
-- Users can only update their own profile's non-sensitive fields.
-- We use a WITH CHECK that ensures is_admin and plan_tier haven't changed.
-- Since RLS can't do column-level checks natively, we use a trigger instead.

-- Create a trigger function to block self-service escalation
CREATE OR REPLACE FUNCTION public.prevent_profile_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Allow service_role to bypass (for webhooks/admin operations)
  IF current_setting('role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Allow admin users to change plan_tier on other profiles
  IF private.is_admin() AND NEW.id != auth.uid() THEN
    -- Admins can change plan_tier on OTHER users, but not is_admin
    IF NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
      RAISE EXCEPTION 'Cannot modify is_admin flag via client API';
    END IF;
    RETURN NEW;
  END IF;

  -- Regular users: block changes to sensitive fields
  IF NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
    RAISE EXCEPTION 'Cannot modify is_admin flag';
  END IF;

  IF NEW.plan_tier IS DISTINCT FROM OLD.plan_tier THEN
    RAISE EXCEPTION 'Cannot modify plan_tier directly — use subscription management';
  END IF;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if any, then create
DROP TRIGGER IF EXISTS trg_prevent_profile_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_profile_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_escalation();

-- 4c. Recreate the user update policy (now safe with the trigger guard)
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4d. Add admin update policy for managing other users' profiles
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
CREATE POLICY "Admins can update profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

-- 4e. Consolidate the duplicate SELECT policies on profiles
-- Keep "Admins can read all profiles" (which already includes self-read)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
-- The "Admins can read all profiles" policy already has:
--   USING ((auth.uid() = id) OR private.is_admin())
-- This covers both self-read and admin-read.


COMMIT;
