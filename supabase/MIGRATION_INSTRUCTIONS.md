# Supabase Migration Workflow

**Last Updated:** 2026-02-21 (Sprint 15)
**Project:** SoapBuddy (`ezkqfuxzcbtywtfubmon`)

---

## Current Process

All schema changes are applied as **tracked migrations** via the Supabase MCP tool:

```
mcp_supabase-mcp-server_apply_migration(
  project_id: "ezkqfuxzcbtywtfubmon",
  name: "descriptive_snake_case_name",
  query: "-- SQL here"
)
```

This automatically:
- Records the migration in `supabase_migrations.schema_migrations`
- Assigns a timestamp-based version number
- Makes the change auditable and reproducible

---

## Migration Rules

1. **All DDL goes through `apply_migration`** — never use `execute_sql` for schema changes
2. **Use `execute_sql` only for DML** — data queries, inserts, updates
3. **Name migrations descriptively** — `sprint15_add_user_preferences`, not `fix_stuff`
4. **One concern per migration** — don't bundle unrelated changes
5. **Always use `IF NOT EXISTS` / `IF EXISTS`** — make migrations idempotent where possible
6. **Update `supabase-schema.sql`** after any migration — keep the canonical snapshot current

---

## Pre-Migration Checklist

Before applying a migration:

- [ ] Write the SQL and review it
- [ ] Confirm it's idempotent (safe to re-run)
- [ ] Identify rollback SQL (see `ROLLBACK_GUIDE.md`)
- [ ] Apply via `apply_migration`
- [ ] Run `schema_drift_check.sql` to verify
- [ ] Run `verify_rls_policies.sql` if RLS was touched
- [ ] Update `supabase-schema.sql` to match

---

## Verification Scripts

| Script | Purpose | When to Run |
|--------|---------|-------------|
| `verify_rls_policies.sql` | 8 RLS security checks | After any RLS/policy change |
| `schema_drift_check.sql` | 10 schema integrity checks | After any migration, before deploy |

---

## Migration History

20 migrations applied as of Sprint 15. View current state:

```sql
SELECT version, name FROM supabase_migrations.schema_migrations ORDER BY version;
```

---

## Reference Files

| File | Purpose |
|------|---------|
| `supabase-schema.sql` | Canonical schema snapshot (source of truth) |
| `supabase/schema_drift_check.sql` | Schema drift detection (10 checks) |
| `supabase/verify_rls_policies.sql` | RLS policy verification (8 checks) |
| `supabase/ROLLBACK_GUIDE.md` | Rollback procedures and patterns |
| `supabase/MIGRATION_INSTRUCTIONS.md` | This file |

---

## Legacy Sprint SQL Files

The following files in `supabase/` are **historical records** of migrations that have already been applied. They should not be re-executed:

| File | Status |
|------|--------|
| `sprint1_inventory_intelligence.sql` | ✅ Applied |
| `sprint2_molds.sql` | ✅ Applied |
| `sprint5_settings_data.sql` | ✅ Applied |
| `sprint9_formulations.sql` | ✅ Applied |
| `sprint14_rls_hardening.sql` | ✅ Applied |
