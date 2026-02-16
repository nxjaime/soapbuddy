# Sprint 4: Reports & Analytics — Design Doc
**Date:** 2026-02-15
**Sprint:** 4 of 5
**Approach:** Inline analytics embedded into existing pages (no new route)

---

## Overview

Add analytics sections to three existing pages using client-side `useMemo` derivations from already-loaded data. No new DB queries, no new API functions, no new routes. Tier gate: Maker+ for all analytics panels.

---

## Section 1: Product Performance (Recipes page)

### What it shows
A collapsible "Product Performance" panel below the recipe grid containing:

- **Revenue ranking table** — recipes sorted by total revenue generated, showing units sold and total revenue per recipe
- **Profit margin per recipe** — `default_price` minus estimated material cost per unit, shown as $ and %
- **Top Seller badge** — highest-revenue recipe gets a "Top Seller" badge on its recipe card

### Data sources
- `recipes` — already loaded in `Recipes.jsx`
- `salesOrders` — **new parallel fetch** added to `Recipes.jsx` load sequence
- `sales_order_items` — embedded in `getSalesOrders()` response (`order.items`)

### Computation (client-side useMemo)
```
For each recipe:
  units_sold = sum of items.quantity where items.recipe_id === recipe.id
  revenue    = sum of (items.quantity * items.unit_price) for that recipe
  mat_cost   = recipe.total_oils_weight * estimated_cost_per_gram (if available)
  margin     = (default_price - mat_cost) / default_price * 100
```

---

## Section 2: Production Efficiency (Production page)

### What it shows
A collapsible "Efficiency Analytics" panel below the batch list containing:

- **Yield efficiency per batch** — `actual_yield / planned_quantity * 100%` for each completed batch
- **Cost per unit** — ingredient cost from WAC data divided by actual yield
- **Avg yield efficiency** — headline stat across all completed batches
- **Monthly batch volume** — mini bar chart (last 6 months), batches completed per month

### Data sources
- `batches` — already loaded in `Production.jsx`
- `batch_ingredient_usage` — may need to check if returned with batches or requires separate fetch

### Computation (client-side useMemo)
```
For each completed batch:
  yield_efficiency = (yield_quantity / planned_quantity) * 100
  cost_per_unit    = total_ingredient_cost / yield_quantity

avg_efficiency = mean(yield_efficiency) across all completed batches

monthly_counts[month] = count of batches completed in that month (last 6)
```

---

## Section 3: Customer Retention (Customers page)

### What it shows
A "Retention Analytics" summary panel at the top of the Customers page (always visible):

- **Repeat buyer rate** — "X of Y customers ordered more than once" with progress bar
- **Revenue by segment** — Retail vs Wholesale revenue as two stat tiles
- **At-risk customers** — list of customers with ≥1 past order but no orders in last 60 days

### Data sources
- `customers` + `orders` — **already loaded** in `Customers.jsx` from Sprint 3 (zero new fetches)

### Computation (client-side useMemo)
```
repeat_buyers = customers where their orders.length > 1
repeat_rate   = repeat_buyers.length / customers_with_any_order * 100

retail_revenue    = sum of order.total_amount where customer.type === 'Retail'
wholesale_revenue = sum of order.total_amount where customer.type === 'Wholesale'

at_risk = customers where:
  last_order_date < (today - 60 days)
  AND order_count > 0
```

---

## Tier Gating

All three analytics panels are wrapped in a `TierGate` or inline feature check using `hasFeature('salesTracking')` (Maker+). Free tier users see a blurred/locked state with an upgrade prompt.

---

## Files Changed

| File | Change |
|------|--------|
| `pages/Recipes.jsx` | Add `getSalesOrders()` fetch + product performance panel |
| `pages/Production.jsx` | Add efficiency analytics panel |
| `pages/Customers.jsx` | Add retention analytics panel at top |

## Files NOT Changed
- No new routes in `App.jsx`
- No new entries in `Layout.jsx`
- No DB migrations
- No new API functions in `client.js`

---

## Success Criteria

1. Product performance panel on Recipes shows revenue-ranked recipe list
2. Top Seller badge appears on the highest-revenue recipe card
3. Production efficiency panel shows yield % and cost per unit per batch
4. Customer retention panel shows repeat rate, segment split, and at-risk list
5. All panels are hidden/blurred for Free tier
6. Build passes with zero errors
