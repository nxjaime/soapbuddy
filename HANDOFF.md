# SoapBuddy Development Handoff

**Last Updated:** 2026-02-21
**Current Status:** Feature development complete (Sprints 1-10) → Production hardening phase (Sprints 12-18)
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

### Recent Highlights

**Sprint 10** - Fixed Admin page `TIER_FEATURES` error, updated Stripe pricing (Maker $6/mo, Mfr $19/mo), repaired checkout JWT issues
**Sprint 9** - Rebranded Calculator → Formula Designer, built formulations library with save/load, added recipe templates
**Sprint 8** - Batch completion modal, clickable lot numbers, yield quantity sync, manual inventory adjustments

---

## Known Issues (To Be Addressed - Sprint 11+)

### ✅ Sprint 11. Recipes 38-44 Missing Ingredients (Data Issue)
- **Symptoms**: Bulk-created recipes (ID 38-44, e.g., "Hemp & Olive") have 0 ingredients defined.
- **Impact**: Creating batches for these recipes works but triggers no inventory drawdown.
- **Status**: Resolved (2026-02-21); Missing ingredients were successfully inserted into the `recipe_ingredients` table.

---

## 🚀 Approved Roadmap: Sprint 12-18

### Sprint 12: Production Blockers
- Fix Admin `PLANS`/`allPlans` mismatch.
- Resolve lint/build blockers.
- Add fail-fast environment validation for Supabase/Stripe.
- Enforce minimum ship gate (`lint`, `build`, smoke E2E).

### Sprint 13: Billing Security Hardening
- Enforce server-side Stripe price allowlist.
- Reject tampered/invalid client price IDs.
- Add negative billing-path tests.
- Add billing logs/metrics for failure triage.

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

### Sprint 12 Template: Production Blockers
- Goal: Restore baseline runtime reliability and remove immediate release blockers.
- Scope:
  - Fix Admin `PLANS`/`allPlans` mismatch.
  - Resolve lint/build blockers.
  - Add fail-fast env validation for Supabase/Stripe.
  - Define and run minimum ship gate.
- Out of scope: Billing hardening, RLS redesign, migration automation.
- Acceptance criteria:
  - Admin page loads for admin users without runtime errors.
  - `lint` and `build` pass in CI.
  - Missing envs show controlled, actionable error state.
  - Smoke E2E suite passes in CI.
- Evidence required:
  - CI links for lint/build/smoke.
  - Screenshot/video of Admin page and env-failure state.
- Exit gate: No P0/P1 runtime blockers open.

### Sprint 13 Template: Billing Security Hardening
- Goal: Prevent billing tampering and harden checkout/portal boundaries.
- Scope:
  - Server-side allowlist of Stripe Price IDs.
  - Reject unknown/invalid price requests.
  - Add negative-path tests for tampering.
  - Add structured logs/alerts for billing failures.
- Out of scope: Full DB/RLS baseline cleanup.
- Acceptance criteria:
  - Unauthorized price IDs are rejected.
  - Valid plans still complete checkout flow.
  - Billing failures are traceable via logs.
- Evidence required:
  - Test outputs for valid/invalid price scenarios.
  - Log samples for success/failure paths.
- Exit gate: Security signoff on checkout/portal functions.

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
**Current Head:** `876edab` (Sprint 9 formulations migration + HANDOFF documentation)

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
