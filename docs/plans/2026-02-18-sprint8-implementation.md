# Sprint 8: Production Accuracy & Lifecycle — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 5 interconnected production workflow issues to ensure yield quantities are captured correctly, stock stays synchronized, and users can adjust inventory when real-world events occur.

**Architecture:** Sequential implementation of modal UI → data sync → manual adjustments → data visibility → navigation. Each task is isolated and can be tested independently before moving to the next.

**Tech Stack:** React, Lucide React (icons), Supabase (RPC, realtime), CSS Grid/Flexbox for modals

---

## Task 1: Complete Batch Modal (Replace prompt())

**Files:**
- Modify: `web/frontend/src/pages/Production.jsx:157-186` (handleStatusChange + render)

**Context:**
The current Production page uses `prompt()` on line 167 when user selects "Complete" status. We'll replace this with a proper React modal that matches existing modal patterns (see Location modal at line 412-509, Move to Inventory modal at line 565-645).

**Step 1: Add state for Complete modal**

In `Production.jsx`, add to state declarations (after line 29, next to existing `isModalOpen`):
```javascript
const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
const [completingBatch, setCompletingBatch] = useState(null);
const [completeFormData, setCompleteFormData] = useState({
    yield_quantity: 0,
    notes: ''
});
const [isSubmittingComplete, setIsSubmittingComplete] = useState(false);
```

**Step 2: Modify handleStatusChange to open modal instead of prompt**

Replace lines 166-173 (the "Complete" branch) with:
```javascript
} else if (newStatus === 'Complete') {
    // Open modal instead of using prompt()
    const batch = batches.find(b => b.id === batchId);
    setCompletingBatch(batch);
    setCompleteFormData({ yield_quantity: batch.yield_quantity || 0, notes: '' });
    setIsCompleteModalOpen(true);
    setUpdatingId(null);
    return;
}
```

**Step 3: Add modal handler functions**

Add after `handleStatusChange` function (before line 187):
```javascript
async function handleCompleteSubmit(e) {
    e.preventDefault();
    if (!completingBatch) return;

    try {
        setIsSubmittingComplete(true);
        const yieldQty = parseInt(completeFormData.yield_quantity) || 0;
        if (yieldQty <= 0) {
            alert('Please enter a valid yield quantity (greater than 0)');
            setIsSubmittingComplete(false);
            return;
        }

        await completeBatch(completingBatch.id, yieldQty);

        setIsCompleteModalOpen(false);
        setCompletingBatch(null);
        setCompleteFormData({ yield_quantity: 0, notes: '' });
        await loadBatches();
    } catch (err) {
        console.error('Failed to complete batch:', err);
        alert('Failed to complete batch: ' + err.message);
    } finally {
        setIsSubmittingComplete(false);
    }
}

function closeCompleteModal() {
    setIsCompleteModalOpen(false);
    setCompletingBatch(null);
    setCompleteFormData({ yield_quantity: 0, notes: '' });
}
```

**Step 4: Add modal JSX**

Add before closing `</div>` of main return (after line 509, before closing brace):
```javascript
{/* Complete Batch Modal */}
{isCompleteModalOpen && completingBatch && (
    <div className="modal-overlay" onClick={closeCompleteModal}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
                <h2 className="modal-title">Complete Production Batch</h2>
                <button className="btn-icon" onClick={closeCompleteModal}>
                    <X size={20} />
                </button>
            </div>
            <form onSubmit={handleCompleteSubmit}>
                <div className="modal-body">
                    {/* Batch Context */}
                    <div style={{
                        background: 'var(--glass-bg)',
                        padding: 'var(--spacing-md)',
                        borderRadius: 'var(--radius-sm)',
                        marginBottom: 'var(--spacing-lg)',
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 'var(--spacing-md)'
                    }}>
                        <div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Lot Number</div>
                            <div style={{ fontFamily: 'monospace', fontWeight: 600, marginTop: '4px' }}>
                                {completingBatch.lot_number}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Recipe</div>
                            <div style={{ fontWeight: 500, marginTop: '4px' }}>
                                {getRecipeName(completingBatch.recipe_id)}
                            </div>
                        </div>
                    </div>

                    {/* Yield Input */}
                    <div className="form-group">
                        <label className="form-label">Units Produced (Yield) *</label>
                        <input
                            type="number"
                            className="form-input"
                            value={completeFormData.yield_quantity}
                            onChange={(e) => setCompleteFormData(prev => ({
                                ...prev,
                                yield_quantity: e.target.value
                            }))}
                            min="0"
                            step="1"
                            required
                            placeholder="e.g., 48"
                        />
                    </div>

                    {/* Notes */}
                    <div className="form-group">
                        <label className="form-label">Notes (optional)</label>
                        <textarea
                            className="form-input"
                            value={completeFormData.notes}
                            onChange={(e) => setCompleteFormData(prev => ({
                                ...prev,
                                notes: e.target.value
                            }))}
                            rows="3"
                            placeholder="e.g., Higher yield due to precise measurements"
                        />
                    </div>
                </div>
                <div className="modal-footer">
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={closeCompleteModal}
                        disabled={isSubmittingComplete}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isSubmittingComplete}
                        style={{ opacity: isSubmittingComplete ? 0.6 : 1 }}
                    >
                        {isSubmittingComplete ? (
                            <>
                                <div className="inline-block w-4 h-4 border-2 border-current border-r-transparent rounded-full animate-spin mr-2" />
                                Completing...
                            </>
                        ) : (
                            'Complete Batch'
                        )}
                    </button>
                </div>
            </form>
        </div>
    </div>
)}
```

