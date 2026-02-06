import { useEffect, useState } from 'react';
import {
    Calculator as CalcIcon,
    Plus,
    Trash2,
    Beaker,
    Droplets,
    Scale,
    FlaskConical
} from 'lucide-react';
import { getIngredients, calculateLye } from '../api/client';

export default function Calculator() {
    const [ingredients, setIngredients] = useState([]);
    const [selectedOils, setSelectedOils] = useState([]);
    const [settings, setSettings] = useState({
        lye_type: 'NaOH',
        superfat_percentage: 5,
        water_percentage: 33,
        naoh_ratio: 50
    });
    const [results, setResults] = useState(null);
    const [calculating, setCalculating] = useState(false);

    useEffect(() => {
        loadIngredients();
    }, []);

    async function loadIngredients() {
        try {
            const data = await getIngredients({ category: 'Base Oil' });
            // Also get butters
            const butters = await getIngredients({ category: 'Butter' });
            setIngredients([...data, ...butters]);
        } catch (err) {
            console.error('Failed to load ingredients:', err);
        }
    }

    function addOil() {
        setSelectedOils(prev => [...prev, { ingredient_id: '', weight: 100 }]);
    }

    function updateOil(index, field, value) {
        setSelectedOils(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    }

    function removeOil(index) {
        setSelectedOils(prev => prev.filter((_, i) => i !== index));
    }

    function handleSettingChange(e) {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: parseFloat(value) || value }));
    }

    async function handleCalculate() {
        if (selectedOils.length === 0 || selectedOils.every(o => !o.ingredient_id)) {
            alert('Please add at least one oil to calculate.');
            return;
        }

        try {
            setCalculating(true);
            const data = await calculateLye({
                oils: selectedOils
                    .filter(o => o.ingredient_id)
                    .map(o => ({
                        ingredient_id: parseInt(o.ingredient_id),
                        weight: parseFloat(o.weight)
                    })),
                ...settings
            });
            setResults(data);
        } catch (err) {
            console.error('Failed to calculate:', err);
            alert('Failed to calculate: ' + err.message);
        } finally {
            setCalculating(false);
        }
    }

    const getIngredientName = (id) => {
        const ing = ingredients.find(i => i.id === parseInt(id));
        return ing ? ing.name : '';
    };

    const totalOilWeight = selectedOils.reduce((sum, o) => sum + (parseFloat(o.weight) || 0), 0);

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">
                    <Beaker className="icon" />
                    Lye Calculator
                </h1>
            </div>

            <div className="calculator-layout">
                {/* Left: Inputs */}
                <div>
                    {/* Settings Card */}
                    <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
                        <h3 className="card-title" style={{ marginBottom: 'var(--spacing-lg)' }}>
                            Calculator Settings
                        </h3>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Lye Type</label>
                                <select
                                    name="lye_type"
                                    className="form-input form-select"
                                    value={settings.lye_type}
                                    onChange={handleSettingChange}
                                >
                                    <option value="NaOH">Sodium Hydroxide (NaOH) - Bar Soap</option>
                                    <option value="KOH">Potassium Hydroxide (KOH) - Liquid Soap</option>
                                    <option value="Dual">Dual Lye</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Superfat %</label>
                                <input
                                    type="number"
                                    name="superfat_percentage"
                                    className="form-input"
                                    value={settings.superfat_percentage}
                                    onChange={handleSettingChange}
                                    min="0"
                                    max="30"
                                    step="0.5"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Water (% of oils)</label>
                                <input
                                    type="number"
                                    name="water_percentage"
                                    className="form-input"
                                    value={settings.water_percentage}
                                    onChange={handleSettingChange}
                                    min="20"
                                    max="50"
                                    step="1"
                                />
                            </div>
                        </div>
                        {settings.lye_type === 'Dual' && (
                            <div className="form-group">
                                <label className="form-label">NaOH Ratio (% NaOH vs KOH)</label>
                                <input
                                    type="range"
                                    name="naoh_ratio"
                                    className="form-input"
                                    value={settings.naoh_ratio}
                                    onChange={handleSettingChange}
                                    min="0"
                                    max="100"
                                    step="5"
                                    style={{ padding: 0 }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    <span>100% KOH</span>
                                    <span>{settings.naoh_ratio}% NaOH / {100 - settings.naoh_ratio}% KOH</span>
                                    <span>100% NaOH</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Oils Card */}
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                            <h3 className="card-title">
                                <FlaskConical size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                                Oils & Butters
                            </h3>
                            <button className="btn btn-secondary" onClick={addOil}>
                                <Plus size={16} />
                                Add Oil
                            </button>
                        </div>

                        {selectedOils.length === 0 ? (
                            <div className="empty-state" style={{ padding: 'var(--spacing-xl)' }}>
                                <FlaskConical />
                                <h3>No oils added</h3>
                                <p>Add oils to calculate lye amounts.</p>
                                <button className="btn btn-primary" onClick={addOil}>
                                    <Plus size={16} />
                                    Add Your First Oil
                                </button>
                            </div>
                        ) : (
                            <>
                                {selectedOils.map((oil, idx) => (
                                    <div
                                        key={idx}
                                        style={{
                                            display: 'flex',
                                            gap: 'var(--spacing-sm)',
                                            alignItems: 'center',
                                            marginBottom: 'var(--spacing-sm)',
                                            padding: 'var(--spacing-sm)',
                                            background: 'var(--glass-bg)',
                                            borderRadius: 'var(--radius-md)'
                                        }}
                                    >
                                        <select
                                            className="form-input form-select"
                                            style={{ flex: 2 }}
                                            value={oil.ingredient_id}
                                            onChange={(e) => updateOil(idx, 'ingredient_id', e.target.value)}
                                        >
                                            <option value="">Select an oil...</option>
                                            {ingredients.map(ing => (
                                                <option key={ing.id} value={ing.id}>
                                                    {ing.name} {ing.sap_naoh ? `(SAP: ${ing.sap_naoh})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                        <input
                                            type="number"
                                            className="form-input"
                                            style={{ width: '100px' }}
                                            value={oil.weight}
                                            onChange={(e) => updateOil(idx, 'weight', e.target.value)}
                                            placeholder="Weight"
                                        />
                                        <span style={{ color: 'var(--text-muted)', minWidth: '20px' }}>g</span>
                                        <button
                                            className="btn-icon"
                                            style={{ color: 'var(--color-error)' }}
                                            onClick={() => removeOil(idx)}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}

                                <div style={{ marginTop: 'var(--spacing-lg)', paddingTop: 'var(--spacing-md)', borderTop: '1px solid var(--glass-border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-md)' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Total Oils:</span>
                                        <strong>{totalOilWeight}g</strong>
                                    </div>
                                    <button
                                        className="btn btn-primary"
                                        style={{ width: '100%' }}
                                        onClick={handleCalculate}
                                        disabled={calculating}
                                    >
                                        {calculating ? (
                                            <>
                                                <div className="loading-spinner" style={{ width: '16px', height: '16px' }} />
                                                Calculating...
                                            </>
                                        ) : (
                                            <>
                                                <CalcIcon size={18} />
                                                Calculate Lye
                                            </>
                                        )}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Right: Results */}
                <div className="calculator-results">
                    <div className="card" style={{ background: results ? 'var(--gradient-primary)' : undefined }}>
                        <h3 className="card-title" style={{ marginBottom: 'var(--spacing-lg)' }}>
                            <Scale size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                            Results
                        </h3>

                        {!results ? (
                            <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--text-secondary)' }}>
                                <Droplets size={48} style={{ opacity: 0.3, marginBottom: 'var(--spacing-md)' }} />
                                <p>Add oils and click "Calculate Lye" to see results.</p>
                            </div>
                        ) : (
                            <div>
                                <div className="result-item">
                                    <span className="result-label">Total Oils</span>
                                    <span className="result-value">{results.total_oils}g</span>
                                </div>

                                {results.lye_naoh !== null && (
                                    <div className="result-item">
                                        <span className="result-label">Lye (NaOH)</span>
                                        <span className="result-value highlight">{results.lye_naoh}g</span>
                                    </div>
                                )}

                                {results.lye_koh !== null && (
                                    <div className="result-item">
                                        <span className="result-label">Lye (KOH)</span>
                                        <span className="result-value highlight">{results.lye_koh}g</span>
                                    </div>
                                )}

                                <div className="result-item">
                                    <span className="result-label">Water</span>
                                    <span className="result-value">{results.water}g</span>
                                </div>

                                <div className="result-item">
                                    <span className="result-label">Superfat</span>
                                    <span className="result-value">{results.superfat_percentage}%</span>
                                </div>

                                <div className="result-item" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                                    <span className="result-label" style={{ fontWeight: 600 }}>Total Batch Weight</span>
                                    <span className="result-value" style={{ fontSize: '1.5rem' }}>{results.total_batch_weight}g</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {results && (
                        <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
                            <h4 style={{ marginBottom: 'var(--spacing-md)', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                💡 Tips
                            </h4>
                            <ul style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', paddingLeft: 'var(--spacing-lg)' }}>
                                <li style={{ marginBottom: 'var(--spacing-xs)' }}>
                                    Always weigh lye carefully - precision matters!
                                </li>
                                <li style={{ marginBottom: 'var(--spacing-xs)' }}>
                                    Add lye to water, never water to lye.
                                </li>
                                <li>
                                    Use distilled water for best results.
                                </li>
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
