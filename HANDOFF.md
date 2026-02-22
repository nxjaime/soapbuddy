# SoapBuddy Development Handoff

**Last Updated:** 2026-02-21 (Sprint 13)
**Current Status:** Production hardening phase — Sprint 13 complete (Sprints 14-18 remaining)
**Repo:** https://github.com/nxjaime/soapbuddy (branch: main)

---

## Completed Sprint Summary (1-10)

| Sprint | Focus | Key Deliverables | Commit |
|--------|-------|------------------|--------|
| **1** | Inventory Intelligence | Stock alerts, thresholds, ingredient tracking | `0389a38` |
| **2** | Recipe Power Tools | Molds, batch sizing, variants | `bc0ad41` |
| **3** | Sales & Customer Ops | Orders, customers, tracking | `c4f3ff3` |
| **5** | Settings & Data | User preferences, app config | - |
| **6** | Production Lifecycle | Batch mgmt, workflows, lots | - |
| **7** | Stabilization & Labels | Bug fixes, label maker (Mfr tier) | - |
| **8** | Production Accuracy | Yield sync, inventory adjustments, traceability | `b2ab998` |
| **9** | Formula Intelligence | Formula Designer, formulations library, templates | `ceac9a6` |
| **10** | Admin & Stripe | Admin fix, pricing ($6/$19), checkout repair | `0993297` |
| **11** | Data Fixes | Recipes 38-44 missing ingredients fix | - |
| **12** | Production Blockers | Lint cleanup (25→0 errors), Admin fix, code quality | - |
| **13** | Billing Security | Price allowlist, structured logs, env validation | - |

### Recent Highlights

**Sprint 13** - Server-side Stripe price allowlist on checkout/webhook. Structured JSON billing logs on all 3 edge functions. Frontend env validation. Return URL validation. Deployed checkout (v6) and portal (v5) to Supabase.
**Sprint 12** - Eliminated all 25 ESLint errors (0 errors remaining). Fixed Admin PLANS/allPlans mismatch, Traceability hooks violation, unreachable code in client.js. Extracted PLANS to constants/plans.js. Cleaned unused vars across 11 files.
**Sprint 11** - Fixed recipes 38-44 missing ingredients data issue
**Sprint 10** - Fixed Admin page `TIER_FEATURES` error, updated Stripe pricing (Maker $6/mo, Mfr $19/mo), repaired checkout JWT issues
**Sprint 9** - Rebranded Calculator → Formula Designer, built formulations library with save/load, added recipe templates

---

## Known Issues (To Be Addressed - Sprint 11+)

### ✅ Sprint 11. Recipes 38-44 Missing Ingredients (Data Issue)
- **Symptoms**: Bulk-created recipes (ID 38-44, e.g., "Hemp & Olive") have 0 ingredients defined.
- **Impact**: Creating batches for these recipes works but triggers no inventory drawdown.
- **Status**: Resolved (2026-02-21); Missing ingredients were successfully inserted into the `recipe_ingredients` table.

---

## 🚀 Approved Roadmap: Sprint 12-18

### ✅ Sprint 12: Production Blockers (Completed 2026-02-21)
- ✅ Fixed Admin `PLANS`/`allPlans` mismatch.
- ✅ Resolved all lint errors (25 → 0 errors, 7 warnings remain as intentional `exhaustive-deps`).
- ✅ Fixed React rules-of-hooks violation in `Traceability.jsx`.
- ✅ Fixed unreachable code bug in `getDashboardStats` (customer/sales/supply counts now fetched).
- ✅ Extracted `PLANS`/`TIER_LEVELS` to `src/constants/plans.js` for clean separation.
- ✅ Updated ESLint config with `argsIgnorePattern` and context file overrides.
- ⬚ Environment validation for Supabase/Stripe (deferred to Sprint 13+).
- ⬚ Smoke E2E ship gate (deferred to Sprint 17-18).

