# EXECUTION JOURNAL: SOAPBUDDY_AUTONOMOUS_REMEDIATION

## 2026-02-07T20:30:00-06:00 - Initialization
- Started the SoapBuddy Autonomous Remediation mission.
- Created `EXECUTION_JOURNAL.md` to maintain a persistent history of changes.
- Initial project structure exploration completed.

## 2026-02-15 - SoapBuddy SaaS v1.0 Implementation

### MILESTONE 1: Physics Squad (all tasks complete)

**Task 1.1 — Unit Conversion in `receive_supply_order()`**
- Applied migration `physics_unit_conversion_fifo_batch_timing`
- Created `convert_weight(quantity, from_unit, to_unit)` IMMUTABLE helper (g/kg/oz/lb ↔ g)
- Added `quantity_base_unit` column to `supply_order_items` for audit trail
- Updated `receive_supply_order()` to call `convert_weight()` before adding to `quantity_on_hand`
- WAC (Weighted Average Cost) now calculated on converted base-unit quantities

**Task 1.2 — FIFO Costing**
- Added `supply_order_item_id` FK to `batch_ingredient_usage`
- Created `allocate_batch_ingredients(p_batch_id)` — walks FIFO lots by `order_date ASC`, assigns cost per base-unit gram

**Task 1.3 — Inventory Deduction Timing**
- Split `finalize_batch()` into two RPCs:
  - `start_batch(p_batch_id)` — deducts ingredients, populates `batch_ingredient_usage` from recipe, runs FIFO allocation, sets status = "In Progress"
  - `complete_batch(p_batch_id, p_yield_quantity)` — adds yield to `recipes.stock_quantity`, sets status = "Complete"
- Updated `Production.jsx` to call `startBatch` / `completeBatch` RPCs
- Added `startBatch()` and `completeBatch()` to `api/client.js`

### MILESTONE 2: Revenue & Access Squad (all tasks complete)

**Task 2.1 — 14-Day Trial**
- Added `subscription_data: { trial_period_days: 14 }` to `create-checkout-session` edge function
- Deployed updated function (version 2)

**Task 2.2 — Tier Enforcement**
- Added 5 new feature flags to PLANS in `SubscriptionContext.jsx`: `production`, `inventory`, `supplyChain`, `salesTracking`, `labelCreator`
- Updated `Layout.jsx` to add `featureId` for all locked nav items (Production, Inventory, Suppliers, Supply Orders, Customers, Sales Orders, Expenses)
- Created `TierGate.jsx` component — shows upgrade prompt if user navigates directly to locked route via URL
- Wrapped all protected routes in `App.jsx` with `<TierGate featureId="...">`

**Task 2.3 — Server-side Recipe Limit**
- Applied migration `recipe_limit_trigger`
- Created `check_recipe_limit()` trigger function (BEFORE INSERT on `recipes`)
- Free tier capped at 3 recipes; enforced at DB level regardless of client

### MILESTONE 3: Label Creator (complete)

**Task 3.1 — Label Studio UI**
- Installed `html2canvas` dependency
- Created `LabelStudio.jsx` — full label editor with INCI-sorted ingredient list, editable fields (product name, tagline, net weight, warnings, business name), logo upload, live preview, and PNG export
- Added "Create Label" (Tag icon) button to each recipe card in `Recipes.jsx`, gated behind `meetsMinTier('manufacturer')`

### MILESTONE 4: Onboarding Squad (all tasks complete)

**Task 4.1 — Welcome Wizard**
- Created `WelcomeWizard.jsx` — 3-step onboarding wizard (business name → import oils → create recipe)
- Wizard state tracked in `localStorage` (`soapbuddy_wizard_complete`)
- Dashboard detects zero recipes after load and shows the wizard automatically

**Task 4.2 — Quick Import from Master Oil Library**
- Added `bulkImportOils(oils)` to `api/client.js`
- Inserts ingredients + fatty acid profiles; skips duplicates by name
- Wired into WelcomeWizard Step 2

**Task 4.3 — Legacy SQLite Migration Script**
- Created `scripts/migrate-legacy.js` (Node.js, requires `better-sqlite3`)
- Migrates `ingredients`, `recipes`, `recipe_ingredients` with ID remapping
- Maps `actual_quantity` → `quantity_used`, injects `user_id`
- `scripts/package.json` with `better-sqlite3` dev dep + `@supabase/supabase-js`

### Build Status
- `npm run build` — ✅ zero errors (5.26s)

---

