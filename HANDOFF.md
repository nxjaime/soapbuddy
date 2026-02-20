# Sprint 9 Implementation Handoff

**Date:** 2026-02-19
**Status:** Completed
**Model:** Claude Haiku 4.5

---

## What's Complete

✅ **Sprint 9 (Formula Intelligence & UX Polish)**
- **Rebrand**:
    - **Formula Designer**: Calculator renamed to Formula Designer. Route changed from `/calculator` → `/formula-designer` with backward-compat `<Navigate>` redirect. Sidebar label and page title updated.
- **Library**:
    - **Formulations Library**: New `/formulations` page with table view, search, edit, delete. `Load` button navigates to Formula Designer with oils pre-loaded via sessionStorage. `Recipe` button bridges to Recipes page.
- **Features**:
    - **Save/Load Formulas**: Save button in Formula Designer persists current oil ratios (percentages only) as named formulations in Supabase. Load button opens a picker to restore any saved formulation into the designer.
    - **Formula Templates**: Navigating to `/recipes?from_formula=<id>` auto-opens the recipe create modal with oils and name pre-populated from the chosen formulation.
    - **Print Recipe**: Print button on expanded recipe cards serializes the recipe to sessionStorage and opens the existing print view. `PrintRecipe.jsx` now handles dual-mode: recipe-mode (from Recipes) and calculator-mode (from Formula Designer).
- **Verification**: All builds passed (zero errors), 5 sequential feature commits pushed to `main`.

✅ **Sprint 8 (Production Accuracy & Lifecycle)**
- **UX Improvements**:
    - **Complete Batch Modal**: Replaced `prompt()` with proper React modal for yield quantity input (context, validation, loading state).
    - **Interactive Lot Numbers**: Lot numbers in Production table are now clickable links to Traceability with auto-search and auto-expand.
- **Data Integrity**:
    - **Yield Sync**: Completed batches now sync yield quantity to `recipes.stock_quantity` immediately via frontend fallback function.
    - **Traceability Ingredients**: Fixed API query to include nested ingredient joins — batches now show full ingredient details in Traceability.
- **Features**:
    - **Manual Inventory Adjustments**: Added Adjust button to Inventory table items. Modal allows Add/Remove with amount, reason dropdown (6 presets + custom), validates and updates quantities.
- **Verification**: All builds passed (zero errors), 5 sequential commits pushed to `main`.

✅ **Sprint 7 (Stabilization & Labels)**
- **Bug Fixes**:
    - **Plan Tier Reset**: Fixed race condition in `SubscriptionContext` by adding mounted verification and correcting dependency array.
    - **Make Batch UI**: Added loading state and feedback to prevent duplicate submissions.
    - **Sales Orders**: Improved validation logic and added robust error messaging for out-of-stock items.
- **Features**:
    - **Label Creator**: Added `LabelStudio` to Sidebar navigation (gated to Manufacturer tier).
- **Verification**: All builds passed, commits pushed to `main`.

✅ **Sprint 6 (Production Lifecycle)**
- **Core Fixes**: Enabled full Create -> Start -> Cure -> Complete flow.
- **DB/RPC**: Fixed `start_batch` and `complete_batch` logic and schema.
- **Inventory**: validated automatic drawdown matches recipe.

✅ **Sprint 5 (Settings & Data)**
- **Data**: JSONB settings, Import/Export, Business Profile.

---

## Known Issues (To Be Addressed - Sprint 10+)

### 1. Recipes 38-44 Missing Ingredients (Data Issue)
- **Symptoms**: Bulk-created recipes (ID 38-44, e.g., "Hemp & Olive") have 0 ingredients defined.
- **Impact**: Creating batches for these recipes works but triggers no inventory drawdown.
- **Status**: Identified; Sprint 10+ backlog.

### 2. Audit Trail for Adjustments (Enhancement)
- **Symptoms**: Manual inventory adjustments (reason tracked) should be queryable for compliance/traceability.
- **Impact**: Low priority; reasons are captured but not indexed.
- **Status**: Future enhancement for audit schema.

---

## 🚀 Sprint 10 Roadmap (Placeholder)

---

Candidates for next sprint (to be brainstormed):
- Dashboard widgets / quick stats
- Notification system (low stock alerts)
- Batch history timeline view
- Customer portal / order tracking
- Mobile PWA improvements

---

## Codebase Context

**Git root:** `/home/nickj/Documents/Soapmaker_App/SoapManager/`
**Frontend root:** `web/frontend/src/`
**Current Head:** `b57fef9` (Sprint 9: Print recipe cards from Recipes page)

---

## Manual Actions Required

### Run this SQL in Supabase SQL Editor (ezkqfuxzcbtywtfubmon)

```sql
CREATE TABLE IF NOT EXISTS formulations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  oils jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE formulations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own formulations" ON formulations
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

This creates the `formulations` table required by the Formulations Library and Save/Load features.