**Step 5: Build and test locally**

Run:
```bash
cd web/frontend && npm run build
```

Expected: Zero errors, bundle size similar to before.

**Step 6: Manual test**

1. Navigate to Production page
2. Click status dropdown on any batch in "Curing" state
3. Select "Complete"
4. Verify modal opens with correct lot number and recipe
5. Enter yield quantity (e.g., 48)
6. Click "Complete Batch"
7. Verify button shows loading spinner
8. Verify modal closes on success
9. Verify batch status updates to "Complete" in table
10. Test canceling modal — should not submit

**Step 7: Commit**

```bash
git add web/frontend/src/pages/Production.jsx
git commit -m "feat: replace prompt() with Complete Batch modal"
```

---

## Task 2: Yield Sync to Recipe Stock

**Files:**
- Modify: `web/frontend/src/api/client.js` (getBatches, add updateRecipeStock)
- Modify: `web/frontend/src/pages/Production.jsx` (handleCompleteSubmit)

**Context:**
After completing a batch, the `recipes.stock_quantity` should increase by the yield amount. The `completeBatch()` RPC may or may not handle this. We'll add a frontend fallback to ensure the sync happens.

**Step 1: Add updateRecipeStock function to API client**

In `web/frontend/src/api/client.js`, add after `completeBatch` function:
```javascript
export async function updateRecipeStock(recipeId, quantityDelta) {
    // Fetch current recipe to get current stock
    const { data: recipe, error: fetchError } = await supabase
        .from('recipes')
        .select('stock_quantity')
        .eq('id', recipeId)
        .single();

    if (fetchError) throw new Error('Failed to fetch recipe: ' + fetchError.message);

    const newStock = (recipe.stock_quantity || 0) + quantityDelta;

    const { data, error } = await supabase
        .from('recipes')
        .update({ stock_quantity: newStock })
        .eq('id', recipeId)
        .select()
        .single();

    if (error) throw new Error('Failed to update recipe stock: ' + error.message);
    return data;
}
```

**Step 2: Update Production's handleCompleteSubmit to sync stock**

In `Production.jsx`, modify the `handleCompleteSubmit` function to call the new sync after batch completion:
```javascript
async function handleCompleteSubmit(e) {
    e.preventDefault();
    if (!completingBatch) return;

    try {
        setIsSubmittingComplete(true);
        const yieldQty = parseInt(completeFormData.yield_quantity) || 0;
        if (yieldQty <= 0) {
            alert('Please enter a valid yield quantity (greater than 0)');
            setIsSubmittingComplete(false);
            return;
        }

        // Complete the batch
        await completeBatch(completingBatch.id, yieldQty);

        // Sync recipe stock (frontend fallback, in case RPC doesn't handle it)
        try {
            const { updateRecipeStock } = await import('../api/client');
            await updateRecipeStock(completingBatch.recipe_id, yieldQty);
        } catch (syncErr) {
            console.warn('Recipe stock sync failed, but batch was completed. Will retry on next page load.', syncErr);
        }

        setIsCompleteModalOpen(false);
        setCompletingBatch(null);
        setCompleteFormData({ yield_quantity: 0, notes: '' });
        await loadBatches();
    } catch (err) {
        console.error('Failed to complete batch:', err);
        alert('Failed to complete batch: ' + err.message);
    } finally {
        setIsSubmittingComplete(false);
    }
}
```