## 2026-02-07T20:45:00-06:00 - Phase 1: Security Lockdown
- Modified `MIGRATION_GUIDE.md` to remove hardcoded Supabase URL and Anon Key, replacing them with secure placeholders.
- Updated `supabase-schema.sql` to revoke "Allow all for anon" policies and implement "Authenticated users only" policies for all 13 tables (ingredients, recipes, etc.).
- Note: Actual rotation of `VITE_SUPABASE_ANON_KEY` and `SERVICE_ROLE_KEY` in the Supabase Dashboard is pending verification of dashboard access credentials.

## 2026-02-07T21:00:00-06:00 - Phase 2: Business Logic Migration (Python -> JS/SQL)
- Ported Soap Math:
    - Created `web/frontend/src/utils/soapCalculator.js` with Summation formulas for Hardness, Cleansing, Conditioning, Bubbly, and Creamy.
    - Verified logic matches original Python `SoapCalculator` class.
- Ported Inventory Deduction:
    - Updated `supabase-schema.sql` to include `planned_quantity` in `batch_ingredient_usage`.
    - Created PostgreSQL RPC `finalize_batch(p_batch_id)` which:
        1. Deducts ingredients from `ingredients.quantity_on_hand`.
        2. Adds `yield_quantity` to `recipes.stock_quantity`.
        3. Marks the batch as 'Complete'.
- Backup Integrity:
    - Renamed and moved legacy files:
        - `src/services/soap_calculator.py` -> `src/services/soap_calculator_2026-02-07T20_30_00_backup.py`
        - `src/main.py` -> `src/main_2026-02-07T20_30_00_backup.py`
        - `web/backend/main.py` -> `web/backend/main_2026-02-07T20_30_00_backup.py`
    - Created `_legacy_2026-02-07T20:30:00` directory for future archival.

## 2026-02-07T21:15:00-06:00 - Phase 3: Data Integrity Repair
- Fixed "Latest Cost" Flaw:
    - Implemented Weighted Average Cost (WAC) logic in a new PostgreSQL RPC `receive_supply_order(p_order_id)`.
    - Formula used: `New WAC = (Current Qty * Current Cost + New Total Cost) / (Current Qty + New Qty)`.
    - Note: Formula uses `GREATEST(current_qty, 0)` to prevent negative inventory from distorting costs.
- Updated `web/frontend/src/api/supabase-client.js`:
    - Integrated `receive_supply_order` RPC into the `createSupplyOrder` flow.
    - Updated `updateBatch` to use the comprehensive `finalize_batch` RPC instead of simple stock increment.

## 2026-02-07T21:30:00-06:00 - Phase 4: Cleanup & Archival
- Eliminated "Split-Brain" state by moving all legacy Python code, SQLite databases, and build scripts into `_legacy_2026-02-07T20:30:00/`.
- Updated `README.md` to reflect the new serverless architecture, Supabase integration, and repository structure.
- Verified root directory cleanliness: only essential web frontend, configuration, and schema files remain.
- **Final Verification (2026-02-07T22:00:00-06:00)**:
    - Successfully synced `supabase-schema.sql` with the live Supabase project `ezkqfuxzcbtywtfubmon`.
    - Verified all 13 tables are under RLS control with "Authenticated users only" policies.
    - Confirmed functions `finalize_batch` and `receive_supply_order` are active in the database.
    - Verified Vercel deployment is live and correctly configured with environment variables.
- Mission Accomplished.

## 2026-02-15T07:10:00-06:00 - SaaS Transformation: Multi-tenancy & Feature Gating
- Goal: Transform SoapBuddy into a multi-tenant SaaS with a 3-tier subscription model.
- Database Security (RLS 2.0):
    - Implemented strict per-user isolation using `USING (auth.uid() = user_id)` for all data tables.
    - Added `user_id` columns to ingredients, recipes, production_batches, etc.
    - Created `profiles` table to manage user plan tiers (free, maker, manufacturer).
- Business Logic:
    - Added trigger `handle_new_user()` on `auth.users` creation to auto-create profiles and seed 149 base oils.
    - Added trigger `check_recipe_limit()` to enforce Free tier limits (max 3 recipes).
- Frontend - Subscription Support:
    - Created `SubscriptionContext.jsx` with `hasFeature()` and `meetsMinTier()` helpers.
    - Modified `client.js` to inject `user_id` into all insert operations.
- Feature Gating:
    - `Traceability.jsx`: Full gate (Manufacturer tier only).
    - `Financials.jsx`: Visual blur on Net Profit and Pending Revenue for Free tier.
    - `Inventory.jsx`: Disabled Transfer functionality for Free tier.
- Calculator Porting:
    - Created `soapMath.js` to fetch fatty acid profiles and compute qualities client-side.
    - Integrated real-time quality estimates into `Recipes.jsx` modal.
- Verification: Successful Vite production build (2541 modules).
