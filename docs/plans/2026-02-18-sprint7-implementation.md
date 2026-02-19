# Sprint 7: Bug Fixes + Label Maker Sidebar — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 4 critical bugs from Sprint 6 testing and add Label Maker to sidebar navigation.

**Architecture:** Sequential, isolated fixes with testing and commits after each. No cross-file dependencies between fixes. Each fix is a 1-2 file change with clear test cases.

**Tech Stack:** React 19, Supabase (realtime subscriptions), Lucide React (icons), React Router

---

## Task 1: Fix Subscription Tier Reset on Navigation

**Files:**
- Modify: `web/frontend/src/contexts/SubscriptionContext.jsx:80-130`

**Step 1: Read the current SubscriptionContext useEffect**

Run: `cat web/frontend/src/contexts/SubscriptionContext.jsx | grep -A 50 "useEffect"`

Expected: See the profile fetch effect and realtime listener setup.

**Step 2: Identify the bug**

Look for:
- `useEffect(() => { ... }, [user])` — should depend on `user?.id` instead
- Missing mounted flag in async function
- No fallback cache during navigation

**Step 3: Add mounted flag safety**

In the fetchProfile async function inside useEffect, wrap state updates:

```javascript
useEffect(() => {
    if (!user || !user.id) {
        setTier('free');
        setProfile(null);
        setLoading(false);
        return;
    }

    let mounted = true;

    const fetchProfile = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (!error && data && mounted) {  // Only update if mounted
            setProfile(data);
            setTier(data.plan_tier || 'free');
            setIsAdmin(data.is_admin || false);
        } else if (error && mounted) {
            setTier('free');
            setIsAdmin(false);
        }
        if (mounted) setLoading(false);
    };

    fetchProfile();

    // Realtime listener
    const channel = supabase
        .channel('profile-changes')
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`,
        }, (payload) => {
            if (payload.new && mounted) {
                setProfile(payload.new);
                setTier(payload.new.plan_tier || 'free');
                setIsAdmin(payload.new.is_admin || false);
            }
        })
        .subscribe();

    return () => {
        mounted = false;
        if (channel) supabase.removeChannel(channel);
    };
}, [user?.id]);  // CRITICAL: Change from [user] to [user?.id]
```

**Step 4: Add localStorage cache as fallback**

Add this helper function near the top of SubscriptionProvider:

```javascript
const getCachedTier = () => {
    const cached = localStorage.getItem('soapbuddy_tier_cache');
    if (!cached) return 'free';

    const { tier, timestamp } = JSON.parse(cached);
    const thirtyMinutesMs = 30 * 60 * 1000;
    if (Date.now() - timestamp > thirtyMinutesMs) {
        localStorage.removeItem('soapbuddy_tier_cache');
        return 'free';
    }
    return tier;
};

const setCachedTier = (tier) => {
    localStorage.setItem('soapbuddy_tier_cache', JSON.stringify({
        tier,
        timestamp: Date.now()
    }));
};
```

**Step 5: Use cache during fetch**

In the fetchProfile function, after checking `if (!user || !user.id)`, add:

```javascript
// Use cached tier while fetching fresh data
setTier(getCachedTier());
setLoading(true);
```

And after successful fetch, add:

```javascript
if (!error && data && mounted) {
    setProfile(data);
    const newTier = data.plan_tier || 'free';
    setTier(newTier);
    setCachedTier(newTier);  // Cache the tier
    setIsAdmin(data.is_admin || false);
}
```

**Step 6: Run build to verify no syntax errors**

Run: `cd web/frontend && npm run build 2>&1 | tail -20`

Expected: "✓ built in X.XXs" with no errors.

**Step 7: Manual test**

```
1. Login as Manufacturer user (verify tier shows "manufacturer")
2. Navigate: Dashboard → Production → Recipes → Inventory
3. After each navigation, check that tier still shows "manufacturer"
4. Open React DevTools > SubscriptionContext > tier
5. Verify it never shows "free" during navigation
6. Logout and login again — tier should load correctly
```

**Step 8: Commit**

```bash
cd /home/nickj/Documents/Soapmaker_App/SoapManager
git add web/frontend/src/contexts/SubscriptionContext.jsx
git commit -m "fix: resolve subscription tier reset on navigation

