import { useState } from 'react';
import { Printer, ChevronLeft } from 'lucide-react';

export default function PrintRecipe() {
    const [recipeData] = useState(() => {
        const storedData = sessionStorage.getItem('print_recipe_data');
        return storedData ? JSON.parse(storedData) : null;
    });

    if (!recipeData) {
        return (
            <div style={{ padding: 'var(--spacing-xl)', textAlign: 'center' }}>
                <p>No recipe data found to print.</p>
                <button className="btn btn-primary" onClick={() => window.close()}>Close Window</button>
            </div>
        );
    }

    const isRecipeMode = !!recipeData.recipe;

    if (isRecipeMode) {
        const { recipe } = recipeData;
        return (
            <div className="print-view" style={{
                background: 'white',
                color: '#333',
                minHeight: '100vh',
                padding: '40px',
                fontFamily: "'Inter', sans-serif"
            }}>
                {/* Header controls (hidden on print) */}
                <div className="no-print" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '40px',
                    borderBottom: '1px solid #eee',
                    paddingBottom: '20px'
                }}>
                    <button className="btn btn-secondary" onClick={() => window.close()}>
                        <ChevronLeft size={16} /> Back
                    </button>
                    <button className="btn btn-primary" onClick={() => window.print()}>
                        <Printer size={16} /> Print Recipe
                    </button>
                </div>

                <div style={{ maxWidth: '900px', margin: '0 auto', border: '1px solid #000', padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #000', paddingBottom: '10px' }}>
                        <h1 style={{ margin: 0, fontSize: '24px' }}>{recipe.name}</h1>
                        <span style={{ fontSize: '14px' }}>{new Date().toLocaleDateString()}</span>
                    </div>

                    {recipe.description && (
                        <p style={{ marginBottom: '20px', color: '#555', fontSize: '14px' }}>{recipe.description}</p>
                    )}

                    {/* Settings */}
                    <table style={{ width: '50%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '20px' }}>
                        <tbody>
                            <tr style={{ background: '#f8f8f8' }}>
                                <td style={{ padding: '4px', border: '1px solid #ddd', fontWeight: 700 }}>Lye Type</td>
                                <td style={{ padding: '4px', border: '1px solid #ddd', textAlign: 'right' }}>{recipe.lye_type}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '4px', border: '1px solid #ddd', fontWeight: 700 }}>Superfat</td>
                                <td style={{ padding: '4px', border: '1px solid #ddd', textAlign: 'right' }}>{recipe.superfat_percentage}%</td>
                            </tr>
                            <tr style={{ background: '#f8f8f8' }}>
                                <td style={{ padding: '4px', border: '1px solid #ddd', fontWeight: 700 }}>Water</td>
                                <td style={{ padding: '4px', border: '1px solid #ddd', textAlign: 'right' }}>{recipe.water_percentage}%</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '4px', border: '1px solid #ddd', fontWeight: 700 }}>Total Oils</td>
                                <td style={{ padding: '4px', border: '1px solid #ddd', textAlign: 'right' }}>{recipe.total_oils_weight} {recipe.unit}</td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Ingredients */}
                    <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>Ingredients</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
                        <thead>
                            <tr style={{ background: '#334155', color: 'white' }}>
                                <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #333' }}>#</th>
                                <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #333' }}>Ingredient</th>
                                <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #333' }}>Quantity</th>
                                <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #333' }}>Unit</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(recipe.ingredients || []).map((ing, idx) => (
                                <tr key={idx} style={{ background: idx % 2 === 0 ? '#f8f8f8' : 'white' }}>
                                    <td style={{ padding: '6px', border: '1px solid #ddd' }}>{idx + 1}</td>
                                    <td style={{ padding: '6px', border: '1px solid #ddd', fontWeight: 600 }}>{ing.name}</td>
                                    <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'center' }}>{ing.quantity}</td>
                                    <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'center' }}>{ing.unit}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {recipe.notes && (
                        <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                            <h3 style={{ fontSize: '14px', marginBottom: '8px', color: '#475569' }}>Notes</h3>
                            <p style={{ fontSize: '13px', color: '#555', margin: 0 }}>{recipe.notes}</p>
                        </div>
                    )}

                    <div style={{ marginTop: '40px', fontSize: '12px', color: '#666', fontStyle: 'italic', textAlign: 'center' }}>
                        Generated by SoapBuddy — Professional Soap Management Solution
                    </div>
                </div>

                <style>{`
                    @media print {
                        .no-print { display: none !important; }
                        body { background: white !important; padding: 0 !important; }
                        .print-view { padding: 0 !important; }
                    }
                `}</style>
            </div>
        );
    }

    const { results, recipeOils, settings } = recipeData;

    // Helper for weight conversion
    const convert = (grams) => {
        return {
            grams: Math.round(grams * 100) / 100,
            ounces: Math.round((grams / 28.3495) * 100) / 100,
            pounds: Math.round((grams / 453.592) * 1000) / 1000
        };
    };

    const water = convert(results.water);
    const lye = convert(settings.lye_type === 'NaOH' ? results.lye_naoh : results.lye_koh);
    const oilsTotal = convert(results.total_oils);
    const fragrance = convert(results.fragrance);
    const totalBatch = convert(results.total_batch_weight);

    return (
        <div className="print-view" style={{
            background: 'white',
            color: '#333',
            minHeight: '100vh',
            padding: '40px',
            fontFamily: "'Inter', sans-serif"
        }}>
            {/* Header controls (hidden on print) */}
            <div className="no-print" style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '40px',
                borderBottom: '1px solid #eee',
                paddingBottom: '20px'
            }}>
                <button className="btn btn-secondary" onClick={() => window.close()}>
                    <ChevronLeft size={16} /> Back to Calculator
                </button>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn btn-primary" onClick={() => window.print()}>
                        <Printer size={16} /> Print Recipe
                    </button>
                </div>
            </div>

            <div style={{ maxWidth: '900px', margin: '0 auto', border: '1px solid #000', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #000', paddingBottom: '10px' }}>
                    <h1 style={{ margin: 0, fontSize: '24px' }}>SoapBuddy Recipe Report</h1>
                    <span style={{ fontSize: '14px' }}>{new Date().toLocaleDateString()}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                    {/* Settings Table */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                        <tbody>
                            <tr style={{ background: '#f8f8f8' }}>
                                <td style={{ padding: '4px', border: '1px solid #ddd', fontWeight: 700 }}>Total Oil Weight</td>
                                <td style={{ padding: '4px', border: '1px solid #ddd', textAlign: 'right' }}>{settings.total_oil_weight} {settings.weight_unit}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '4px', border: '1px solid #ddd', fontWeight: 700 }}>Water as % of Oils</td>
                                <td style={{ padding: '4px', border: '1px solid #ddd', textAlign: 'right' }}>{settings.water_method === 'percentage' ? `${settings.water_value}%` : 'N/A'}</td>
                            </tr>
                            <tr style={{ background: '#f8f8f8' }}>
                                <td style={{ padding: '4px', border: '1px solid #ddd', fontWeight: 700 }}>Super Fat</td>
                                <td style={{ padding: '4px', border: '1px solid #ddd', textAlign: 'right' }}>{results.superfat_percentage}%</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '4px', border: '1px solid #ddd', fontWeight: 700 }}>Lye Type</td>
                                <td style={{ padding: '4px', border: '1px solid #ddd', textAlign: 'right' }}>{settings.lye_type}</td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Quality Table */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                        <thead>
                            <tr style={{ background: '#eee' }}>
                                <th style={{ padding: '4px', border: '1px solid #ddd', textAlign: 'left' }}>Soap Quality</th>
                                <th style={{ padding: '4px', border: '1px solid #ddd', textAlign: 'center' }}>Value</th>
                                <th style={{ padding: '4px', border: '1px solid #ddd', textAlign: 'center' }}>Range</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(results.qualities).map(([key, val], i) => (
                                <tr key={key} style={{ background: i % 2 === 0 ? '#f8f8f8' : 'white' }}>
                                    <td style={{ padding: '4px', border: '1px solid #ddd', textTransform: 'capitalize' }}>{key}</td>
                                    <td style={{ padding: '4px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 700 }}>{val}</td>
                                    <td style={{ padding: '4px', border: '1px solid #ddd', textAlign: 'center', color: '#666' }}>
                                        {key === 'hardness' ? '29 - 54' :
                                            key === 'cleansing' ? '12 - 22' :
                                                key === 'conditioning' ? '44 - 69' :
                                                    key === 'bubbly' ? '14 - 33' :
                                                        key === 'creamy' ? '16 - 35' :
                                                            key === 'iodine' ? '41 - 70' :
                                                                key === 'ins' ? '136 - 165' : ''}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Main Recipe Totals Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
                    <thead>
                        <tr style={{ background: '#334155', color: 'white' }}>
                            <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #333' }}>Component</th>
                            <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #333' }}>Pounds</th>
                            <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #333' }}>Ounces</th>
                            <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #333' }}>Grams</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ padding: '6px', border: '1px solid #ddd', fontWeight: 700 }}>Water</td>
                            <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'center' }}>{water.pounds}</td>
                            <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'center' }}>{water.ounces}</td>
                            <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'center' }}>{water.grams}</td>
                        </tr>
                        <tr>
                            <td style={{ padding: '6px', border: '1px solid #ddd', fontWeight: 700 }}>Lye - {settings.lye_type}</td>
                            <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'center' }}>{lye.pounds}</td>
                            <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'center' }}>{lye.ounces}</td>
                            <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'center' }}>{lye.grams}</td>
                        </tr>
                        <tr style={{ background: '#f8f8f8' }}>
                            <td style={{ padding: '6px', border: '1px solid #ddd', fontWeight: 700 }}>Oils Total</td>
                            <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'center' }}>{oilsTotal.pounds}</td>
                            <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'center' }}>{oilsTotal.ounces}</td>
                            <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'center' }}>{oilsTotal.grams}</td>
                        </tr>
                        <tr>
                            <td style={{ padding: '6px', border: '1px solid #ddd', fontWeight: 700 }}>Fragrance</td>
                            <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'center' }}>{fragrance.pounds}</td>
                            <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'center' }}>{fragrance.ounces}</td>
                            <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'center' }}>{fragrance.grams}</td>
                        </tr>
                        <tr style={{ borderTop: '2px solid #333', background: '#eee', fontWeight: 800 }}>
                            <td style={{ padding: '8px', border: '1px solid #333' }}>TOTAL BATCH</td>
                            <td style={{ padding: '8px', border: '1px solid #333', textAlign: 'center' }}>{totalBatch.pounds}</td>
                            <td style={{ padding: '8px', border: '1px solid #333', textAlign: 'center' }}>{totalBatch.ounces}</td>
                            <td style={{ padding: '8px', border: '1px solid #333', textAlign: 'center' }}>{totalBatch.grams}</td>
                        </tr>
                    </tbody>
                </table>

                {/* Oil Details List */}
                <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>Oil / Fat Details</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
                    <thead>
                        <tr style={{ background: '#eee' }}>
                            <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>#</th>
                            <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Oil / Fat</th>
                            <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd' }}>%</th>
                            <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd' }}>Pounds</th>
                            <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd' }}>Ounces</th>
                            <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd' }}>Grams</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recipeOils.map((oil, idx) => {
                            const c = convert(oil.weight);
                            return (
                                <tr key={idx}>
                                    <td style={{ padding: '6px', border: '1px solid #ddd' }}>{idx + 1}</td>
                                    <td style={{ padding: '6px', border: '1px solid #ddd', fontWeight: 600 }}>{oil.name}</td>
                                    <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'center' }}>{oil.percentage.toFixed(1)}%</td>
                                    <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'center' }}>{c.pounds}</td>
                                    <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'center' }}>{c.ounces}</td>
                                    <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'center' }}>{c.grams}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {/* Fatty Acids */}
                <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '14px', marginBottom: '10px', color: '#475569' }}>Fatty Acid Profile</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                        {Object.entries(results.fattyAcids).map(([key, val]) => (
                            <div key={key} style={{ fontSize: '12px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee' }}>
                                <span style={{ textTransform: 'capitalize' }}>{key}:</span>
                                <strong>{val}%</strong>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ marginTop: '40px', fontSize: '12px', color: '#666', fontStyle: 'italic', textAlign: 'center' }}>
                    Generated by SoapBuddy - Professional Soap Management Solution
                </div>
            </div>

            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; padding: 0 !important; }
                    .print-view { padding: 0 !important; }
                }
            `}</style>
        </div>
    );
}
