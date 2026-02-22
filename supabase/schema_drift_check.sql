-- ============================================================
-- SoapBuddy Schema Drift Check
-- ============================================================
-- Sprint 15: Run this against production to detect drift
-- between the canonical schema and the live database.
--
-- Usage: Execute in Supabase SQL Editor or via MCP execute_sql
-- Expected: All checks return ✅ PASS
-- ============================================================

-- CHECK 1: Expected tables exist (21 tables)
WITH expected_tables(tbl) AS (
    VALUES
    ('ingredients'), ('recipes'), ('recipe_ingredients'),
    ('production_batches'), ('batch_ingredient_usage'), ('fatty_acid_profiles'),
    ('suppliers'), ('supply_orders'), ('supply_order_items'),
    ('customers'), ('sales_orders'), ('sales_order_items'),
    ('expenses'), ('profiles'), ('stripe_customers'), ('subscriptions'),
    ('inventory_locations'), ('inventory_items'),
    ('molds'), ('formulations'),
    ('pdf_documents'), ('signed_documents')
),
missing AS (
    SELECT e.tbl FROM expected_tables e
    LEFT JOIN information_schema.tables t
      ON t.table_schema = 'public' AND t.table_name = e.tbl
    WHERE t.table_name IS NULL
)
SELECT
    'CHECK 1: All 22 expected tables exist' AS check_name,
    CASE WHEN (SELECT count(*) FROM missing) = 0
         THEN '✅ PASS'
         ELSE '❌ FAIL — missing: ' || (SELECT string_agg(tbl, ', ') FROM missing)
    END AS result;

-- CHECK 2: All tables have RLS enabled
SELECT
    'CHECK 2: RLS enabled on all tables' AS check_name,
    CASE WHEN count(*) = 0 THEN '✅ PASS'
         ELSE '❌ FAIL — RLS disabled on: ' || string_agg(c.relname, ', ')
    END AS result
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND NOT c.relrowsecurity
  AND c.relname NOT LIKE 'pg_%';

-- CHECK 3: No policies grant to public role
SELECT
    'CHECK 3: No public-role policies' AS check_name,
    CASE WHEN count(*) = 0 THEN '✅ PASS'
         ELSE '❌ FAIL — ' || count(*) || ' policies grant to public: ' ||
              string_agg(tablename || '.' || policyname, ', ')
    END AS result
FROM pg_policies
WHERE schemaname = 'public'
  AND '{public}' && roles;

-- CHECK 4: No permissive USING(true) / WITH CHECK(true) policies
SELECT
    'CHECK 4: No overly-permissive USING(true)' AS check_name,
    CASE WHEN count(*) = 0 THEN '✅ PASS'
         ELSE '❌ FAIL — ' || string_agg(tablename || '.' || policyname, ', ')
    END AS result
FROM pg_policies
WHERE schemaname = 'public'
  AND permissive = 'PERMISSIVE'
  AND (qual = 'true' OR with_check = 'true');

-- CHECK 5: All UPDATE policies have WITH CHECK
SELECT
    'CHECK 5: UPDATE policies have WITH CHECK' AS check_name,
    CASE WHEN count(*) = 0 THEN '✅ PASS'
         ELSE '❌ FAIL — ' || string_agg(tablename || '.' || policyname, ', ')
    END AS result
FROM pg_policies
WHERE schemaname = 'public'
  AND cmd IN ('UPDATE', 'ALL')
  AND with_check IS NULL;

-- CHECK 6: Expected function count (13 public + 1 private)
SELECT
    'CHECK 6: Function count' AS check_name,
    CASE
        WHEN (SELECT count(*) FROM pg_proc p
              JOIN pg_namespace n ON p.pronamespace = n.oid
              WHERE n.nspname = 'public' AND p.prokind = 'f') = 13
         AND (SELECT count(*) FROM pg_proc p
              JOIN pg_namespace n ON p.pronamespace = n.oid
              WHERE n.nspname = 'private' AND p.prokind = 'f') = 1
        THEN '✅ PASS (13 public + 1 private)'
        ELSE '⚠️ DRIFT — public: ' ||
             (SELECT count(*)::text FROM pg_proc p
              JOIN pg_namespace n ON p.pronamespace = n.oid
              WHERE n.nspname = 'public' AND p.prokind = 'f') ||
             ', private: ' ||
             (SELECT count(*)::text FROM pg_proc p
              JOIN pg_namespace n ON p.pronamespace = n.oid
              WHERE n.nspname = 'private' AND p.prokind = 'f')
    END AS result;

-- CHECK 7: Expected triggers exist
WITH expected_triggers(tbl, trg) AS (
    VALUES
    ('ingredients', 'update_ingredients_updated_at'),
    ('production_batches', 'update_batches_updated_at'),
    ('profiles', 'trg_prevent_profile_escalation'),
    ('recipes', 'check_recipe_limit_trigger'),
    ('recipes', 'enforce_recipe_limit'),
    ('recipes', 'update_recipes_updated_at')
),
missing AS (
    SELECT et.tbl, et.trg FROM expected_triggers et
    LEFT JOIN pg_trigger t
      JOIN pg_class c ON t.tgrelid = c.oid
      JOIN pg_namespace n ON c.relnamespace = n.oid
      ON n.nspname = 'public' AND c.relname = et.tbl AND t.tgname = et.trg
    WHERE t.tgname IS NULL
)
SELECT
    'CHECK 7: All 6 triggers exist' AS check_name,
    CASE WHEN (SELECT count(*) FROM missing) = 0
         THEN '✅ PASS'
         ELSE '❌ FAIL — missing: ' || (SELECT string_agg(tbl || '.' || trg, ', ') FROM missing)
    END AS result;

-- CHECK 8: Policy count sanity
SELECT
    'CHECK 8: Policy count' AS check_name,
    CASE
        WHEN count(*) BETWEEN 48 AND 60
        THEN '✅ PASS (' || count(*) || ' policies)'
        ELSE '⚠️ DRIFT — unexpected count: ' || count(*)
    END AS result
FROM pg_policies
WHERE schemaname = 'public';

-- CHECK 9: Critical columns exist
WITH expected_columns(tbl, col) AS (
    VALUES
    ('ingredients', 'user_id'), ('ingredients', 'barcode'), ('ingredients', 'reorder_threshold'),
    ('ingredients', 'expiry_date'),
    ('profiles', 'is_admin'), ('profiles', 'plan_tier'), ('profiles', 'settings'),
    ('profiles', 'business_address'), ('profiles', 'website'), ('profiles', 'tax_id'),
    ('batch_ingredient_usage', 'planned_quantity'), ('batch_ingredient_usage', 'supply_order_item_id'),
    ('supply_order_items', 'quantity_base_unit'),
    ('formulations', 'oils')
),
missing AS (
    SELECT ec.tbl, ec.col FROM expected_columns ec
    LEFT JOIN information_schema.columns c
      ON c.table_schema = 'public' AND c.table_name = ec.tbl AND c.column_name = ec.col
    WHERE c.column_name IS NULL
)
SELECT
    'CHECK 9: Critical columns present' AS check_name,
    CASE WHEN (SELECT count(*) FROM missing) = 0
         THEN '✅ PASS'
         ELSE '❌ FAIL — missing: ' || (SELECT string_agg(tbl || '.' || col, ', ') FROM missing)
    END AS result;

-- CHECK 10: Migration count
SELECT
    'CHECK 10: Migration history' AS check_name,
    'ℹ️ ' || count(*) || ' migrations tracked' AS result
FROM supabase_migrations.schema_migrations;