- Add mounted flag to prevent state updates after unmount
- Change useEffect dependency from [user] to [user?.id]
- Add localStorage cache as fallback during navigation
- Cache expires after 30 minutes to prevent stale data
- Realtime listener respects mounted flag"
```

---

## Task 2: Add Loading State to Make Batch Button

**Files:**
- Modify: `web/frontend/src/pages/Recipes.jsx:1-400` (find handleMakeBatch)
- Check: `web/frontend/src/components/` for any Spinner component

**Step 1: Find the Make Batch button code**

Run: `grep -n "Make Batch\|handleMakeBatch\|createBatch" web/frontend/src/pages/Recipes.jsx | head -20`

Expected: Line numbers showing where the button and handler are.

**Step 2: Check if a Spinner component exists**

Run: `find web/frontend/src -name "*Spinner*" -o -name "*Load*" | grep -i spinner`

If no spinner exists, use this simple inline spinner:
```javascript
const Spinner = ({ size = 'md', className = '' }) => (
  <div className={`inline-block ${size === 'sm' ? 'w-4 h-4' : 'w-6 h-6'} border-2 border-current border-r-transparent rounded-full animate-spin ${className}`} />
);
```

Add it at the top of Recipes.jsx after imports.

**Step 3: Add loading state**

Find the `useState` declarations in the Recipes component and add:

```javascript
const [isCreatingBatch, setIsCreatingBatch] = useState(false);
```

**Step 4: Update handleMakeBatch to show loading**

Find the existing handleMakeBatch function and replace it with:

```javascript
const handleMakeBatch = async (recipeId) => {
    setIsCreatingBatch(true);
    try {
        const newBatch = await createBatch({
            recipe_id: recipeId,
            status: 'Planned'
        });

        // Show success notification
        alert(`Batch created successfully! Batch ID: ${newBatch.id}`);

        // Reload batches list (if applicable)
        // Or navigate to Production page
        navigate('/production');

    } catch (error) {
        console.error('Error creating batch:', error);
        alert(`Failed to create batch: ${error.message}`);
    } finally {
        setIsCreatingBatch(false);
    }
};
```

**Step 5: Update button JSX**

Find the Make Batch button and replace it with:

```javascript
<button
    onClick={() => handleMakeBatch(recipe.id)}
    disabled={isCreatingBatch}
    className={`btn-primary ${isCreatingBatch ? 'opacity-50 cursor-not-allowed' : ''}`}
    title={isCreatingBatch ? 'Creating batch...' : 'Create a new batch from this recipe'}
>
    {isCreatingBatch ? (
        <>
            <Spinner size="sm" className="mr-2 inline-block" />
            Creating...
        </>
    ) : (
        'Make Batch'
    )}
