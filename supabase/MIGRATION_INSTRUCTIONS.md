# Supabase Migration Instructions

This directory contains SQL migration files that must be manually executed in the Supabase SQL Editor.

## Why Manual Migrations?

Currently, SoapBuddy uses **manual SQL execution** rather than automated migrations. This approach was chosen for rapid prototyping but will be replaced with tracked migrations in **Sprint 15: Migration Automation**.

## How to Execute a Migration

### Step 1: Open Supabase SQL Editor

Navigate to: https://supabase.com/dashboard/project/ezkqfuxzcbtywtfubmon/sql/new

Or:
1. Go to https://supabase.com/dashboard
2. Select project: **ezkqfuxzcbtywtfubmon** (SoapBuddy)
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Copy Migration SQL

Open the migration file you need to run (e.g., `sprint9_formulations.sql`) and copy its entire contents.

### Step 3: Execute

1. Paste the SQL into the editor
2. Click **Run** (or press Ctrl/Cmd + Enter)
3. Verify success message appears

### Step 4: Verify

Run a verification query to confirm the table was created:

```sql
-- For formulations table
SELECT * FROM formulations LIMIT 1;

-- Or check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'formulations'
ORDER BY ordinal_position;
```

## Migration History

| Sprint | File | Status | Description |
|--------|------|--------|-------------|
| Sprint 1 | `sprint1_inventory_intelligence.sql` | ✅ Applied | Stock alerts and inventory thresholds |
| Sprint 2 | `sprint2_molds.sql` | ✅ Applied | Molds table for production tracking |
| Sprint 5 | `sprint5_settings_data.sql` | ✅ Applied | User settings and preferences |
| Sprint 9 | `sprint9_formulations.sql` | ⏳ **PENDING** | Formulations library for Formula Designer |

## Current Pending Migration

### Sprint 9: Formulations Table

**File**: [`sprint9_formulations.sql`](./sprint9_formulations.sql)

**Status**: ⚠️ **NOT YET APPLIED**

**Required for**:
- Formula Designer Save/Load functionality
- Formulations Library page (`/formulations`)
- Recipe template creation from formulas

**To execute**: Follow steps above with `sprint9_formulations.sql`

## Troubleshooting

### Error: "relation already exists"

This means the table was already created. This is safe to ignore if using `CREATE TABLE IF NOT EXISTS`.

### Error: "permission denied"

Make sure you're logged in as the project owner or have admin access to the database.

### Error: "could not find the table"

The table hasn't been created yet. Execute the migration file.

## Future: Automated Migrations (Sprint 15)

Sprint 15 will introduce:
- Supabase CLI integration
- Migration tracking table
- Version control for schema changes
- Automated migration execution in CI/CD
- Rollback procedures
- Schema drift detection

This will eliminate manual execution and prevent schema drift between environments.

---

**Last updated**: 2026-02-21
**Project**: SoapBuddy (ezkqfuxzcbtywtfubmon)