Actually, simplify: import `updateRecipeStock` at the top of the file instead of dynamic import. Update imports at top:
```javascript
import { getBatches, getRecipes, createBatch, updateBatch, startBatch, completeBatch, updateRecipeStock } from '../api/client';
```

Then simplify handleCompleteSubmit:
```javascript
async function handleCompleteSubmit(e) {
    e.preventDefault();
    if (!completingBatch) return;

    try {
        setIsSubmittingComplete(true);
        const yieldQty = parseInt(completeFormData.yield_quantity) || 0;
        if (yieldQty <= 0) {
            alert('Please enter a valid yield quantity (greater than 0)');
            setIsSubmittingComplete(false);
            return;
        }

        // Complete the batch
        await completeBatch(completingBatch.id, yieldQty);

        // Sync recipe stock (frontend fallback)
        try {
            await updateRecipeStock(completingBatch.recipe_id, yieldQty);
        } catch (syncErr) {
            console.warn('Recipe stock sync failed, but batch was completed.', syncErr);
            // Don't throw — batch completion was successful, stock will sync on next load
        }

        setIsCompleteModalOpen(false);
        setCompletingBatch(null);
        setCompleteFormData({ yield_quantity: 0, notes: '' });
        await loadBatches();
    } catch (err) {
        console.error('Failed to complete batch:', err);
        alert('Failed to complete batch: ' + err.message);
    } finally {
        setIsSubmittingComplete(false);
    }
}
```

**Step 3: Build and test**

```bash
cd web/frontend && npm run build
```

Expected: Zero errors.

**Step 4: Manual test**

1. Navigate to Recipes page, note a recipe's stock count (e.g., "Lavender & Oatmeal: 10 units")
2. Go to Production page
3. Complete a batch of that recipe with yield = 5
4. Navigate back to Recipes page
5. Verify that recipe's stock increased by 5 (should now show 15 units)
6. Repeat with different recipe and yield amount to verify cumulative

**Step 5: Commit**

```bash
git add web/frontend/src/api/client.js web/frontend/src/pages/Production.jsx
git commit -m "fix: sync completed batch yield to recipe stock"
```

---

## Task 3: Manual Inventory Adjustments

**Files:**
- Modify: `web/frontend/src/pages/Inventory.jsx` (add modal + button)
- Modify: `web/frontend/src/api/client.js` (add adjustInventoryItem function)

**Context:**
Users need to adjust inventory for wastage, spills, or cycle counts. We'll add an "Adjust" button (pencil icon) to each inventory row that opens a modal to add/remove units with a reason.

**Step 1: Add adjustInventoryItem to API client**

In `web/frontend/src/api/client.js`, add:
```javascript
export async function adjustInventoryItem(itemId, quantityDelta, reason) {
    // Fetch current inventory item to calculate new quantity
    const { data: item, error: fetchError } = await supabase
        .from('inventory_items')
        .select('quantity')
        .eq('id', itemId)
        .single();

    if (fetchError) throw new Error('Failed to fetch inventory item: ' + fetchError.message);

    const newQuantity = (item.quantity || 0) + quantityDelta;
    if (newQuantity < 0) throw new Error('Adjustment would result in negative quantity');

    const { data, error } = await supabase
        .from('inventory_items')
        .update({ quantity: newQuantity })
        .eq('id', itemId)
        .select()
        .single();

    if (error) throw new Error('Failed to adjust inventory: ' + error.message);

    // TODO: If audit table exists, create log entry here
    // await supabase.from('inventory_adjustments').insert({...})

    return data;
}
```

**Step 2: Add state to Inventory for Adjust modal**

In `Inventory.jsx`, add to state declarations (after line 51):
```javascript
const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
const [adjustingItem, setAdjustingItem] = useState(null);
const [adjustForm, setAdjustForm] = useState({
    adjustment_type: 'add', // 'add' or 'remove'
    amount: 0,
    reason: ''
});
const [isAdjustSubmitting, setIsAdjustSubmitting] = useState(false);
```