</button>
```

**Step 6: Run build**

Run: `cd web/frontend && npm run build 2>&1 | tail -20`

Expected: "✓ built in X.XXs" with no errors.

**Step 7: Manual test**

```
1. Navigate to /recipes
2. Click "Make Batch" on any recipe
3. Verify button shows spinner and "Creating..." text
4. Verify button is disabled (can't click again)
5. Wait for batch creation to complete
6. Verify success alert appears
7. Verify you're redirected to /production
8. Go back to /recipes and verify only ONE batch was created
```

**Step 8: Commit**

```bash
cd /home/nickj/Documents/Soapmaker_App/SoapManager
git add web/frontend/src/pages/Recipes.jsx
git commit -m "fix: add loading state and feedback to Make Batch button

- Add isCreatingBatch state to track batch creation progress
- Disable button and show spinner during async operation
- Show success notification and redirect to Production on success
- Show error alert on failure with error message
- Prevents duplicate batches by disabling button during creation"
```

---

## Task 3: Improve Sales Order Form Validation

**Files:**
- Modify: `web/frontend/src/pages/SalesOrders.jsx:1-500` (find form and validation)

**Step 1: Find the Sales Order form component**

Run: `grep -n "handleSubmit\|item_id\|quantity\|location" web/frontend/src/pages/SalesOrders.jsx | head -30`

Expected: Line numbers showing form structure.

**Step 2: Find where recipes/items are loaded**

Look for:
```javascript
const [recipes, setRecipes] = useState([]);
const recipes = await getRecipes();
```

**Step 3: Add location state if missing**

If not already present, add:
```javascript
const [selectedLocation, setSelectedLocation] = useState('default');
```

**Step 4: Create helper function to check inventory**

Add this function inside the SalesOrders component:

```javascript
const getAvailableStock = (recipeId) => {
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return 0;
    return recipe.stock_at_location?.[selectedLocation] || recipe.stock_quantity || 0;
};

const validateItemSelection = (itemId) => {
    if (!itemId) return 'Please select an Item';
    const available = getAvailableStock(itemId);
    if (available <= 0) {
        const item = recipes.find(r => r.id === itemId);
        return `"${item?.name || 'Item'}" is out of stock at ${selectedLocation}`;
    }
    return null;
};

const validateQuantity = (itemId, quantity) => {
    const available = getAvailableStock(itemId);
    const requested = parseFloat(quantity) || 0;

    if (requested > available) {
        return `Insufficient stock: ${available} available, ${requested} requested`;
    }
    return null;
};
```

**Step 5: Update item selection handler**

Find the onChange handler for item selection and replace with:

```javascript
const handleItemSelect = (itemId) => {
    const error = validateItemSelection(itemId);
    if (error) {
        setError(error);
        setFormData(prev => ({ ...prev, item_id: null }));
    } else {
        setError(null);
        setFormData(prev => ({ ...prev, item_id: itemId }));
    }
};
```

**Step 6: Update form submit handler**

Find the handleSubmit function and add these validation checks before creating the order:

```javascript
const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate item selection
    const itemError = validateItemSelection(formData.item_id);
    if (itemError) {
        setError(itemError);
        return;
    }

    // Validate quantity
    const quantityError = validateQuantity(formData.item_id, formData.quantity);
    if (quantityError) {
        setError(quantityError);
        return;
    }

    // Proceed with creation
    try {
        setLoading(true);
        const result = await createSalesOrder(formData);
        alert('Sales Order created successfully!');
        // Reset form or redirect
        setFormData({ item_id: '', quantity: '', location: 'default' });
    } catch (error) {
        setError(error.message);
    } finally {
        setLoading(false);
    }
};
```

**Step 7: Update item selector JSX to show stock**

Find the item selection dropdown and replace with:

```javascript
<select
    value={formData.item_id || ''}
    onChange={(e) => handleItemSelect(e.target.value)}
    className="form-input"
    required
>
    <option value="">-- Select an Item --</option>
    {recipes.map(recipe => {
        const available = getAvailableStock(recipe.id);
        const stockStatus = available > 0 ? '✓' : '✗';
        return (
            <option key={recipe.id} value={recipe.id}>
                {recipe.name} ({available} {stockStatus})
            </option>
        );
    })}
</select>
```

**Step 8: Add error display (if not already present)**

Add this above the form:

```javascript
{error && (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
        {error}
    </div>
)}
```

**Step 9: Run build**

Run: `cd web/frontend && npm run build 2>&1 | tail -20`

Expected: "✓ built in X.XXs" with no errors.

**Step 10: Manual test**

```
1. Navigate to /sales-orders
2. Click "New Sales Order"
3. Try selecting an out-of-stock item
4. Verify clear error message appears: "X is out of stock at [location]"
5. Verify form doesn't submit
6. Select an in-stock item
7. Verify error disappears
8. Try entering quantity > available stock
9. Verify error appears: "Insufficient stock: X available, Y requested"
10. Enter valid quantity and submit
11. Verify order creates successfully
```

**Step 11: Commit**

```bash
cd /home/nickj/Documents/Soapmaker_App/SoapManager
git add web/frontend/src/pages/SalesOrders.jsx
git commit -m "fix: improve Sales Order form validation and error messages

