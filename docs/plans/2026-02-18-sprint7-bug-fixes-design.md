# Sprint 7: Bug Fixes + Label Maker Sidebar — Design Document

**Date:** 2026-02-18
**Status:** Design Approved
**Approach:** Sequential bug-by-bug fixes with testing and commits after each fix

---

## Overview

Sprint 7 is a **stabilization sprint** addressing 4 issues identified during Sprint 6 testing, plus adding the Label Maker to the sidebar for visibility. We execute sequentially to minimize risk and ensure each fix is properly tested before moving to the next.

**Scope:**
1. Plan Tier Reset on Navigation (High Severity)
2. Make Batch Silent UI (Medium Severity)
3. Sales Order Form Validation (Medium Severity)
4. Make Label Maker Visible in Sidebar (Medium Feature)

---

## Fix #1: Plan Tier Reset on Navigation

### Problem Statement
When navigating between pages, the subscription tier resets to "Free", locking Manufacturer-only features (Production, Label Creator, etc.). Users must manually re-select "Manufacturer" in Settings > Subscription to regain access.

### Root Cause Analysis
**Likely Cause:** Race condition in `SubscriptionContext.jsx`
- The profile fetch may complete after a route change, causing state to become stale
- The realtime subscription listener may fire out of sync with component lifecycle
- Missing dependency on `user.id` means the effect doesn't re-run when the user actually changes

### Solution Design

**Step 1: Fix useEffect dependencies**
```javascript
// Current (buggy):
useEffect(() => {
  if (!user) { /* reset */ }
  fetchProfile(); // Only depends on user object, not user.id
}, [user]);

// Fixed:
useEffect(() => {
  if (!user || !user.id) { /* reset */ }
  fetchProfile();
}, [user?.id]); // Depend on user.id specifically
```

**Step 2: Add mounted flag safety**
```javascript
useEffect(() => {
  let mounted = true;

  async function fetchProfile() {
    // ... fetch code ...
    if (mounted && data) {
      setTier(data.plan_tier || 'free');
    }
  }

  return () => { mounted = false; };
}, [user?.id]);
```

**Step 3: Add localStorage fallback cache**
- On successful tier update, store in localStorage: `soapbuddy_tier_cache: "manufacturer"`
- On component mount, use cache if available while fetching fresh data
- Cache expires after 30 minutes to prevent stale data

### Files Modified
- `web/frontend/src/contexts/SubscriptionContext.jsx`

### Testing Checklist
- [ ] Login as Manufacturer user
- [ ] Navigate: Dashboard → Production → Recipes → Inventory → back to Dashboard
- [ ] Verify `tier` in SubscriptionContext stays "manufacturer" (check React DevTools)
- [ ] Verify Production page features remain unlocked throughout
- [ ] Check browser console for no "mounted state" warnings
- [ ] Logout and login again — tier should load correctly

### Success Criteria
✅ Tier persists through navigation without resetting
✅ No console errors or warnings
✅ Production features remain unlocked across page transitions

---

## Fix #2: Make Batch Silent UI

### Problem Statement
Clicking "Make Batch" on a Recipe card succeeds in the background but provides no visual feedback. Users don't know if the action succeeded, causing them to click multiple times and create duplicate batches.

### Root Cause Analysis
The batch creation is likely async, but the button doesn't show loading state or success feedback. No toast notification or modal confirms completion.

### Solution Design

**Step 1: Add loading state to component**
```javascript
const [isCreatingBatch, setIsCreatingBatch] = useState(false);
```

**Step 2: Update button handler**
```javascript
const handleMakeBatch = async (recipeId) => {
  setIsCreatingBatch(true);
  try {
    const batch = await createBatch({ recipe_id: recipeId });
    // Show success toast/modal
    showSuccess(`Batch "${batch.name}" created successfully`);
    // Optionally navigate to Production page
    navigate('/production');
  } catch (error) {
    showError(error.message);
  } finally {
    setIsCreatingBatch(false);
  }
};
```

**Step 3: Update button UI**
```javascript
<button
  onClick={() => handleMakeBatch(recipe.id)}
  disabled={isCreatingBatch}
  className="btn-primary"
>
  {isCreatingBatch ? (
    <>
      <Spinner size="sm" className="mr-2" />
      Creating...
    </>
  ) : (
    'Make Batch'
  )}
</button>
```

### Files Modified
- `web/frontend/src/pages/Recipes.jsx` (or component containing "Make Batch" button)