**Step 3: Add adjust modal handler functions**

Add before the `return` statement (around line 237):
```javascript
function openAdjustModal(item) {
    setAdjustingItem(item);
    setAdjustForm({ adjustment_type: 'add', amount: 0, reason: '' });
    setIsAdjustModalOpen(true);
}

function closeAdjustModal() {
    setIsAdjustModalOpen(false);
    setAdjustingItem(null);
    setAdjustForm({ adjustment_type: 'add', amount: 0, reason: '' });
}

async function handleAdjustSubmit(e) {
    e.preventDefault();
    if (!adjustingItem) return;

    try {
        setIsAdjustSubmitting(true);

        const amount = parseInt(adjustForm.amount) || 0;
        if (amount <= 0) {
            alert('Please enter a valid amount (greater than 0)');
            setIsAdjustSubmitting(false);
            return;
        }

        const reason = adjustForm.reason.trim();
        if (!reason) {
            alert('Please provide a reason for this adjustment');
            setIsAdjustSubmitting(false);
            return;
        }

        const delta = adjustForm.adjustment_type === 'add' ? amount : -amount;

        await adjustInventoryItem(adjustingItem.id, delta, reason);

        closeAdjustModal();
        await loadData();
    } catch (err) {
        console.error('Failed to adjust inventory:', err);
        alert('Failed to adjust inventory: ' + err.message);
    } finally {
        setIsAdjustSubmitting(false);
    }
}
```

**Step 4: Add Adjust button to inventory table**

In the Inventory table body (around line 410-419), add an Adjust button before the Delete button:
```javascript
<button
    className="btn-icon"
    onClick={() => openAdjustModal(item)}
    title="Adjust quantity"
    style={{ color: 'var(--color-warning)' }}
>
    <Edit2 size={16} />
</button>
```

**Step 5: Add Adjust modal JSX**