### ✅ Sprint 13: Billing Security Hardening (Completed 2026-02-21)
- ✅ Server-side Stripe price allowlist (`ALLOWED_STRIPE_PRICE_IDS` env var).
- ✅ Reject tampered/invalid client price IDs with 403 + structured error log.
- ✅ Structured JSON billing logs on all 3 edge functions (checkout, portal, webhook).
- ✅ Environment validation (fail-fast for missing secrets).
- ✅ Return URL validation (prevent open redirects via `ALLOWED_ORIGINS`).
- ✅ Frontend env validation (`src/lib/validateEnv.js`) with fail-fast for Supabase, warnings for Stripe.
- ✅ Proper HTTP status codes (401/403/400/500 instead of generic 400).
- ⬚ Negative billing-path tests (deferred to Sprint 16/17).
- ⬚ Webhook deploy failed (Supabase internal error — retry needed).

### Sprint 14: Database Safety Baseline
- Remove permissive RLS from canonical provisioning path.
- Align `supabase-schema.sql` with secure migrations.
- Add explicit `profiles`/admin access policies.
- Add policy verification script for release checks.

### Sprint 15: Migration Automation
- Convert manual SQL steps into tracked migrations.
- Add migration ordering/version checks.
- Add rollback and dry-run procedures.
- Add schema drift CI checks.

### Sprint 16: Authorization & Multi-Tenant Test Layer
- Add integration tests for tenant isolation.
- Add admin authorization tests.
- Add edge-function auth tests (checkout/portal).
- Add RLS regression tests.

### Sprint 17: Core Business Flow E2E Expansion
- Add E2E coverage for auth flows.
- Add E2E coverage for recipes → production → inventory deduction.
- Add E2E coverage for traceability and formulations flows.
- Add E2E coverage for billing success/failure/cancel/portal paths.

### Sprint 18: Release Engineering & Ship Readiness
- Enforce mandatory CI gates (`lint`, `build`, integration, E2E).
- Add release checklist (schema/function/env/rollback).
- Define staging promotion criteria and signoff rubric.
- Capture residual risk register and formal go/no-go process.

---

## Sprint Templates (12-18)

### ✅ Sprint 12 Template: Production Blockers — COMPLETED (2026-02-21)
- Goal: Restore baseline runtime reliability and remove immediate release blockers.
- **Result**: All lint errors eliminated. Build passes. Admin page functional.
- Files modified (12):
  - `src/pages/Admin.jsx` — Fixed PLANS/allPlans destructuring
  - `src/pages/Traceability.jsx` — Fixed rules-of-hooks violation
  - `src/pages/LandingPage.jsx` — Removed unused imports
  - `src/pages/Recipes.jsx` — Removed unused imports and dead code
  - `src/pages/Financials.jsx` — Removed unused variable
  - `src/pages/FormulaDesigner.jsx` — Removed unused state
  - `src/pages/PrintRecipe.jsx` — Replaced effect with lazy init
  - `src/contexts/SubscriptionContext.jsx` — Extracted constants, prefixed unused vars
  - `src/contexts/SettingsContext.jsx` — Moved pure function outside component
  - `src/components/BarcodeScanner.jsx` — Removed unused ref/param
  - `src/components/ErrorBoundary.jsx` — Prefixed unused param
  - `src/components/TierGate.jsx` — Removed unused destructuring
- Files created (1):
  - `src/constants/plans.js` — Extracted PLANS and TIER_LEVELS constants
- Config updated (1):
  - `eslint.config.js` — Added argsIgnorePattern, context file overrides

### ✅ Sprint 13 Template: Billing Security Hardening — COMPLETED (2026-02-21)
- Goal: Prevent billing tampering and harden checkout/portal boundaries.
- **Result**: Price allowlist enforced. All billing events logged with structured JSON. Frontend env validated.
- Edge functions hardened (3):
  - `create-checkout-session` (v6) — Price allowlist, auth validation, return URL check, structured logs
  - `create-portal-session` (v5) — Auth validation, return URL check, structured logs
  - `stripe-webhook` — Price cross-check, structured logs, env validation (deploy pending retry)
- Files created (1):
  - `src/lib/validateEnv.js` — Frontend fail-fast env validation
- Files modified (1):
  - `src/main.jsx` — Wired up env validation at app startup
- **Required manual action:** Set these Supabase Edge Function secrets:
  - `ALLOWED_STRIPE_PRICE_IDS=price_1T2jhDDxejSNZlGtTxufxQjX,price_1T2jtkDxejSNZlGtBtiZVLG1`
  - `ALLOWED_ORIGINS=https://soapbuddy.co,https://soap-buddy.vercel.app` (optional)

