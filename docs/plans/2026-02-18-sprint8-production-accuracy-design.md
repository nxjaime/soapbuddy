# Sprint 8: Production Accuracy & Lifecycle — Design Document

**Date:** 2026-02-18
**Status:** Design Approved
**Approach:** Sequential fixes targeting production data integrity

---

## Overview

Sprint 8 is a **data integrity and UX stabilization sprint** addressing 5 interconnected issues in the production workflow. The goal is to ensure that yield quantities are correctly captured, inventory stock counts stay synchronized with production completions, and users have mechanisms to correct stock levels when real-world events (wastage, spills, cycle counts) occur.

**Scope:**
1. Replace `prompt()` with proper "Complete Batch" modal (UX)
2. Fix yield quantity sync to recipes.stock_quantity (Data Integrity)
3. Add manual inventory adjustments UI (Feature)
4. Fix "No ingredient data" display in Traceability (Data Integrity)
5. Make lot numbers clickable with navigation to Traceability detail (UX)

**Sequential execution:** Each fix builds on the previous one — the modal ensures correct yield entry, yield sync ensures stock accuracy, manual adjustments provide a correction mechanism, Traceability fix improves visibility, and lot number interactivity ties it together.

---

## Fix #1: Complete Batch Modal

### Problem Statement

When a user selects "Complete" from the batch status dropdown in Production, a native browser `prompt()` appears asking for yield quantity. This is:
- Unstyled and jarring (doesn't match app UI)
- Provides no context (which batch? which recipe?)
- Has poor UX (can't revise input easily)
- Blocks the UI until dismissed

### Solution Design

Add a React modal (`isCompleteModalOpen`, `completingBatch` state) that opens when user selects "Complete" status. Modal displays:

**Modal Structure:**
```
┌─────────────────────────────────────┐
│ Complete Production Batch            │  [X]
├─────────────────────────────────────┤
│                                      │
│ Lot Number: 250050-4921 (monospace)  │
│ Recipe: Lavender & Oatmeal          │
│ Status: Curing → Complete            │
│                                      │
│ Units Produced (Yield)*              │
│ [____________] units                 │
│                                      │
│ Notes (optional)                     │
│ [_____________________________]       │
│ [_____________________________]       │
│                                      │
├─────────────────────────────────────┤
│ [Cancel]    [Complete Batch] (loading state) │
└─────────────────────────────────────┘
```

**Behavior:**
- User selects "Complete" from status dropdown
- Modal opens showing batch context (lot, recipe, current status)
- User enters yield quantity (required) and optional notes
- On submit: disable button, show spinner, call `completeBatch(batchId, yieldQty)`, close modal on success, reload batches
- On cancel: close modal without action

**Files Modified:**
- `web/frontend/src/pages/Production.jsx`

### Testing Checklist
- [ ] Select "Complete" from batch status dropdown
- [ ] Verify modal opens with correct batch context
- [ ] Enter yield quantity and notes
- [ ] Click "Complete Batch" and verify button shows loading state
- [ ] Verify batch status updates to "Complete" after submission
- [ ] Verify modal closes automatically
- [ ] Test with slow network (modal loading state should be visible)

### Success Criteria
✅ Modal replaces `prompt()` entirely
✅ Yield quantity is required, optional notes accepted
✅ Button shows loading state during submit
✅ Modal closes on success, batch list updates
✅ UI matches existing modal patterns (Location, Move to Inventory, Transfer)

---

## Fix #2: Yield Sync to Recipe Stock

### Problem Statement

After completing a batch with yield quantity in the modal, the `recipes.stock_quantity` on the Recipes page doesn't reflect the completed yield. Users see stale stock counts.

**Example:** Complete batch with 10 units yield → Batch shows `yield_quantity: 10` → But Recipes page still shows previous stock count.

### Root Cause Analysis

The `completeBatch()` RPC (in Supabase) may not be updating `recipes.stock_quantity`. The `moveToInventory()` flow (Inventory page) should increment recipe stock, but `completeBatch()` (Production page) may only update the batch record.

### Solution Design

**Step 1: Verify RPC includes stock update**
The Supabase RPC `complete_batch` should include:
```sql
UPDATE recipes
SET stock_quantity = stock_quantity + $qty
WHERE id = (SELECT recipe_id FROM batches WHERE id = $batch_id);
```

**Step 2: Frontend fallback (if DB-side isn't fixed)**
After `completeBatch()` succeeds, if Recipes page doesn't show updated stock, add a client-side update:
```javascript
// In api/client.js
export async function updateRecipeStock(recipeId, quantityDelta) {
  const { data, error } = await supabase
    .from('recipes')
    .update({ stock_quantity: quantityDelta })
    .eq('id', recipeId);
  if (error) throw error;
  return data;
}
```

Call this after `completeBatch()` in Production modal's success handler.

**Step 3: Ensure realtime updates**
If Recipes page uses realtime Supabase subscriptions, stock should update automatically. If not, call `loadRecipes()` after completing batch.

**Files Modified:**
- `web/frontend/src/api/client.js`
- `web/frontend/src/pages/Production.jsx` (completion handler)
- Supabase RPC (verify/fix `complete_batch` if needed — may require SQL migration)

### Testing Checklist
- [ ] Complete a batch with yield qty > 0 in Production modal
- [ ] Navigate to Recipes page
- [ ] Verify recipe stock_quantity increased by yield amount
- [ ] Test with slow network (ensure request completes before leaving page)
- [ ] Complete multiple batches of same recipe, verify cumulative stock increase

### Success Criteria
✅ Batch completion updates recipe stock immediately
✅ Stock updates visible on Recipes page without page refresh
✅ Cumulative batches increase stock correctly
✅ No data loss or double-counting

---

## Fix #3: Manual Inventory Adjustments

### Problem Statement

Inventory levels drift over time due to wastage, spills, damaged goods, or incorrect counts. Users have no way to manually adjust stock levels outside of the production workflow.

### Solution Design

Add an "Adjust" button (pencil icon) to each row in Inventory table. Clicking opens a modal:

**Modal Structure:**
```
┌─────────────────────────────────────┐
│ Adjust Inventory                     │  [X]
├─────────────────────────────────────┤
│                                      │
│ Product: Lavender & Oatmeal          │
│ Location: Main Warehouse             │
│ Current Qty: 47 units                │
│                                      │
│ Adjustment Type                      │
│ [+ Add]    [- Remove]  (toggle)      │
│                                      │
│ Amount                               │
│ [___] units                          │
│                                      │
│ Reason*                              │
│ [____________________________]        │
│ (Damaged, Cycle Count, Wastage, etc) │
│                                      │
├─────────────────────────────────────┤
│ [Cancel]    [Apply Adjustment]       │
└─────────────────────────────────────┘
```

**Behavior:**
- User clicks pencil icon on inventory row
- Modal opens with item context (product, location, current qty)
- User toggles "Add" or "Remove", enters amount, provides reason (required)
- On submit: call `adjustInventoryItem(itemId, delta, reason)`
  - `delta` = amount (positive if Add, negative if Remove)
- API call updates `inventory_items.quantity` and creates audit log entry (if audit table exists)
- On success: close modal, reload inventory

**Backend Support:**
New API function in `api/client.js`:
```javascript
export async function adjustInventoryItem(itemId, quantityDelta, reason) {
  // Either direct update + audit log, or call RPC
  const { data, error } = await supabase
    .from('inventory_items')
    .update({ quantity: quantityDelta })  // May need to fetch current qty first and add delta
    .eq('id', itemId);
  if (error) throw error;
  return data;
}
```

Consider adding an `inventory_adjustments` audit table to track reason, timestamp, user (if multi-user).

**Files Modified:**
- `web/frontend/src/pages/Inventory.jsx`
- `web/frontend/src/api/client.js`
- Supabase schema (add `inventory_adjustments` table for audit)

### Testing Checklist
- [ ] Click "Adjust" button on an inventory item
- [ ] Verify modal opens with correct item context
- [ ] Toggle between "Add" and "Remove"
- [ ] Enter amount and reason
- [ ] Click "Apply Adjustment" and verify item quantity updates
- [ ] Verify reason is recorded (in Supabase)
- [ ] Test edge cases: adjusting to 0, adjusting more than current qty (validation)

### Success Criteria
✅ Adjust button visible on all inventory rows
✅ Modal allows Add/Remove with amount and reason
✅ Adjustment persists to database
✅ Audit trail recorded (reason, timestamp)
✅ Inventory page reflects change immediately

---

## Fix #4: Traceability Ingredient Data

### Problem Statement

When expanding a batch card in Traceability, "No ingredient data available" appears even for batches that have recipes with ingredients defined. The `batch.recipe.ingredients` array is not populated by the API.

### Root Cause Analysis

The `getBatches()` API call in `api/client.js` likely selects batches and joins recipes, but doesn't join `recipe.ingredients` and `ingredients` table. The Supabase query needs to include:
```sql
SELECT *, recipe:recipes(*,ingredients:recipe_ingredients(*, ingredient:ingredients(*)))
```

### Solution Design

**Step 1: Fix API query**
In `api/client.js`, update `getBatches()` Supabase query to include nested ingredient joins:
```javascript
export async function getBatches(filters = {}) {
  let query = supabase
    .from('batches')
    .select(`
      *,
      recipe:recipes(
        *,
        ingredients:recipe_ingredients(
          *,
          ingredient:ingredients(*)
        )
      )
    `);

  // Apply filters...
  const { data, error } = await query;
  if (error) throw error;
  return data;
}
```

**Step 2: Verify on Traceability page**
Once API returns nested ingredients, the existing Traceability JSX code (lines 237-258) should render the table correctly.

**Files Modified:**
- `web/frontend/src/api/client.js`

### Testing Checklist
- [ ] Navigate to Traceability page
- [ ] Expand a completed batch that has a recipe with ingredients
- [ ] Verify "Ingredients Used" table shows all ingredients with qty and unit
- [ ] Verify "No ingredient data available" doesn't appear for batches with recipes
- [ ] Test with batches from recipes 38-44 (currently have 0 ingredients) — should still show "No ingredient data" as expected

### Success Criteria
✅ Ingredients appear in Traceability detail when recipe has ingredients
✅ "No ingredient data available" only shows for recipes with 0 ingredients (as expected)
✅ Ingredient quantities scaled by batch scale_factor correctly
✅ No API errors or missing data

---

## Fix #5: Interactive Lot Numbers

### Problem Statement

Lot numbers in the Production table are plain text. There's no way to quickly navigate to batch details or see traceability info without manually copying the lot number and going to Traceability.

### Solution Design

**Step 1: Make Production lot numbers clickable**
In Production table, wrap lot number in a link:
```javascript
<Link to={`/traceability?lot=${batch.lot_number}`} style={{ cursor: 'pointer', color: 'var(--color-primary)', textDecoration: 'none' }}>
  <strong style={{ fontFamily: 'monospace' }}>{batch.lot_number}</strong>
</Link>
```

**Step 2: Auto-search on Traceability page**
In `Traceability.jsx`, read the `?lot=` query param on mount and auto-populate the search field + expand that batch:
```javascript
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const lotParam = params.get('lot');
  if (lotParam) {
    setSearch(lotParam);
    // Find and expand the batch with this lot number
    const batch = batches.find(b => b.lot_number === lotParam);
    if (batch) setExpandedBatch(batch.id);
  }
}, []);
```

**Files Modified:**
- `web/frontend/src/pages/Production.jsx`
- `web/frontend/src/pages/Traceability.jsx`

### Testing Checklist
- [ ] View Production page, verify lot numbers are underlined/styled as links
- [ ] Click a lot number link
- [ ] Verify navigation to Traceability with ?lot param
- [ ] Verify search field is auto-populated with lot number
- [ ] Verify batch is auto-expanded on page load
- [ ] Test with lot numbers containing special characters (if any)

### Success Criteria
✅ Lot numbers are clickable and styled as links
✅ Clicking lot number navigates to Traceability
✅ Search field auto-populates with lot number
✅ Batch auto-expands on Traceability page load
✅ No broken links or console errors

---

## Execution Plan: Sequential Commits

After each fix is complete and tested locally:

1. **Commit #1:** `feat: replace prompt() with Complete Batch modal`
2. **Commit #2:** `fix: sync completed batch yield to recipe stock`
3. **Commit #3:** `feat: add manual inventory adjustments`
4. **Commit #4:** `fix: populate ingredient data in Traceability`
5. **Commit #5:** `feat: make lot numbers interactive links to Traceability`

**Build verification:** Run `npm run build` after each commit to ensure zero errors.

**Final step:** Push all commits to `main` branch.

---

## Testing Strategy

- **Manual Testing:** Test each fix locally before committing
- **Integration Testing:** After all fixes, do a full production workflow:
  - Create batch → Start → Cure → Complete (with modal) → Check Recipes stock → Move to Inventory → Adjust stock → View in Traceability → Click lot number
- **Edge Cases:** Test with empty/null values, special characters, slow networks

---

## Rollback Plan

If a fix introduces regressions:
1. Revert the specific commit: `git revert <commit-hash>`
2. Diagnose the issue
3. Create a new fix commit
4. Push the revert + new fix

---

## Success Metrics

✅ All 5 fixes implemented and tested
✅ Build passes with zero errors
✅ Each fix has isolated, clear commit message
✅ Manual testing confirms all issues resolved
✅ No regressions in existing features (Dashboard, Recipes, Production, Inventory, Traceability, Sales Orders)
✅ Yield quantities persist correctly through the production lifecycle
✅ Stock counts remain accurate after completions and adjustments
