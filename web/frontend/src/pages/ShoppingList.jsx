import { useEffect, useState } from 'react';
import { ShoppingCart, Printer, RefreshCw, Package } from 'lucide-react';
import { supabase } from '../lib/supabase';

/**
 * ShoppingList page
 *
 * Aggregates all "Planned" production batches, sums the ingredient
 * quantities required by their recipes, then subtracts what is
 * already on hand.  Only ingredients with a deficit (need > stock)
 * are shown.
 */
export default function ShoppingList() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [batchNames, setBatchNames] = useState([]);

    useEffect(() => {
        loadShoppingList();
    }, []);

    async function loadShoppingList() {
        setLoading(true);
        try {
            // Fetch all planned batches with their recipe ingredients
            const { data: batches, error } = await supabase
                .from('production_batches')
                .select(`
                    id,
                    lot_number,
                    planned_quantity,
                    recipe:recipes(
                        id,
                        name,
                        batch_size,
                        ingredients:recipe_ingredients(
                            quantity,
                            unit,
                            ingredient:ingredients(
                                id, name, unit, quantity_on_hand, cost_per_unit, supplier
                            )
                        )
                    )
                `)
                .eq('status', 'Planned');

            if (error) throw error;

            setBatchNames((batches || []).map(b => b.lot_number || `Batch ${b.id.slice(0, 8)}`));

            // Aggregate required quantities per ingredient
            const required = {}; // { ingredient_id: { ...ingredient, needed: number } }

            for (const batch of batches || []) {
                const recipe = batch.recipe;
                if (!recipe) continue;

                // Scale factor: how many times is the recipe being made?
                const scaleFactor = batch.planned_quantity && recipe.batch_size
                    ? batch.planned_quantity / recipe.batch_size
                    : 1;

                for (const ri of recipe.ingredients || []) {
                    const ing = ri.ingredient;
                    if (!ing) continue;

                    const needed = (ri.quantity || 0) * scaleFactor;

                    if (!required[ing.id]) {
                        required[ing.id] = {
                            id: ing.id,
                            name: ing.name,
                            unit: ing.unit,
                            on_hand: ing.quantity_on_hand || 0,
                            cost_per_unit: ing.cost_per_unit || 0,
                            supplier: ing.supplier || '—',
                            needed: 0
                        };
                    }
                    required[ing.id].needed += needed;
                }
            }

            // Only keep items where we need more than we have
            const deficits = Object.values(required)
                .map(item => ({
                    ...item,
                    deficit: Math.max(0, item.needed - item.on_hand),
                    estimated_cost: Math.max(0, item.needed - item.on_hand) * item.cost_per_unit
                }))
                .filter(item => item.deficit > 0)
                .sort((a, b) => a.name.localeCompare(b.name));

            setItems(deficits);
        } catch (err) {
            console.error('Failed to load shopping list:', err);
        } finally {
            setLoading(false);
        }
    }

    const totalCost = items.reduce((sum, i) => sum + i.estimated_cost, 0);

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">
                    <ShoppingCart className="icon" />
                    Shopping List
                </h1>
                <div className="flex-responsive">
                    <button className="btn btn-secondary" onClick={loadShoppingList}>
                        <RefreshCw size={18} />
                        Refresh
                    </button>
                    <button className="btn btn-secondary" onClick={() => window.print()}>
                        <Printer size={18} />
                        Print
                    </button>
                </div>
            </div>

            {batchNames.length > 0 && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 'var(--spacing-lg)' }}>
                    Based on <strong>{batchNames.length}</strong> planned batch{batchNames.length !== 1 ? 'es' : ''}:&nbsp;
                    {batchNames.join(', ')}
                </p>
            )}

            {loading ? (
                <div className="empty-state"><div className="loading-spinner" /></div>
            ) : items.length === 0 ? (
                <div className="empty-state">
                    <Package />
                    <h3>Nothing to buy</h3>
                    <p>
                        {batchNames.length === 0
                            ? 'No batches are currently in "Planned" status.'
                            : 'All ingredients for your planned batches are already in stock.'}
                    </p>
                </div>
            ) : (
                <>
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Ingredient</th>
                                    <th>Supplier</th>
                                    <th className="hide-on-mobile">On Hand</th>
                                    <th className="hide-on-mobile">Total Needed</th>
                                    <th>To Buy</th>
                                    <th>Est. Cost</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map(item => (
                                    <tr key={item.id}>
                                        <td><strong>{item.name}</strong></td>
                                        <td>{item.supplier}</td>
                                        <td className="hide-on-mobile">
                                            {item.on_hand.toFixed(1)} {item.unit}
                                        </td>
                                        <td className="hide-on-mobile">
                                            {item.needed.toFixed(1)} {item.unit}
                                        </td>
                                        <td>
                                            <strong style={{ color: 'var(--color-error)' }}>
                                                {item.deficit.toFixed(1)} {item.unit}
                                            </strong>
                                        </td>
                                        <td>
                                            {item.cost_per_unit > 0
                                                ? `$${item.estimated_cost.toFixed(2)}`
                                                : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            {totalCost > 0 && (
                                <tfoot>
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'right', fontWeight: 600 }}>
                                            Estimated Total
                                        </td>
                                        <td style={{ fontWeight: 700 }}>${totalCost.toFixed(2)}</td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}
