# Sprint 4: Reports & Analytics — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add inline analytics panels to Customers, Recipes, and Production pages using client-side `useMemo` derivations from already-loaded data — no new routes, API calls, or DB migrations.

**Architecture:** Each page loads its existing data; analytics panels derive stats with `useMemo` and render below/above the main content. All panels gated behind `hasFeature('salesTracking')` (Maker+). Build passes zero errors after each task.

**Tech Stack:** React + Vite, Lucide icons, Recharts (already installed from Sprint 2 QualityChart), Supabase via existing `client.js` functions.

---

## Task 1: Customer Retention Panel (Customers.jsx)

**Files:**
- Modify: `web/frontend/src/pages/Customers.jsx`

**Context:**
`Customers.jsx` already loads both `customers` and `orders` (added in Sprint 3). Add a `useSubscription` import and a retention analytics panel at the top of the page, above the search bar. Panel shows three metrics.

**Step 1: Add subscription import**

At the top of `Customers.jsx`, add:
```jsx
import { useSubscription } from '../contexts/SubscriptionContext';
```

Inside the component, add after the existing state declarations:
```jsx
const { hasFeature } = useSubscription();
const canSeeAnalytics = hasFeature('salesTracking');
```

**Step 2: Add the retention useMemo**

Add after the `getCustomerOrders` function (around line 78):
```jsx
const retentionStats = useMemo(() => {
    const customersWithOrders = customers.filter(c => {
        const customerOrders = orders.filter(
            o => o.customer_id === c.id && o.status !== 'Cancelled'
        );
        return customerOrders.length > 0;
    });

    const repeatBuyers = customers.filter(c => {
        const customerOrders = orders.filter(
            o => o.customer_id === c.id && o.status !== 'Cancelled'
        );
        return customerOrders.length > 1;
    });

    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const atRisk = customers.filter(c => {
        const customerOrders = orders.filter(
            o => o.customer_id === c.id && o.status !== 'Cancelled'
        );
        if (customerOrders.length === 0) return false;
        const lastOrder = customerOrders.reduce((latest, o) =>
            new Date(o.sale_date) > new Date(latest.sale_date) ? o : latest
        );
        return new Date(lastOrder.sale_date) < sixtyDaysAgo;
    });

    const retailRevenue = orders
        .filter(o => {
            const c = customers.find(c => c.id === o.customer_id);
            return c && c.customer_type === 'Retail' && o.status !== 'Cancelled';
        })
        .reduce((sum, o) => sum + (o.total_amount || 0), 0);

    const wholesaleRevenue = orders
        .filter(o => {
            const c = customers.find(c => c.id === o.customer_id);
            return c && c.customer_type === 'Wholesale' && o.status !== 'Cancelled';
        })
        .reduce((sum, o) => sum + (o.total_amount || 0), 0);

    return {
        totalWithOrders: customersWithOrders.length,
        repeatBuyers: repeatBuyers.length,
        repeatRate: customersWithOrders.length > 0
            ? (repeatBuyers.length / customersWithOrders.length) * 100
            : 0,
        atRisk,
        retailRevenue,
        wholesaleRevenue
    };
}, [customers, orders]);
```

Also add `useMemo` to the React import line.

**Step 3: Add the retention panel JSX**

In the return block, insert this panel between the `<div className="page-header">` closing tag and the search bar. Only render it when data is loaded and `canSeeAnalytics` is true:

```jsx
{!loading && canSeeAnalytics && customers.length > 0 && (
    <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        {/* Retention Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
            <div className="card" style={{ padding: 'var(--spacing-md)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Repeat Buyers</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{retentionStats.repeatBuyers}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {retentionStats.repeatRate.toFixed(0)}% of buyers
                </div>
                <div style={{ height: '4px', background: 'var(--glass-bg)', borderRadius: '2px', marginTop: '8px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${retentionStats.repeatRate}%`, background: 'var(--color-primary)', borderRadius: '2px' }} />
                </div>
            </div>
            <div className="card" style={{ padding: 'var(--spacing-md)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Retail Revenue</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-success)' }}>
                    ${retentionStats.retailRevenue.toFixed(2)}
                </div>
            </div>
            <div className="card" style={{ padding: 'var(--spacing-md)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Wholesale Revenue</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                    ${retentionStats.wholesaleRevenue.toFixed(2)}
                </div>
            </div>
        </div>

        {/* At-Risk Customers */}
        {retentionStats.atRisk.length > 0 && (
            <div className="card" style={{ padding: 'var(--spacing-md)', borderLeft: '3px solid var(--color-warning)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--spacing-sm)', color: 'var(--color-warning)', fontWeight: 600 }}>
                    <AlertTriangle size={16} />
                    {retentionStats.atRisk.length} customer{retentionStats.atRisk.length > 1 ? 's' : ''} haven't ordered in 60+ days
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {retentionStats.atRisk.map(c => (
                        <span key={c.id} className="badge badge-yellow">{c.name}</span>
                    ))}
                </div>
            </div>
        )}
    </div>
)}
```

Add `AlertTriangle` to the lucide-react import.

**Step 4: Build to verify**
```bash
cd web/frontend && npm run build
```
Expected: `✓ built` with zero errors.

**Step 5: Commit**
```bash
git add web/frontend/src/pages/Customers.jsx
git commit -m "feat(analytics): add customer retention panel to Customers page"
```

---

## Task 2: Product Performance Panel (Recipes.jsx)

**Files:**
- Modify: `web/frontend/src/pages/Recipes.jsx`

**Context:**
`Recipes.jsx` currently loads `recipes` and `ingredients`. We need to also load `salesOrders` for revenue computation. Add a collapsible "Product Performance" panel below the recipe grid. Add a "Top Seller" badge to the highest-revenue recipe card.

**Step 1: Add getSalesOrders to the import**

In `Recipes.jsx`, find the `api/client` import and add `getSalesOrders`:
```jsx
import { ..., getSalesOrders } from '../api/client';
```

**Step 2: Add salesOrders state and fetch**

Add state:
```jsx
const [salesOrders, setSalesOrders] = useState([]);
```

In the `loadData` function, add `getSalesOrders()` to the parallel fetch and set state:
```jsx
const [recipesData, ingredientsData, moldsData, ordersData] = await Promise.all([
    getRecipes(),
    getIngredients(),
    getMolds(),
    getSalesOrders()
]);
// ... existing sets ...
setSalesOrders(ordersData);
```

**Step 3: Add product performance useMemo**

Add after the existing `useMemo` hooks:
```jsx
const productStats = useMemo(() => {
    const statsMap = {};

    salesOrders.forEach(order => {
        if (order.status === 'Cancelled') return;
        (order.items || []).forEach(item => {
            if (!statsMap[item.recipe_id]) {
                statsMap[item.recipe_id] = { units: 0, revenue: 0 };
            }
            statsMap[item.recipe_id].units += item.quantity || 0;
            statsMap[item.recipe_id].revenue += (item.quantity || 0) * (item.unit_price || 0);
        });
    });

    const ranked = recipes
        .map(r => ({
            id: r.id,
            name: r.name,
            units: statsMap[r.id]?.units || 0,
            revenue: statsMap[r.id]?.revenue || 0,
            defaultPrice: r.default_price || 0
        }))
        .filter(r => r.revenue > 0)
        .sort((a, b) => b.revenue - a.revenue);

    const topSellerId = ranked[0]?.id || null;
    return { ranked, topSellerId };
}, [recipes, salesOrders]);
```

**Step 4: Add Top Seller badge to recipe card**

Find the recipe card rendering in the JSX. Locate where the recipe name/title is displayed in the card header. Add the badge next to the recipe name:
```jsx
{productStats.topSellerId === recipe.id && (
    <span className="badge badge-green" style={{ fontSize: '0.7rem', marginLeft: '6px' }}>
        Top Seller
    </span>
)}
```

**Step 5: Add collapsible Product Performance panel**

Add a `showProductStats` state:
```jsx
const [showProductStats, setShowProductStats] = useState(false);
```

Add the panel JSX after the recipe grid (before the resize modal and main modal), gated on `canSeeAnalytics` (or use `meetsMinTier('maker')` from `useSubscription`):

```jsx
{canSeeAnalytics && productStats.ranked.length > 0 && (
    <div className="card" style={{ marginTop: 'var(--spacing-lg)', overflow: 'hidden' }}>
        <div
            style={{ padding: 'var(--spacing-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
            onClick={() => setShowProductStats(prev => !prev)}
        >
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={20} />
                Product Performance
            </h3>
            {showProductStats ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
        {showProductStats && (
            <div style={{ padding: '0 var(--spacing-md) var(--spacing-md)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                        <tr style={{ color: 'var(--text-muted)', textAlign: 'left', borderBottom: '1px solid var(--glass-border)' }}>
                            <th style={{ padding: '8px 0' }}>Product</th>
                            <th style={{ padding: '8px 0' }}>Units Sold</th>
                            <th style={{ padding: '8px 0', textAlign: 'right' }}>Revenue</th>
                        </tr>
                    </thead>
                    <tbody>
                        {productStats.ranked.map((product, idx) => (
                            <tr key={product.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                <td style={{ padding: '10px 0', fontWeight: idx === 0 ? 700 : 400 }}>
                                    {product.name}
                                    {idx === 0 && <span className="badge badge-green" style={{ marginLeft: '8px', fontSize: '0.72rem' }}>Top Seller</span>}
                                </td>
                                <td style={{ padding: '10px 0' }}>{product.units}</td>
                                <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: 600, color: 'var(--color-success)' }}>
                                    ${product.revenue.toFixed(2)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
    </div>
)}
```

Import `TrendingUp`, `ChevronUp`, `ChevronDown` from lucide-react if not already present. Add `useSubscription` import and `const { hasFeature } = useSubscription(); const canSeeAnalytics = hasFeature('salesTracking');` if not already in the file.

**Step 6: Build to verify**
```bash
cd web/frontend && npm run build
```
Expected: `✓ built` with zero errors.

**Step 7: Commit**
```bash
git add web/frontend/src/pages/Recipes.jsx
git commit -m "feat(analytics): add product performance panel and Top Seller badge to Recipes page"
```

---

## Task 3: Production Efficiency Panel (Production.jsx)

**Files:**
- Modify: `web/frontend/src/pages/Production.jsx`

**Context:**
`Production.jsx` already loads `batches`. Each batch has `yield_quantity` (int, actual units produced), `total_cost` (DECIMAL, WAC-based total ingredient cost), `status`, `created_at`, and `recipe.name`. Use these to derive efficiency stats.

**Step 1: Add imports**

Add to React import: `useMemo`
Add to lucide-react import: `TrendingUp`, `ChevronUp`, `ChevronDown` (if not present)
Add: `import { useSubscription } from '../contexts/SubscriptionContext';`

**Step 2: Add subscription check**

Inside component:
```jsx
const { hasFeature } = useSubscription();
const canSeeAnalytics = hasFeature('production');
```

**Step 3: Add efficiency useMemo**

```jsx
const efficiencyStats = useMemo(() => {
    const completedBatches = batches.filter(b => b.status === 'Complete' && b.yield_quantity > 0);

    if (completedBatches.length === 0) return null;

    const batchesWithCost = completedBatches.map(b => ({
        id: b.id,
        name: b.recipe?.name || 'Unknown',
        yield: b.yield_quantity,
        cost: b.total_cost || 0,
        costPerUnit: b.total_cost && b.yield_quantity > 0
            ? (b.total_cost / b.yield_quantity)
            : 0,
        month: new Date(b.created_at).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    }));

    const avgCostPerUnit = batchesWithCost.length > 0
        ? batchesWithCost.reduce((sum, b) => sum + b.costPerUnit, 0) / batchesWithCost.length
        : 0;

    const totalUnitsProduced = completedBatches.reduce((sum, b) => sum + b.yield_quantity, 0);

    // Monthly production volumes (last 6 months)
    const now = new Date();
    const monthlyVolume = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleDateString('en-US', { month: 'short' });
        const units = completedBatches
            .filter(b => {
                const bd = new Date(b.created_at);
                return `${bd.getFullYear()}-${String(bd.getMonth() + 1).padStart(2, '0')}` === key;
            })
            .reduce((sum, b) => sum + b.yield_quantity, 0);
        monthlyVolume.push({ label, units });
    }

    const maxVolume = Math.max(...monthlyVolume.map(m => m.units), 1);

    return { batchesWithCost, avgCostPerUnit, totalUnitsProduced, monthlyVolume, maxVolume };
}, [batches]);
```

**Step 4: Add showEfficiency state**

```jsx
const [showEfficiency, setShowEfficiency] = useState(false);
```

**Step 5: Add panel JSX**

Add after the batch list (after the closing `</div>` of the main batch list) and before the modal:
```jsx
{canSeeAnalytics && efficiencyStats && (
    <div className="card" style={{ marginTop: 'var(--spacing-lg)', overflow: 'hidden' }}>
        <div
            style={{ padding: 'var(--spacing-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
            onClick={() => setShowEfficiency(prev => !prev)}
        >
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={20} />
                Production Efficiency
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-lg)' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {efficiencyStats.totalUnitsProduced} units produced · avg ${efficiencyStats.avgCostPerUnit.toFixed(2)}/unit
                </span>
                {showEfficiency ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
        </div>
        {showEfficiency && (
            <div style={{ padding: '0 var(--spacing-md) var(--spacing-md)' }}>
                {/* Monthly volume mini chart */}
                <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-sm)' }}>
                    Monthly Production Volume (units)
                </h4>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)', height: '80px', alignItems: 'flex-end', marginBottom: 'var(--spacing-lg)' }}>
                    {efficiencyStats.monthlyVolume.map((month, idx) => (
                        <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                            <div style={{
                                width: '100%',
                                height: `${(month.units / efficiencyStats.maxVolume) * 60}px`,
                                background: 'linear-gradient(180deg, var(--color-primary), var(--color-secondary))',
                                borderRadius: '4px 4px 0 0',
                                minHeight: month.units > 0 ? '4px' : '0'
                            }} title={`${month.units} units`} />
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{month.label}</div>
                        </div>
                    ))}
                </div>

                {/* Per-batch cost table */}
                <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-sm)' }}>
                    Cost Per Unit by Batch
                </h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                        <tr style={{ color: 'var(--text-muted)', textAlign: 'left', borderBottom: '1px solid var(--glass-border)' }}>
                            <th style={{ padding: '8px 0' }}>Recipe</th>
                            <th style={{ padding: '8px 0' }}>Units</th>
                            <th style={{ padding: '8px 0', textAlign: 'right' }}>Total Cost</th>
                            <th style={{ padding: '8px 0', textAlign: 'right' }}>Cost/Unit</th>
                        </tr>
                    </thead>
                    <tbody>
                        {efficiencyStats.batchesWithCost.slice(0, 10).map(b => (
                            <tr key={b.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                <td style={{ padding: '8px 0' }}>{b.name}</td>
                                <td style={{ padding: '8px 0' }}>{b.yield}</td>
                                <td style={{ padding: '8px 0', textAlign: 'right' }}>${b.cost.toFixed(2)}</td>
                                <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 600, color: b.costPerUnit > efficiencyStats.avgCostPerUnit ? 'var(--color-error)' : 'var(--color-success)' }}>
                                    ${b.costPerUnit.toFixed(2)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div style={{ marginTop: 'var(--spacing-sm)', fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                    Cost/unit highlighted red when above average (${efficiencyStats.avgCostPerUnit.toFixed(2)})
                </div>
            </div>
        )}
    </div>
)}
```

**Step 6: Build to verify**
```bash
cd web/frontend && npm run build
```
Expected: `✓ built` with zero errors.

**Step 7: Commit**
```bash
git add web/frontend/src/pages/Production.jsx
git commit -m "feat(analytics): add production efficiency panel to Production page"
```

---

## Task 4: Sprint Wrap-up

**Step 1: Final build**
```bash
cd web/frontend && npm run build
```

**Step 2: Push to remote**
```bash
git push origin main
```

**Step 3: Update EXECUTION_JOURNAL.md**

Append a Sprint 4 section at the bottom of `EXECUTION_JOURNAL.md` following the established format (see prior sprint entries).

**Step 4: Append to NotebookLM**

Use the NotebookLM MCP tool to append a sprint summary to notebook `939e9f4e-387c-4429-86a9-25f47dd8f591`.

**Step 5: Update MEMORY.md**

Change `Sprint 4 (Reports & Analytics): pending` → `Sprint 4 (Reports & Analytics): ✅ complete — commit <hash>`.
