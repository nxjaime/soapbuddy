import { useEffect, useState } from 'react';
import {
    Calculator as CalcIcon,
    Plus,
    Trash2,
    Beaker,
    Droplets,
    Scale,
    FlaskConical,
    Settings,
    Thermometer,
    Wind,
    Info,
    ChevronRight,
    Search,
    Download,
    Printer,
    RefreshCcw,
    Zap,
    X,
    BookOpen
} from 'lucide-react';
import { getIngredients, calculateLye, getFormulations, createFormulation } from '../api/client';
import { OIL_LIBRARY } from '../data/minimizedOilLibrary';

export default function FormulaDesigner() {
    const [ingredients, setIngredients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [recipeOils, setRecipeOils] = useState([]);
    const [settings, setSettings] = useState({
        lye_type: 'NaOH',
        koh_purity_90: true,
        weight_unit: 'g',
        total_oil_weight: 1000,
        water_method: 'percentage', // percentage, ratio, concentration
        water_value: 33,
        superfat_percentage: 5,
        fragrance_ratio: 0.03, // 0.03 = 3%
        fragrance_unit: 'oz/lb' // or 'percentage'
    });
    const [results, setResults] = useState(null);
    const [calculating, setCalculating] = useState(false);
    const [activeTab, setActiveTab] = useState('recipe'); // recipe, qualities, fatty-acids

    useEffect(() => {
        loadIngredients();
    }, []);

    useEffect(() => {
        const stored = sessionStorage.getItem('load_formulation');
        if (stored) {
            try {
                const formulation = JSON.parse(stored);
                sessionStorage.removeItem('load_formulation');
                const oils = (formulation.oils || []).map(oil => ({
                    ingredient_id: oil.ingredient_id,
                    name: oil.name,
                    percentage: oil.percentage,
                    weight: (oil.percentage / 100) * settings.total_oil_weight
                }));
                setRecipeOils(oils);
            } catch (err) {
                console.error('Failed to load formulation:', err);
            }
        }
    }, []);

    async function loadIngredients() {
        try {
            const data = await getIngredients({ category: 'Base Oil' });
            const butters = await getIngredients({ category: 'Butter' });

            // Map library oils to a consistent format
            const masterLibrary = OIL_LIBRARY.map(oil => ({
                id: oil.id,
                name: oil.name,
                sap_naoh: oil.sap,
                is_library: true
            }));

            setIngredients([...masterLibrary, ...data, ...butters]);
        } catch (err) {
            console.error('Failed to load ingredients:', err);
        }
    }

    const filteredIngredients = ingredients.filter(ing =>
        ing.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    function addOilToRecipe(ing) {
        if (recipeOils.find(o => o.ingredient_id === ing.id)) return;

        const newOil = {
            ingredient_id: ing.id,
            name: ing.name,
            percentage: 0,
            weight: 0
        };
        setRecipeOils(prev => [...prev, newOil]);
    }

    function updateOil(index, field, value) {
        setRecipeOils(prev => {
            const updated = [...prev];
            const oil = { ...updated[index], [field]: parseFloat(value) || 0 };

            // If weight changes, update percentage based on total weight
            if (field === 'weight') {
                oil.percentage = settings.total_oil_weight > 0 ? (oil.weight / settings.total_oil_weight) * 100 : 0;
            }
            // If percentage changes, update weight based on total weight
            if (field === 'percentage') {
                oil.weight = (oil.percentage / 100) * settings.total_oil_weight;
            }

            updated[index] = oil;
            return updated;
        });
    }

    function removeOil(index) {
        setRecipeOils(prev => prev.filter((_, i) => i !== index));
    }

    function handleSettingChange(e) {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : (type === 'number' || name === 'water_value' ? parseFloat(value) : value);

        setSettings(prev => {
            const newSettings = { ...prev, [name]: val };

            // If total weight changes, update all oil weights based on their percentages
            if (name === 'total_oil_weight') {
                setRecipeOils(oils => oils.map(o => ({
                    ...o,
                    weight: (o.percentage / 100) * val
                })));
            }

            return newSettings;
        });
    }

    async function handleCalculate() {
        if (recipeOils.length === 0) {
            alert('Please add at least one oil to calculate.');
            return;
        }

        try {
            setCalculating(true);
            const data = await calculateLye({
                oils: recipeOils.map(o => ({
                    ingredient_id: o.ingredient_id,
                    weight: o.weight
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

    function handlePrint() {
        if (!results) return;
        sessionStorage.setItem('print_recipe_data', JSON.stringify({
            results,
            recipeOils,
            settings
        }));
        window.open('/formula-designer/print', '_blank', 'width=1000,height=800');
    }

    async function loadFormulationsForPicker() {
        try {
            const data = await getFormulations();
            setFormulations(data);
        } catch (err) {
            console.error('Failed to load formulations:', err);
        }
    }

    function openSaveModal() {
        setSaveFormData({ name: '', description: '' });
        setIsSaveModalOpen(true);
    }

    function closeSaveModal() {
        setIsSaveModalOpen(false);
    }

    async function handleSaveFormula(e) {
        e.preventDefault();
        if (!saveFormData.name.trim()) return;
        if (recipeOils.length === 0) {
            alert('Add at least one oil before saving a formulation.');
            return;
        }
        try {
            setIsSavingFormula(true);
            const oils = recipeOils.map(o => ({
                ingredient_id: o.ingredient_id,
                name: o.name,
                percentage: o.percentage
            }));
            await createFormulation({
                name: saveFormData.name.trim(),
                description: saveFormData.description.trim(),
                oils
            });
            closeSaveModal();
            alert(`Formulation "${saveFormData.name}" saved! View it in the Formulations Library.`);
        } catch (err) {
            console.error('Failed to save formulation:', err);
            alert('Failed to save: ' + err.message);
        } finally {
            setIsSavingFormula(false);
        }
    }

    async function openLoadModal() {
        await loadFormulationsForPicker();
        setIsLoadModalOpen(true);
    }

    function closeLoadModal() {
        setIsLoadModalOpen(false);
    }

    function handleLoadFormulation(formulation) {
        const oils = (formulation.oils || []).map(oil => ({
            ingredient_id: oil.ingredient_id,
            name: oil.name,
            percentage: oil.percentage,
            weight: (oil.percentage / 100) * settings.total_oil_weight
        }));
        setRecipeOils(oils);
        closeLoadModal();
    }

    const totalPercentage = recipeOils.reduce((sum, o) => sum + (o.percentage || 0), 0);
    const totalWeight = recipeOils.reduce((sum, o) => sum + (o.weight || 0), 0);

    const qualityRanges = {
        hardness: [29, 54],
        cleansing: [12, 22],
        conditioning: [44, 69],
        bubbly: [14, 33],
        creamy: [16, 35],
        iodine: [41, 70],
        ins: [136, 165]
    };

    const [showRecipeModal, setShowRecipeModal] = useState(false);
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
    const [formulations, setFormulations] = useState([]);
    const [saveFormData, setSaveFormData] = useState({ name: '', description: '' });
    const [isSavingFormula, setIsSavingFormula] = useState(false);

    return (
        <div className="calculator-container">
            <div className="page-header">
                <h1 className="page-title">
                    <Beaker className="icon" />
                    Formula Designer
                </h1>
                <div className="flex-responsive">
                    <button className="btn btn-secondary" onClick={() => {
                        setRecipeOils([]);
                        setResults(null);
                    }}>
                        <RefreshCcw size={16} /> <span className="hide-on-mobile">Reset</span>
                    </button>
                    {results && (
                        <button className="btn btn-secondary" onClick={() => setShowRecipeModal(true)}>
                            <BookOpen size={16} /> <span className="hide-on-mobile">View</span>
                        </button>
                    )}
                    <button className="btn btn-secondary" onClick={openLoadModal}>
                        <BookOpen size={16} /> <span className="hide-on-mobile">Load</span>
                    </button>
                    <button className="btn btn-primary" onClick={handleCalculate} disabled={calculating}>
                        <Zap size={16} /> {calculating ? '...' : 'Calculate'}
                    </button>
                </div>
            </div>

            <div className="calc-grid">
                {/* 1. Lye Type */}
                <div className="calc-section section1">
                    <h3 className="calc-section-title"><FlaskConical size={14} /> 1. Lye Type</h3>
                    <div className="form-group" style={{ marginBottom: 'var(--spacing-sm)' }}>
                        <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xs)' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', cursor: 'pointer' }}>
                                <input
                                    type="radio"
                                    name="lye_type"
                                    value="NaOH"
                                    checked={settings.lye_type === 'NaOH'}
                                    onChange={handleSettingChange}
                                />
                                <span>NaOH</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', cursor: 'pointer' }}>
                                <input
                                    type="radio"
                                    name="lye_type"
                                    value="KOH"
                                    checked={settings.lye_type === 'KOH'}
                                    onChange={handleSettingChange}
                                />
                                <span>KOH</span>
                            </label>
                        </div>
                        {settings.lye_type === 'KOH' && (
                            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', cursor: 'pointer', fontSize: '0.75rem', opacity: 0.8 }}>
                                <input
                                    type="checkbox"
                                    name="koh_purity_90"
                                    checked={settings.koh_purity_90}
                                    onChange={handleSettingChange}
                                />
                                <span>KOH is 90% purity</span>
                            </label>
                        )}
                    </div>
                </div>

                {/* 2. Weight of Oils */}
                <div className="calc-section section2">
                    <h3 className="calc-section-title"><Scale size={14} /> 2. Weight of Oils</h3>
                    <div className="form-row" style={{ gridTemplateColumns: '1fr 2fr' }}>
                        <div className="form-group">
                            <label className="form-label">Unit</label>
                            <select name="weight_unit" className="form-input form-select" value={settings.weight_unit} onChange={handleSettingChange}>
                                <option value="g">Grams</option>
                                <option value="oz">Ounces</option>
                                <option value="lb">Pounds</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Total Weight</label>
                            <input
                                type="number"
                                name="total_oil_weight"
                                className="form-input"
                                value={settings.total_oil_weight}
                                onChange={handleSettingChange}
                            />
                        </div>
                    </div>
                </div>

                {/* 3. Water */}
                <div className="calc-section section3">
                    <h3 className="calc-section-title"><Droplets size={14} /> 3. Water</h3>
                    <div className="form-group">
                        <select name="water_method" className="form-input form-select" value={settings.water_method} onChange={handleSettingChange} style={{ marginBottom: 'var(--spacing-xs)' }}>
                            <option value="percentage">Water as % of Oils</option>
                            <option value="concentration">Lye Concentration %</option>
                            <option value="ratio">Water : Lye Ratio</option>
                        </select>
                        <input
                            type="number"
                            name="water_value"
                            className="form-input"
                            value={settings.water_value}
                            onChange={handleSettingChange}
                            step={settings.water_method === 'ratio' ? 0.1 : 1}
                        />
                    </div>
                </div>

                {/* 4. Super Fat & Fragrance */}
                <div className="calc-section section4">
                    <h3 className="calc-section-title"><Settings size={14} /> 4. Additives</h3>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Super Fat %</label>
                            <input type="number" name="superfat_percentage" className="form-input" value={settings.superfat_percentage} onChange={handleSettingChange} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Fragrance Ratio</label>
                            <input type="number" name="fragrance_ratio" className="form-input" value={settings.fragrance_ratio} step="0.001" onChange={handleSettingChange} />
                            <span style={{ fontSize: '0.65rem', opacity: 0.6 }}>oz/lb or g/g</span>
                        </div>
                    </div>
                </div>

                {/* 5. Results & Qualities */}
                <div className="calc-section section5">
                    <h3 className="calc-section-title"><Wind size={14} /> 5. Soap Qualities</h3>

                    {!results ? (
                        <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', opacity: 0.5 }}>
                            <Info size={32} style={{ marginBottom: 'var(--spacing-sm)' }} />
                            <p style={{ fontSize: '0.875rem' }}>Calculate to see quality indicators.</p>
                        </div>
                    ) : (
                        <div className="qualities-list">
                            {Object.entries(results.qualities).map(([key, value]) => {
                                const range = qualityRanges[key] || [0, 100];
                                const isGood = value >= range[0] && value <= range[1];
                                return (
                                    <div key={key} className="quality-item">
                                        <div className="quality-header">
                                            <span style={{ textTransform: 'capitalize' }}>{key}</span>
                                            <span style={{ fontWeight: 700, color: isGood ? 'var(--color-success)' : 'var(--color-warning)' }}>{value}</span>
                                        </div>
                                        <div className="quality-bar-bg">
                                            <div className="quality-bar-fill" style={{ width: `${Math.min(value, 100)}%` }} />
                                        </div>
                                        <div className="quality-range">
                                            <span>Range: {range[0]} - {range[1]}</span>
                                        </div>
                                    </div>
                                );
                            })}

                            <div style={{ marginTop: 'var(--spacing-lg)', pt: 'var(--spacing-sm)', borderTop: '1px solid var(--glass-border)' }}>
                                <h4 style={{ fontSize: '0.75rem', marginBottom: 'var(--spacing-sm)', opacity: 0.8 }}>Fatty Acid Profile</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-sm)' }}>
                                    {Object.entries(results.fattyAcids).map(([key, value]) => (
                                        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                            <span style={{ textTransform: 'capitalize', opacity: 0.7 }}>{key}:</span>
                                            <span>{value}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 6. Oil Lists */}
                <div className="calc-section section6" style={{ minHeight: '500px' }}>
                    <div style={{ display: 'flex', gap: 'var(--spacing-md)', height: '100%', flexDirection: 'column' }}>
                        {/* Oil Search/Library */}
                        <div style={{ flex: 1, borderBottom: '1px solid var(--glass-border)', paddingBottom: 'var(--spacing-md)' }}>
                            <div className="calc-section-title flex-responsive">
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Search size={14} /> Oil Library</span>
                                <div style={{ position: 'relative', flex: 1, minWidth: '150px' }}>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Search..."
                                        style={{ paddingRight: '30px', paddingLeft: '10px', height: '30px', fontSize: '0.75rem' }}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    <Search size={12} style={{ position: 'absolute', right: '10px', top: '9px', opacity: 0.5 }} />
                                </div>
                            </div>

                            <div style={{ maxHeight: '200px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)' }}>
                                <table className="oil-list-table">
                                    <thead>
                                        <tr>
                                            <th>Oil Name</th>
                                            <th>SAP (NaOH)</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredIngredients.map(ing => (
                                            <tr key={ing.id}>
                                                <td style={{ fontSize: '0.875rem' }}>{ing.name}</td>
                                                <td style={{ fontSize: '0.75rem', opacity: 0.7 }}>{ing.sap_naoh || 'N/A'}</td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <button className="btn-icon" onClick={() => addOilToRecipe(ing)}>
                                                        <Plus size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Current Recipe List */}
                        <div style={{ flex: 2 }}>
                            <div className="calc-section-title">
                                <FlaskConical size={14} /> Recipe Oil List
                                <span style={{ marginLeft: 'auto', opacity: 0.6, fontSize: '0.7rem' }}>{recipeOils.length} items</span>
                            </div>

                            {recipeOils.length === 0 ? (
                                <div className="empty-state" style={{ padding: 'var(--spacing-xl)' }}>
                                    <p>Select oils from the library to add them to your recipe.</p>
                                </div>
                            ) : (
                                <table className="oil-list-table">
                                    <thead>
                                        <tr>
                                            <th>Oil Name</th>
                                            <th style={{ width: '80px' }}>%</th>
                                            <th style={{ width: '100px' }}>{settings.weight_unit}</th>
                                            <th style={{ width: '40px' }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recipeOils.map((oil, idx) => (
                                            <tr key={idx}>
                                                <td style={{ fontWeight: 500 }}>{oil.name}</td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        className="form-input"
                                                        style={{ height: '30px', padding: '0 5px', textAlign: 'center' }}
                                                        value={oil.percentage}
                                                        onChange={(e) => updateOil(idx, 'percentage', e.target.value)}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        className="form-input"
                                                        style={{ height: '30px', padding: '0 5px', textAlign: 'center' }}
                                                        value={oil.weight.toFixed(1)}
                                                        onChange={(e) => updateOil(idx, 'weight', e.target.value)}
                                                    />
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <button className="btn-icon" style={{ color: 'var(--color-error)' }} onClick={() => removeOil(idx)}>
                                                        <Trash2 size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr style={{ borderTop: 'double 3px var(--glass-border)' }}>
                                            <td style={{ fontWeight: 700 }}>Totals</td>
                                            <td style={{ fontWeight: 700, textAlign: 'center', color: totalPercentage > 100 ? 'var(--color-error)' : 'inherit' }}>{totalPercentage.toFixed(1)}%</td>
                                            <td style={{ fontWeight: 700, textAlign: 'center' }}>{totalWeight.toFixed(1)} {settings.weight_unit}</td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            )}
                        </div>
                    </div>
                </div>

                {/* 7. Action Bar / Results Column */}
                <div className="calc-section section7">
                    <h3 className="calc-section-title"><Thermometer size={14} /> Batch Totals</h3>

                    {!results ? (
                        <div style={{ textAlign: 'center', padding: 'var(--spacing-lg)', opacity: 0.5 }}>
                            <p>Calculating yields here...</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                            <div className="result-item">
                                <span className="result-label">Lye ({settings.lye_type})</span>
                                <span className="result-value highlight">{settings.lye_type === 'NaOH' ? results.lye_naoh : results.lye_koh} {settings.weight_unit}</span>
                            </div>
                            <div className="result-item">
                                <span className="result-label">Water</span>
                                <span className="result-value">{results.water} {settings.weight_unit}</span>
                            </div>
                            <div className="result-item">
                                <span className="result-label">Fragrance</span>
                                <span className="result-value">{results.fragrance} {settings.weight_unit}</span>
                            </div>
                            <div className="result-item" style={{ borderBottom: 'none', background: 'var(--glass-bg)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)', marginTop: 'var(--spacing-sm)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 700 }}>Yield</span>
                                    <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-secondary)' }}>{results.total_batch_weight} {settings.weight_unit}</span>
                                </div>
                            </div>
                            <div className="flex-responsive" style={{ gap: 'var(--spacing-sm)' }}>
                                <button className="btn btn-secondary" style={{ padding: '0.5rem', fontSize: '0.75rem', flex: 1 }} onClick={handlePrint}>
                                    <Printer size={14} /> Print
                                </button>
                                <button className="btn btn-secondary" style={{ padding: '0.5rem', fontSize: '0.75rem', flex: 1 }} onClick={openSaveModal}>
                                    <Download size={14} /> Save
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Recipe Summary Modal */}
            {showRecipeModal && results && (
                <div className="modal-overlay" onClick={() => setShowRecipeModal(false)}>
                    <div className="modal" style={{ maxWidth: '800px', width: '90%' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Recipe Summary View</h2>
                            <button className="btn-icon" onClick={() => setShowRecipeModal(false)}><X size={18} /></button>
                        </div>
                        <div className="modal-body responsive-grid">
                            <div>
                                <h3 style={{ fontSize: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '5px', marginBottom: '10px' }}>Ingredients</h3>
                                <div className="result-item">
                                    <span>{settings.lye_type} ({settings.lye_type === 'KOH' && settings.koh_purity_90 ? '90%' : '100%'})</span>
                                    <strong>{settings.lye_type === 'NaOH' ? results.lye_naoh : results.lye_koh} {settings.weight_unit}</strong>
                                </div>
                                <div className="result-item">
                                    <span>Distilled Water</span>
                                    <strong>{results.water} {settings.weight_unit}</strong>
                                </div>
                                <div className="result-item">
                                    <span>Fragrance / Essential Oils</span>
                                    <strong>{results.fragrance} {settings.weight_unit}</strong>
                                </div>
                                {recipeOils.map(oil => (
                                    <div key={oil.ingredient_id} className="result-item">
                                        <span>{oil.name}</span>
                                        <strong>{oil.weight.toFixed(1)} {settings.weight_unit}</strong>
                                    </div>
                                ))}
                                <div className="result-item" style={{ borderTop: '2px solid var(--glass-border)', marginTop: '10px' }}>
                                    <strong>Total Batch Weight</strong>
                                    <strong>{results.total_batch_weight} {settings.weight_unit}</strong>
                                </div>
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '5px', marginBottom: '10px' }}>Stats & Settings</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-lg)' }}>
                                    <div style={{ background: 'var(--glass-bg)', padding: 'var(--spacing-sm)', borderRadius: 'var(--radius-md)' }}>
                                        <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>Superfat</div>
                                        <div style={{ fontWeight: 700 }}>{results.superfat_percentage}%</div>
                                    </div>
                                    <div style={{ background: 'var(--glass-bg)', padding: 'var(--spacing-sm)', borderRadius: 'var(--radius-md)' }}>
                                        <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>Water Method</div>
                                        <div style={{ fontWeight: 700 }}>{settings.water_method}</div>
                                    </div>
                                </div>

                                <h4 style={{ fontSize: '0.875rem', marginBottom: '10px' }}>Yield Qualities</h4>
                                <div style={{ fontSize: '0.875rem' }}>
                                    {Object.entries(results.qualities).map(([k, v]) => (
                                        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                                            <span style={{ textTransform: 'capitalize' }}>{k}:</span>
                                            <strong>{v}</strong>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={handlePrint}>
                                <Printer size={16} /> Print View
                            </button>
                            <button className="btn btn-primary" onClick={() => setShowRecipeModal(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Save Formulation Modal */}
            {isSaveModalOpen && (
                <div className="modal-overlay" onClick={closeSaveModal}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Save Formulation</h2>
                            <button className="btn-icon" onClick={closeSaveModal}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSaveFormula}>
                            <div className="modal-body">
                                <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--spacing-md)', fontSize: '0.875rem' }}>
                                    Saving {recipeOils.length} oil{recipeOils.length !== 1 ? 's' : ''} as a reusable formulation (percentages only, not weights).
                                </p>
                                <div className="form-group">
                                    <label className="form-label">Formulation Name *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g. Classic Bastille, Summer Citrus Blend..."
                                        value={saveFormData.name}
                                        onChange={e => setSaveFormData(prev => ({ ...prev, name: e.target.value }))}
                                        required
                                        autoFocus
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Description (optional)</label>
                                    <textarea
                                        className="form-input"
                                        rows={2}
                                        placeholder="Notes about this formulation..."
                                        value={saveFormData.description}
                                        onChange={e => setSaveFormData(prev => ({ ...prev, description: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeSaveModal}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={isSavingFormula}>
                                    {isSavingFormula ? 'Saving...' : 'Save Formulation'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Load Formulation Modal */}
            {isLoadModalOpen && (
                <div className="modal-overlay" onClick={closeLoadModal}>
                    <div className="modal" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Load Formulation</h2>
                            <button className="btn-icon" onClick={closeLoadModal}><X size={18} /></button>
                        </div>
                        <div className="modal-body">
                            {formulations.length === 0 ? (
                                <div className="empty-state" style={{ padding: 'var(--spacing-xl)' }}>
                                    <p>No saved formulations yet. Save your current oils using the Save button.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                                    {formulations.map(f => (
                                        <div
                                            key={f.id}
                                            className="card"
                                            style={{ padding: 'var(--spacing-md)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                            onClick={() => handleLoadFormulation(f)}
                                        >
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{f.name}</div>
                                                {f.description && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{f.description}</div>}
                                            </div>
                                            <span className="badge badge-info">{(f.oils || []).length} oils</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={closeLoadModal}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
