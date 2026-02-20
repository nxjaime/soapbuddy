# Sprint 10: Admin Page & Stripe Checking Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the `Admin.jsx` page crash, use the browser to update Stripe pricing, update the `.env` with new price IDs, and test/fix the Stripe checkout button.

**Architecture:** We will modify `Admin.jsx` to use the correct `PLANS` object for tier iterating. We will use `browser_subagent` to log into the connected Stripe dashboard, generate new price IDs, and update the application configuration.

**Tech Stack:** React, Supabase Edge Functions, Stripe Dashboard.

---

### Task 1: Fix Admin Page `TIER_FEATURES` issue

**Files:**
- Modify: `web/frontend/src/pages/Admin.jsx`
- Modify (Verify): `web/frontend/src/contexts/SubscriptionContext.jsx`

**Step 1: Write the failing fix**
Actually, we don't have a specific test file, so we will immediately implement the fix.

**Step 2: Write minimal implementation**
Modify `Admin.jsx` line 19 and 186 to use `PLANS` from `SubscriptionContext` instead of `TIER_FEATURES`.

```javascript
// Change import from SubscriptionContext:
const { isAdmin, PLANS } = useSubscription();

// Update Object.keys map:
{Object.values(PLANS).map(plan => (
    <option key={plan.id} value={plan.id}>
        {plan.name}
    </option>
))}
```

**Step 3: Run the web app**
Go to `/admin` and confirm it loads without throwing a React error.

**Step 4: Commit**
```bash
git add web/frontend/src/pages/Admin.jsx
git commit -m "fix: Admin page crashing due to TIER_FEATURES undefined reference"
```

### Task 2: Create New Stripe Prices

**Files:** None

**Step 1: Use Browser Subagent**
We need to use the `browser_subagent` tool with instructions to go to the Stripe Dashboard (currently logged in), navigate to the Product Catalog, locate the "Maker" and "Manufacturer" products, and create a new recurring price for each ($6 and $19).

**Step 2: Collect New Price IDs**
Return the new `price_...` IDs from the browser subagent.

### Task 3: Update Pricing IDs and Display

**Files:**
- Modify: `web/frontend/.env`
- Modify: `web/frontend/src/contexts/SubscriptionContext.jsx`

**Step 1: Update Environment Variables**
Update the prices in `.env`. Replace `VITE_STRIPE_PRICE_MAKER` and `VITE_STRIPE_PRICE_MANUFACTURER`.

**Step 2: Update Display Prices**
In `SubscriptionContext.jsx`, update `maker` price to `'$6'` and `manufacturer` price to `'$19'`.

**Step 3: Commit**
```bash
git add web/frontend/.env web/frontend/src/contexts/SubscriptionContext.jsx
git commit -m "chore: update Stripe pricing tiers to $6 and $19"
```

### Task 4: Fix Stripe Checkout Button

**Files:**
- Verify: `web/frontend/src/contexts/SubscriptionContext.jsx`
- Verify: `supabase/functions/create-checkout-session/index.ts`

**Step 1: Use Browser Subagent**
Test clicking "Upgrade" in the app on the `/settings?tab=subscription` page. Observe console logs or network errors.

**Step 2: Implement Fix based on Error**
The likely issues:
- Error invoking the edge function.
- `window.location.origin` missing the `/` path.
- Or mapping issues inside `create-checkout-session`.

If we spot the error, fix the respective file, re-deploy the edge function if necessary, and re-test.

**Step 3: Commit**
```bash
git commit -m "fix: resolve stripe checkout button failure"
```