- Add inventory check when item is selected
- Display available stock quantity in item selector dropdown
- Validate requested quantity against available stock
- Show specific error messages for out-of-stock items
- Prevent form submission for invalid items/quantities
- Clear error message when valid item is selected"
```

---

## Task 4: Add Label Maker to Sidebar Navigation

**Files:**
- Modify: `web/frontend/src/components/Layout.jsx:47-65`
- Modify: `web/frontend/src/App.jsx` (find route definitions)
- Check: Verify `LabelStudio.jsx` exists

**Step 1: Verify LabelStudio component exists**

Run: `ls -la web/frontend/src/pages/LabelStudio.jsx || ls -la web/frontend/src/components/LabelStudio.jsx`

Expected: File exists (note the path).

**Step 2: Open Layout.jsx and find nav items array**

Run: `grep -n "const allNavItems" web/frontend/src/components/Layout.jsx`

Expected: Line number of allNavItems array.

**Step 3: Add Palette import**

At the top of Layout.jsx with other lucide-react imports, add:

```javascript
import { Palette } from 'lucide-react';
```

(Update the existing import statement to include Palette)

**Step 4: Add Label Creator nav item to allNavItems**

Find the allNavItems array and add this item (place it before Settings):

```javascript
{
    path: '/label-creator',
    icon: Palette,
    label: 'Label Creator',
    featureId: 'labelCreator'  // Manufacturer tier only
},
```

Full example (context):
```javascript
const allNavItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard', alwaysVisible: true },
    // ... other items ...
    { path: '/traceability', icon: FileSearch, label: 'Traceability', featureId: 'traceability' },
    { path: '/label-creator', icon: Palette, label: 'Label Creator', featureId: 'labelCreator' },  // NEW
    { path: '/settings', icon: SettingsIcon, label: 'Settings', alwaysVisible: true },
    { path: '/admin', icon: ShieldCheck, label: 'Admin', isAdminOnly: true }
];
```

**Step 5: Open App.jsx and find route definitions**

Run: `grep -n "Route path=" web/frontend/src/App.jsx | head -20`

Expected: Line numbers of route definitions.

**Step 6: Import LabelStudio in App.jsx**

At the top of App.jsx with other component imports, add:

```javascript
import LabelStudio from './pages/LabelStudio';
```

(Or adjust path based on actual location: `./components/LabelStudio`, etc.)

**Step 7: Add route for Label Creator**

Find the route definitions (usually in a `<Routes>` element) and add:

```javascript
<Route path="/label-creator" element={
    <TierGate requiredTier="manufacturer">
        <LabelStudio />
    </TierGate>
} />
```

(Place it near other feature routes like `/production` or `/traceability`)

Full example context:
```javascript
<Routes>
    <Route path="/" element={<Dashboard />} />
    <Route path="/recipes" element={<Recipes />} />
    <Route path="/production" element={<TierGate requiredTier="production"><Production /></TierGate>} />
    <Route path="/label-creator" element={<TierGate requiredTier="manufacturer"><LabelStudio /></TierGate>} />  // NEW
    <Route path="/settings" element={<Settings />} />
    {/* ... other routes ... */}