### Sprint 14 Template: Database Safety Baseline
- Goal: Ensure live schema provisioning cannot create permissive tenant access.
- Scope:
  - Align `supabase-schema.sql` and secure migration posture.
  - Add/verify `profiles` and admin-related RLS policies.
  - Add SQL policy verification script.
  - Document canonical schema application path.
- Out of scope: CI migration orchestration.
- Acceptance criteria:
  - No permissive `USING (true)` policies remain in production path.
  - Profiles/admin access follows explicit least privilege.
  - Verification script fails on policy drift.
- Evidence required:
  - Policy dump before/after.
  - Verification script output from staging.
- Exit gate: DB security checklist approved.

### Sprint 15 Template: Migration Automation
- Goal: Eliminate manual SQL execution risk and enforce deterministic DB changes.
- Scope:
  - Convert manual SQL to tracked migrations.
  - Add migration order/version checks.
  - Add rollback and dry-run procedure.
  - Add schema drift CI checks.
- Out of scope: Net-new features.
- Acceptance criteria:
  - Fresh environment provisions from migrations only.
  - Drift check fails when schema diverges.
  - Rollback procedure tested in staging.
- Evidence required:
  - Provisioning log from empty DB.
  - Drift-check CI run.
  - Rollback test record.
- Exit gate: "No manual SQL in release process" policy in effect.

### Sprint 16 Template: Authorization & Multi-Tenant Test Layer
- Goal: Prove access controls and tenant isolation with automated tests.
- Scope:
  - Integration tests for cross-tenant isolation.
  - Admin authorization tests for profile tier management.
  - Edge-function auth tests.
  - Policy regression tests.
- Out of scope: Broad UI E2E expansion.
- Acceptance criteria:
  - Unauthorized cross-tenant access is blocked and verified by tests.
  - Admin/non-admin behavior is deterministic and tested.
  - Edge functions reject missing/invalid auth.
- Evidence required:
  - Test report matrix by role and tenant.
- Exit gate: Auth/tenant test suite required in CI.

### Sprint 17 Template: Core Business Flow E2E Expansion
- Goal: Validate mission-critical workflows end-to-end before release.
- Scope:
  - Auth flows.
  - Recipes → Production → Inventory deduction.
  - Traceability and formulations flows.
  - Billing happy/failure/cancel/portal flows.
- Out of scope: Major architecture refactors.
- Acceptance criteria:
  - Critical workflows have stable, repeatable E2E tests.
  - Flake rate below agreed threshold.
  - Seeded data strategy supports deterministic runs.
- Evidence required:
  - Playwright report artifacts for critical workflows.
- Exit gate: Critical-path E2E suite required on release branch.

### Sprint 18 Template: Release Engineering & Ship Readiness
- Goal: Make "shippable" objective via enforceable release controls.
- Scope:
  - Mandatory CI gates (`lint`, `build`, integration, E2E).
  - Release checklist (schema version, function version, env validation, rollback).
  - Staging promotion criteria and signoff rubric.
  - Residual risk register and go/no-go process.
- Out of scope: Net-new feature work.
- Acceptance criteria:
  - Release cannot proceed if any gate fails.
  - Checklist completed and signed per release.
  - Go/no-go decision includes traceable evidence.
- Evidence required:
  - Release checklist artifact.
  - Final CI pipeline report.
  - Signed go/no-go record.
- Exit gate: First production release completed under new process without emergency rollback.

---

## Codebase Context

**Git root:** `/home/nickj/Documents/Soapmaker_App/SoapManager/`
**Frontend root:** `web/frontend/src/`
**Stack:** React 19 + Vite + Supabase (PostgreSQL) + Stripe
**Deployment:** Vercel (frontend) + Supabase (backend)
**Current Head:** See latest commit (Sprint 12 lint cleanup + Admin fix)

---

## Manual Actions Required

### ✅ Sprint 9 Formulations Table - COMPLETED (2026-02-21)

**Migration file**: `supabase/sprint9_formulations.sql`
**Status**: Applied to production database
**Verified**: Table exists and RLS policy is active

The `formulations` table is now ready for use by:
- Formula Designer Save/Load functionality
- Formulations Library page (`/formulations`)
- Recipe template creation from saved formulas

---

### Migration Instructions

For future migrations, see: `supabase/MIGRATION_INSTRUCTIONS.md`
