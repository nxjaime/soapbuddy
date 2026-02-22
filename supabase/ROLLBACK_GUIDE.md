# Supabase Rollback Guide

**Last Updated:** 2026-02-21 (Sprint 15)
**Project:** SoapBuddy (`ezkqfuxzcbtywtfubmon`)

---

## Overview

This document covers how to roll back database changes when a migration causes issues. Since SoapBuddy uses Supabase's managed migration system, rollbacks require manual SQL execution.

---

## Rollback Strategies

### Strategy 1: Reverse Migration (Preferred)

Write a new migration that undoes the changes. This is the safest approach because it's tracked and auditable.

**Example — rolling back "add column":**
```sql
-- Forward migration: added a column
ALTER TABLE ingredients ADD COLUMN barcode VARCHAR;

-- Reverse migration: drop that column
ALTER TABLE ingredients DROP COLUMN IF EXISTS barcode;
```

**How to apply:**
```
mcp_supabase-mcp-server_apply_migration(
  project_id: "ezkqfuxzcbtywtfubmon",
  name: "rollback_barcode_column",
  query: "ALTER TABLE ingredients DROP COLUMN IF EXISTS barcode;"
)
```

### Strategy 2: Point-in-Time Recovery (PITR)

Supabase Pro plans support PITR. This restores the **entire database** to a specific timestamp.

> ⚠️ **WARNING**: PITR is a full database restore. All changes after the restore point are lost — including user data, signups, and non-schema changes.

**When to use:** Catastrophic migration failures that corrupt data across multiple tables.

**How:** Supabase Dashboard → Database → Backups → Point in Time Recovery

### Strategy 3: Schema Snapshot Restore

Use the canonical `supabase-schema.sql` to rebuild from scratch on a fresh project or branch.

**When to use:** Development/staging recovery, not production.

---

## Rollback Checklist

Before rolling back, verify:

- [ ] **Identify the migration** — which migration version caused the issue?
- [ ] **Check data impact** — will the rollback lose user data?
- [ ] **Write the reverse SQL** — prepare the undo migration
- [ ] **Test on branch** (if available) — apply the rollback on a dev branch first
- [ ] **Apply to production** — run via `apply_migration`
- [ ] **Run drift check** — execute `supabase/schema_drift_check.sql`
- [ ] **Run RLS verification** — execute `supabase/verify_rls_policies.sql`
- [ ] **Test the application** — verify frontend still works

---

## Common Rollback Patterns

### Drop a table
```sql
DROP TABLE IF EXISTS my_new_table CASCADE;
```

### Drop a column
```sql
ALTER TABLE my_table DROP COLUMN IF EXISTS my_column;
```

### Remove a policy
```sql
DROP POLICY IF EXISTS "policy_name" ON my_table;
```

### Remove a function
```sql
DROP FUNCTION IF EXISTS my_function(arg_types);
```

### Remove a trigger
```sql
DROP TRIGGER IF EXISTS my_trigger ON my_table;
```

### Restore a dropped column (with data loss)
```sql
ALTER TABLE my_table ADD COLUMN my_column TEXT DEFAULT NULL;
-- Note: original data is NOT recoverable without backup
```

---

## Migration History Reference

View all applied migrations:
```sql
SELECT version, name, statements_applied_at
FROM supabase_migrations.schema_migrations
ORDER BY version DESC;
```

Check the last 5 migrations:
```sql
SELECT version, name
FROM supabase_migrations.schema_migrations
ORDER BY version DESC
LIMIT 5;
```

---

## Emergency Contacts

- **Supabase Dashboard:** https://supabase.com/dashboard/project/ezkqfuxzcbtywtfubmon
- **Supabase Support:** https://supabase.com/support
- **Project repo:** https://github.com/nxjaime/soapbuddy

---

## Post-Rollback Verification

After any rollback, always run:

1. **Schema drift check:** `supabase/schema_drift_check.sql`
2. **RLS verification:** `supabase/verify_rls_policies.sql`
3. **Application smoke test:** Log in, create a recipe, view dashboard
4. **Update canonical schema** if the rollback changes the schema baseline