</Routes>
```

**Step 8: Verify TierGate component is available**

Run: `grep -n "TierGate\|import.*TierGate" web/frontend/src/App.jsx | head -5`

Expected: TierGate is imported or defined. If not found, check:
```bash
find web/frontend/src -name "*TierGate*" -o -name "*Tier*"
```

And import it if needed.

**Step 9: Run build**

Run: `cd web/frontend && npm run build 2>&1 | tail -20`

Expected: "✓ built in X.XXs" with no errors.

**Step 10: Manual test**

```
1. Logout (or clear auth)
2. Login as Free tier user
3. Check sidebar — "Label Creator" should NOT appear
4. Logout and login as Maker tier user
5. Check sidebar — "Label Creator" should NOT appear
6. Logout and login as Manufacturer tier user
7. Check sidebar — "Label Creator" SHOULD appear with Palette icon
8. Click "Label Creator" nav item
9. Verify URL changes to /label-creator
10. Verify LabelStudio component renders
11. Check that styling matches other nav items (hover, active state, etc.)
12. Navigate away and back to Label Creator
13. Verify it still renders correctly
```

**Step 11: Commit**

```bash
cd /home/nickj/Documents/Soapmaker_App/SoapManager
git add web/frontend/src/components/Layout.jsx web/frontend/src/App.jsx
git commit -m "feat: add Label Creator to sidebar navigation

- Add Label Creator nav item with Palette icon
- Gate behind labelCreator feature (Manufacturer tier only)
- Add route in App.jsx pointing to LabelStudio component
- Nav item appears only to Manufacturer users
- Clicking nav item navigates to /label-creator"
```

---

## Final Steps

**Step 1: Run full build**

```bash
cd /home/nickj/Documents/Soapmaker_App/SoapManager/web/frontend
npm run build
```

Expected: "✓ built in X.XXs" with zero errors and warnings.

**Step 2: View all commits**

```bash
cd /home/nickj/Documents/Soapmaker_App/SoapManager
git log --oneline -5
```

Expected: Shows all 4 commits:
- fix: resolve subscription tier reset on navigation
- fix: add loading state and feedback to Make Batch button
- fix: improve Sales Order form validation and error messages
- feat: add Label Creator to sidebar navigation

**Step 3: Push to remote**

```bash
cd /home/nickj/Documents/Soapmaker_App/SoapManager
git push origin main
```

**Step 4: Create EXECUTION_JOURNAL entry** (Optional but recommended)

Add to `EXECUTION_JOURNAL.md`:
```
## 2026-02-18 - Sprint 7: Bug Fixes + Label Maker Sidebar

### Commit: <commit-hash>

**Task 1.1 — Plan Tier Reset on Navigation**
- Fixed useEffect dependency from [user] to [user?.id]
- Added mounted flag to prevent state updates after unmount
- Added localStorage cache with 30-minute expiration as fallback
- Verified tier persists through navigation without resetting

**Task 1.2 — Make Batch Silent UI**
- Added isCreatingBatch loading state
- Button shows spinner and "Creating..." text during async operation
- Success notification appears after batch creation
- Button disabled during creation prevents duplicate batches

**Task 1.3 — Sales Order Form Validation**
- Added inventory check when item is selected
- Display available stock in item selector dropdown
- Validate requested quantity against available stock
- Clear, specific error messages for out-of-stock and insufficient stock

**Task 1.4 — Label Creator Sidebar**
- Added Label Creator nav item with Palette icon
- Gated behind labelCreator feature (Manufacturer tier only)
- Route added in App.jsx pointing to LabelStudio component
- Nav item appears only to Manufacturer tier users

Build: ✅ zero errors (X.XXs)
```

---

## Execution Options

Plan complete and saved to `docs/plans/2026-02-18-sprint7-implementation.md`.

**Two execution paths available:**

**Option 1: Subagent-Driven (Recommended for this session)**
- I dispatch a fresh subagent per task
- Quick review between tasks
- Fast iteration with immediate feedback
- Uses superpowers:subagent-driven-development

**Option 2: Direct Execution (This session)**
- I implement all 4 tasks sequentially in this session
- Longer, continuous session
- Good if you want to monitor every step
- Requires staying in this session until all tasks complete

**Which would you prefer?**
