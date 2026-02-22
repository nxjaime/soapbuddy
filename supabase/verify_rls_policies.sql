-- ============================================================
-- Sprint 14: RLS Policy Verification Script
-- Date: 2026-02-21
-- Purpose: Run after deployments to verify RLS policy compliance.
--          This script returns PASS/FAIL for each check.
--          Any FAIL result should block the release.
-- ============================================================

-- CHECK 1: No policies should grant to the `public` role
-- (all should be `authenticated` or `service_role`)
SELECT
  'CHECK 1: No public-role policies' AS check_name,
  CASE
    WHEN count(*) = 0 THEN '✅ PASS'
    ELSE '❌ FAIL — ' || count(*) || ' policies grant to public role'
  END AS result,
  COALESCE(
    string_agg(tablename || '.' || policyname, ', '),
    'none'
  ) AS offending_policies
FROM pg_policies
WHERE schemaname = 'public'
  AND roles::text LIKE '%public%';

-- CHECK 2: No USING (true) or WITH CHECK (true) policies exist
SELECT
  'CHECK 2: No permissive USING(true) policies' AS check_name,
  CASE
    WHEN count(*) = 0 THEN '✅ PASS'
    ELSE '❌ FAIL — ' || count(*) || ' policies use USING(true) or WITH CHECK(true)'
  END AS result,
  COALESCE(
    string_agg(tablename || '.' || policyname, ', '),
    'none'
  ) AS offending_policies
FROM pg_policies
WHERE schemaname = 'public'
  AND (qual = 'true' OR with_check = 'true');

-- CHECK 3: Every table with RLS enabled should have at least one policy
SELECT
  'CHECK 3: All RLS-enabled tables have policies' AS check_name,
  CASE
    WHEN count(*) = 0 THEN '✅ PASS'
    ELSE '❌ FAIL — ' || count(*) || ' tables have RLS enabled but no policies'
  END AS result,
  COALESCE(
    string_agg(c.relname, ', '),
    'none'
  ) AS offending_tables
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relrowsecurity = true
  AND NOT EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.schemaname = 'public'
      AND p.tablename = c.relname
  );

-- CHECK 4: No duplicate ALL policies on the same table
SELECT
  'CHECK 4: No duplicate ALL policies per table' AS check_name,
  CASE
    WHEN count(*) = 0 THEN '✅ PASS'
    ELSE '❌ FAIL — ' || count(*) || ' tables have duplicate ALL policies'
  END AS result,
  COALESCE(
    string_agg(tablename || ' (' || policy_count::text || ' ALL policies)', ', '),
    'none'
  ) AS offending_tables
FROM (
  SELECT tablename, count(*) as policy_count
  FROM pg_policies
  WHERE schemaname = 'public' AND cmd = 'ALL'
  GROUP BY tablename
  HAVING count(*) > 1
) dupes;

-- CHECK 5: ALL policies that allow INSERT must have WITH CHECK
SELECT
  'CHECK 5: ALL/INSERT policies have WITH CHECK' AS check_name,
  CASE
    WHEN count(*) = 0 THEN '✅ PASS'
    ELSE '❌ FAIL — ' || count(*) || ' ALL/INSERT policies missing WITH CHECK'
  END AS result,
  COALESCE(
    string_agg(tablename || '.' || policyname, ', '),
    'none'
  ) AS offending_policies
FROM pg_policies
WHERE schemaname = 'public'
  AND cmd IN ('ALL', 'INSERT')
  AND with_check IS NULL;

-- CHECK 6: profiles table has escalation guard trigger
SELECT
  'CHECK 6: Profile escalation trigger exists' AS check_name,
  CASE
    WHEN count(*) > 0 THEN '✅ PASS'
    ELSE '❌ FAIL — trg_prevent_profile_escalation trigger missing'
  END AS result,
  'n/a' AS offending_policies
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'profiles'
  AND t.tgname = 'trg_prevent_profile_escalation';

-- CHECK 7: private.is_admin() function exists and is SECURITY DEFINER
SELECT
  'CHECK 7: private.is_admin() function exists' AS check_name,
  CASE
    WHEN count(*) > 0 THEN '✅ PASS'
    ELSE '❌ FAIL — private.is_admin() function missing'
  END AS result,
  'n/a' AS offending_policies
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'private'
  AND p.proname = 'is_admin'
  AND p.prosecdef = true;

-- CHECK 8: Expected policy count sanity (should be between 25-50 total)
SELECT
  'CHECK 8: Policy count sanity' AS check_name,
  CASE
    WHEN count(*) BETWEEN 25 AND 60 THEN '✅ PASS (' || count(*) || ' policies)'
    ELSE '⚠️ WARN — unexpected policy count: ' || count(*) || ' (expected 25-60)'
  END AS result,
  'n/a' AS offending_policies
FROM pg_policies
WHERE schemaname = 'public';