### Testing Checklist
- [ ] Click "Make Batch" on a recipe
- [ ] Verify button shows loading spinner
- [ ] Verify button is disabled (can't click again)
- [ ] Wait for batch creation to complete
- [ ] Verify success notification appears
- [ ] Verify only ONE batch is created in Production
- [ ] Test with network throttling (slow mode) to verify spinner shows

### Success Criteria
✅ Button shows loading state while creating batch
✅ Success notification appears after creation
✅ No duplicate batches created
✅ Button re-enables after completion

---

## Fix #3: Sales Order Form Validation

### Problem Statement
Creating a Sales Order for a product with 0 stock at a location fails with a generic error: "Please select an Item". Users don't understand why the item they selected is invalid.

### Root Cause Analysis
Form validation doesn't check inventory availability, only whether an item is selected. Error message is generic and unhelpful.

### Solution Design

**Step 1: Add inventory check on item selection**
```javascript
const handleItemSelect = async (itemId) => {
  const item = recipes.find(r => r.id === itemId);
  const available = item.stock_at_location[selectedLocation] || 0;

  if (available <= 0) {
    setError(`"${item.name}" is out of stock at ${selectedLocation}`);
    setFormData(prev => ({ ...prev, item_id: null }));
    return;
  }

  setError(null);
  setFormData(prev => ({ ...prev, item_id: itemId }));
};
```

**Step 2: Improve form validation on submit**
```javascript
const handleSubmit = async () => {
  if (!formData.item_id) {
    setError('Please select an Item');
    return;
  }

  const item = recipes.find(r => r.id === formData.item_id);
  const available = item.stock_at_location[selectedLocation] || 0;
  const requested = parseFloat(formData.quantity) || 0;

  if (requested > available) {
    setError(`Insufficient stock: ${available} available, ${requested} requested`);
    return;
  }

  // Proceed with creation
};
```

**Step 3: Show available stock in UI**
```javascript
<select onChange={e => handleItemSelect(e.target.value)}>
  {recipes.map(r => (
    <option key={r.id} value={r.id}>
      {r.name} ({r.stock_at_location[selectedLocation] || 0} available)
    </option>
  ))}
</select>
```

### Files Modified
- `web/frontend/src/pages/SalesOrders.jsx` (or form component)

### Testing Checklist
- [ ] Create a Sales Order with an out-of-stock item
- [ ] Verify clear error message appears (not generic "select an item")
- [ ] Verify form doesn't submit
- [ ] Create a Sales Order with an in-stock item
- [ ] Verify form submits successfully
- [ ] Test with requested qty > available qty
- [ ] Verify appropriate error message: "Insufficient stock: X available, Y requested"

### Success Criteria
✅ Clear error messages for out-of-stock items
✅ Available stock displayed in item selector
✅ Form validation prevents invalid submissions
✅ In-stock items can be created successfully

---

## Fix #4: Make Label Maker Visible in Sidebar

### Problem Statement
The Label Maker (`LabelStudio.jsx`) component exists but has no navigation entry, making it invisible and inaccessible to users.

### Solution Design

**Step 1: Add nav item to Layout.jsx**
```javascript
const allNavItems = [
  // ... existing items ...
  {
    path: '/label-creator',
    icon: Palette,
    label: 'Label Creator',
    featureId: 'labelCreator'  // Manufacturer tier only
  },
  // ... settings, admin, etc ...
];
```

**Step 2: Import Palette icon**
```javascript
import { Palette } from 'lucide-react';
```

**Step 3: Add route in App.jsx**
```javascript
<Route path="/label-creator" element={
  <TierGate requiredTier="manufacturer">
    <LabelStudio />
  </TierGate>
} />
```

**Step 4: Import LabelStudio component**
```javascript
import LabelStudio from './pages/LabelStudio'; // or correct path
```

### Files Modified
- `web/frontend/src/components/Layout.jsx`
- `web/frontend/src/App.jsx`

### Testing Checklist
- [ ] Login as Free tier user
- [ ] Verify "Label Creator" does NOT appear in sidebar
- [ ] Login as Maker tier user
- [ ] Verify "Label Creator" does NOT appear in sidebar
- [ ] Login as Manufacturer tier user
- [ ] Verify "Label Creator" appears in sidebar
- [ ] Click "Label Creator" nav item
- [ ] Verify page navigates to `/label-creator`
- [ ] Verify LabelStudio component renders
- [ ] Verify visual styling matches other nav items (icons, spacing, etc.)

### Success Criteria
✅ Label Creator nav item visible only to Manufacturer users
✅ Clicking nav item navigates to `/label-creator`
✅ LabelStudio component renders correctly
✅ UI/UX consistent with other sidebar items

---

## Execution Plan: Sequential Commits

After each fix is complete and tested:

1. **Commit #1:** `fix: resolve subscription tier reset on navigation`
2. **Commit #2:** `fix: add loading state and feedback to Make Batch button`
3. **Commit #3:** `fix: improve Sales Order validation and error messages`
4. **Commit #4:** `feat: add Label Creator to sidebar navigation`

**Build verification:** After each commit, run `npm run build` to ensure zero errors.

**Final step:** Push all commits to `main` branch.

---

## Testing Strategy

- **Manual Testing:** Test each fix locally before committing
- **Build Verification:** Run `npm run build` after each commit
- **Regression Testing:** After all fixes, do a smoke test of main features (Dashboard, Recipes, Production, Sales Orders)

---

## Rollback Plan

If a fix introduces regressions:
1. Revert the specific commit: `git revert <commit-hash>`
2. Diagnose the issue
3. Create a new fix commit
4. Push the revert + new fix

---

## Success Metrics

✅ All 4 fixes implemented and tested
✅ Build passes with zero errors
✅ Each fix has isolated, clear commit message
✅ Manual testing confirms all bugs resolved
✅ No regressions in existing features
