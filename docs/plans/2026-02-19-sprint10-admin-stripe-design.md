# Sprint 10: Admin Page & Stripe Checkout Fixes

## Overview
This design document addresses two critical areas of the SoapBuddy app: fixing the Admin Page crash and correcting the Stripe integration to use updated pricing ($6 and $19) while ensuring the checkout button properly initiates a session.

## Components & Data Flow

### 1. Admin Page Fix
- **Issue:** `Admin.jsx` imports `TIER_FEATURES` from `SubscriptionContext`, but it has been renamed to `PLANS`.
- **Solution:** Change the import in `Admin.jsx` to `PLANS`. Map over `Object.values(PLANS)` instead of `Object.keys(TIER_FEATURES)` to populate the user tier select dropdown.

### 2. Stripe Pricing Update
- **Issue:** Maker and Manufacturer plans need their prices updated from $12/$29 to $6/$19.
- **Solution:**
  - Create new Price objects in the Stripe Dashboard using the `browser_subagent`.
  - Update `VITE_STRIPE_PRICE_MAKER` and `VITE_STRIPE_PRICE_MANUFACTURER` in `/web/frontend/.env`.
  - Update `PLANS` object in `SubscriptionContext.jsx` to reflect the new `$6` and `$19` display prices.

### 3. Stripe Checkout Button Fix
- **Issue:** The Upgrade button isn't working.
- **Investigation:**
  - Check the `subscribe` function in `SubscriptionContext.jsx`.
  - Check if the `create-checkout-session` edge function is deployed correctly and configured with Stripe secret keys.
  - Verify that CORS is correctly handled in the edge function.
- **Solution:** Implement error handling, check the network tab, and deploy the fixed edge function if necessary. Ensure the frontend correctly redirects to the URL returned by the Stripe session creation.

## Testing Strategy
- Ensure the Admin page loads and allows tier assignment.
- Verify new Price IDs are correctly set in the environment.
- Use the app to attempt a mock checkout and confirm the Stripe Checkout page loads with the correct $6 or $19 amount.