Add before closing `</div>` of main return (after line 733, before closing brace):
```javascript
{/* Adjust Inventory Modal */}
{isAdjustModalOpen && adjustingItem && (
    <div className="modal-overlay" onClick={closeAdjustModal}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
                <h2 className="modal-title">Adjust Inventory</h2>
                <button className="btn-icon" onClick={closeAdjustModal}>
                    <X size={20} />
                </button>
            </div>
            <form onSubmit={handleAdjustSubmit}>
                <div className="modal-body">
                    {/* Item Context */}
                    <div style={{
                        background: 'var(--glass-bg)',
                        padding: 'var(--spacing-md)',
                        borderRadius: 'var(--radius-sm)',
                        marginBottom: 'var(--spacing-lg)',
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 'var(--spacing-md)'
                    }}>
                        <div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Product</div>
                            <div style={{ fontWeight: 500, marginTop: '4px' }}>
                                {adjustingItem.recipe?.name || 'Unknown'}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Location</div>
                            <div style={{ fontWeight: 500, marginTop: '4px' }}>
                                {adjustingItem.location?.name || 'Unknown'}
                            </div>
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Current Quantity</div>
                            <div style={{ fontWeight: 600, marginTop: '4px', fontSize: '1.1rem' }}>
                                {adjustingItem.quantity} units
                            </div>
                        </div>
                    </div>

                    {/* Adjustment Type Toggle */}
                    <div className="form-group">
                        <label className="form-label">Adjustment Type</label>
                        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                            <button
                                type="button"
                                className={`btn ${adjustForm.adjustment_type === 'add' ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setAdjustForm(prev => ({ ...prev, adjustment_type: 'add' }))}
                                style={{ flex: 1 }}
                            >
                                + Add
                            </button>
                            <button
                                type="button"
                                className={`btn ${adjustForm.adjustment_type === 'remove' ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setAdjustForm(prev => ({ ...prev, adjustment_type: 'remove' }))}
                                style={{ flex: 1 }}
                            >
                                − Remove
                            </button>
                        </div>
                    </div>

                    {/* Amount Input */}
                    <div className="form-group">
                        <label className="form-label">Amount *</label>
                        <input
                            type="number"
                            className="form-input"
                            value={adjustForm.amount}
                            onChange={(e) => setAdjustForm(prev => ({ ...prev, amount: e.target.value }))}
                            min="0"
                            step="1"
                            required
                            placeholder="e.g., 5"
                        />
                    </div>

                    {/* Reason Input */}
                    <div className="form-group">
                        <label className="form-label">Reason *</label>
                        <select
                            className="form-input form-select"
                            value={adjustForm.reason}
                            onChange={(e) => setAdjustForm(prev => ({ ...prev, reason: e.target.value }))}
                            required
                        >
                            <option value="">Select a reason...</option>
                            <option value="Damaged">Damaged goods</option>
                            <option value="Wastage">Production wastage</option>
                            <option value="Cycle Count">Cycle count correction</option>
                            <option value="Spill">Spill or accident</option>
                            <option value="Theft">Theft or loss</option>
                            <option value="Other">Other</option>
                        </select>
                        {adjustForm.reason === 'Other' && (
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Specify reason..."
                                value={adjustForm.reason}
                                onChange={(e) => setAdjustForm(prev => ({ ...prev, reason: e.target.value }))}
                                style={{ marginTop: 'var(--spacing-sm)' }}
                            />
                        )}
                    </div>
                </div>
                <div className="modal-footer">
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={closeAdjustModal}
                        disabled={isAdjustSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isAdjustSubmitting}
                        style={{ opacity: isAdjustSubmitting ? 0.6 : 1 }}
                    >
                        {isAdjustSubmitting ? 'Adjusting...' : 'Apply Adjustment'}
                    </button>
                </div>
            </form>
        </div>
    </div>
)}
```

**Step 6: Update imports**

At the top of `Inventory.jsx`, add `Edit2` to lucide imports (line 8) and add `adjustInventoryItem` to the client imports:
```javascript
import { getLocations, createLocation, updateLocation, deleteLocation, getInventoryItems, moveToInventory, deleteInventoryItem, getBatches, getRecipes, transferInventory, adjustInventoryItem } from '../api/client';
```

**Step 7: Build and test**

```bash
cd web/frontend && npm run build
```

Expected: Zero errors.

**Step 8: Manual test**

1. Navigate to Inventory page
2. Find an inventory item with qty > 0
3. Click the pencil (Adjust) button on that row
4. Verify modal opens with product/location/current qty context
5. Select "Remove", enter amount "3", select reason "Damaged goods"
6. Click "Apply Adjustment"
7. Verify modal closes and inventory table updates (qty decreased by 3)
8. Repeat with "Add" and different reason to test both directions
9. Test validation: try submitting without selecting reason, should show alert

**Step 9: Commit**

```bash
git add web/frontend/src/pages/Inventory.jsx web/frontend/src/api/client.js
git commit -m "feat: add manual inventory adjustments"
```

---

## Task 4: Traceability Ingredient Data Fix

**Files:**
- Modify: `web/frontend/src/api/client.js` (getBatches query)

**Context:**
The Traceability page shows "No ingredient data available" because the `getBatches()` query doesn't join recipe ingredients. We'll update the Supabase select query to include nested ingredients.

**Step 1: Update getBatches query**

In `web/frontend/src/api/client.js`, find the `getBatches` function (around line ~150-200) and update the select query to include nested ingredient joins:

Replace:
```javascript
export async function getBatches(filters = {}) {
    let query = supabase
        .from('batches')
        .select('*');

    if (filters.status) {
        query = query.eq('status', filters.status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
}
```

With:
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

    if (filters.status) {
        query = query.eq('status', filters.status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
}
```

**Step 2: Build and test**

```bash
cd web/frontend && npm run build
```

Expected: Zero errors.

**Step 3: Manual test**

1. Navigate to Traceability page
2. Expand a completed batch that has a recipe with ingredients (e.g., a batch not from recipes 38-44)
3. Verify "Ingredients Used" section shows a table with ingredients, quantities, and units
4. Verify the quantities are scaled correctly by batch.scale_factor
5. Expand a batch from recipes 38-44 (which have 0 ingredients)
6. Verify "No ingredient data available" appears (expected, as those recipes have no ingredients)

**Step 4: Commit**

```bash
git add web/frontend/src/api/client.js
git commit -m "fix: populate ingredient data in Traceability detail"
```

---

## Task 5: Interactive Lot Numbers

**Files:**
- Modify: `web/frontend/src/pages/Production.jsx` (make lot number clickable)
- Modify: `web/frontend/src/pages/Traceability.jsx` (auto-search and expand on ?lot param)

**Context:**
Users should be able to click a lot number in Production to jump to its Traceability detail. We'll use React Router's `<Link>` and URL query params to achieve this.

**Step 1: Make lot numbers clickable in Production**

In `Production.jsx`, find the Batches table body (around line 301-333), specifically where lot_number is rendered (line 305-307).

Replace:
```javascript
<td>
    <strong style={{ fontFamily: 'monospace' }}>{batch.lot_number}</strong>
</td>
```

With:
```javascript
<td>
    <Link
        to={`/traceability?lot=${encodeURIComponent(batch.lot_number)}`}
        style={{
            cursor: 'pointer',
            color: 'var(--color-primary)',
            textDecoration: 'none',
            fontFamily: 'monospace',
            fontWeight: 'bold'
        }}
    >
        {batch.lot_number}
    </Link>
</td>
```

Add `Link` to React Router imports at the top of Production.jsx (add to existing imports from react-router-dom if present, or add new line):
```javascript
import { useNavigate, Link } from 'react-router-dom';
```

(If `useNavigate` isn't already imported, add it; `Link` is definitely needed.)

**Step 2: Update Traceability to handle ?lot param**

In `Traceability.jsx`, add a new `useEffect` to handle the query param (add after existing useEffect on line 55-57):

```javascript
useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const lotParam = params.get('lot');
    if (lotParam && filteredBatches.length > 0) {
        // Find the batch with this lot number
        const matchingBatch = filteredBatches.find(b => b.lot_number === lotParam);
        if (matchingBatch) {
            setSearch(lotParam); // Auto-populate search
            setExpandedBatch(matchingBatch.id); // Auto-expand batch
            // Scroll to the batch (optional, nice-to-have)
            setTimeout(() => {
                const element = document.querySelector(`[data-lot="${lotParam}"]`);
                if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    }
}, [filteredBatches]);
```

**Step 3: Add data attribute to batch cards for scroll target**

In Traceability, find the batch card container (around line 152) and add `data-lot` attribute:

Replace:
```javascript
<div key={batch.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
```

With:
```javascript
<div key={batch.id} className="card" style={{ padding: 0, overflow: 'hidden' }} data-lot={batch.lot_number}>
```

**Step 4: Build and test**

```bash
cd web/frontend && npm run build
```

Expected: Zero errors.

**Step 5: Manual test**

1. Navigate to Production page
2. Verify lot numbers are styled as blue/primary color and underlined
3. Click a lot number
4. Verify navigation to `/traceability?lot=<lot_number>`
5. Verify Traceability page auto-populates search field with the lot number
6. Verify batch card is auto-expanded on page load
7. Test with lot numbers containing special characters (if any)
8. Test clicking different lot numbers to verify navigation works multiple times

**Step 6: Commit**

```bash
git add web/frontend/src/pages/Production.jsx web/frontend/src/pages/Traceability.jsx
git commit -m "feat: make lot numbers interactive links to Traceability"
```

---

## Final Verification

After all 5 commits are complete:

**Build one final time:**
```bash
cd web/frontend && npm run build
```

Expected: Zero errors, build completes in ~5-10s.

**Manual smoke test (full workflow):**
1. Create a new batch (Production → "New Batch")
2. Start the batch (Status: Planned → In Progress)
3. Move to Curing (Status: In Progress → Curing)
4. Complete the batch (Status: Curing → Complete, enter yield in modal)
5. Check Recipes page — verify stock increased by yield amount
6. Go to Inventory, click "Move" to move batch to inventory
7. Select location, adjust quantity if desired
8. View in Inventory table, click "Adjust" button on that item
9. Add/remove units with a reason
10. Navigate to Traceability, search for the lot, verify ingredients display
11. Go back to Production, click the lot number link
12. Verify you're taken to Traceability with that lot auto-searched and expanded

**All commits push:**
```bash
git log --oneline -5
# Should show the 5 new commits
git push origin main
```

---

## Success Checklist

✅ Complete Batch modal replaces `prompt()`
✅ Yield quantities sync to recipe stock immediately
✅ Manual inventory adjustment UI works with Add/Remove/Reason
✅ Traceability shows ingredients for batches with recipe data
✅ Lot numbers are clickable and navigate to Traceability with auto-search
✅ All 5 commits pushed to main
✅ Build verifies zero errors
✅ Full workflow smoke test passes
