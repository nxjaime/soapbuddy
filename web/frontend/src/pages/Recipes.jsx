import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
    BookOpen,
    Plus,
    Search,
    Edit2,
    Trash2,
    X,
    FileText,
    Factory,
    Scale,
    Info,
    Tag,
    TrendingUp,
    ChevronUp,
    ChevronDown
} from 'lucide-react';
import QualityChart from '../components/QualityChart';
import {
    getRecipes,
    getRecipe,
    getIngredients,
    createRecipe,
    updateRecipe,
    deleteRecipe,
    createBatch,
    getMolds,
    getSalesOrders
} from '../api/client';
import { computeQualities } from '../utils/soapMath';

const RECIPE_TYPES = ['Soap', 'Lotion', 'Lip Balm', 'Body Butter', 'Other'];
const LYE_TYPES = ['NaOH', 'KOH', 'Dual'];

import { useSubscription } from '../contexts/SubscriptionContext';
import { useNavigate } from 'react-router-dom';
import LabelStudio from '../components/LabelStudio';

const Spinner = ({ size = 'md', className = '' }) => (
    <div className={`inline-block ${size === 'sm' ? 'w-4 h-4' : 'w-6 h-6'} border-2 border-current border-r-transparent rounded-full animate-spin ${className}`} />
);

export default function Recipes() {
    const { getLimit, tier, meetsMinTier, profile, hasFeature } = useSubscription();
    const canSeeAnalytics = hasFeature('salesTracking');
    const navigate = useNavigate();
    const [labelRecipe, setLabelRecipe] = useState(null);
    const [recipes, setRecipes] = useState([]);
    const [ingredients, setIngredients] = useState([]);
    const [salesOrders, setSalesOrders] = useState([]);
    const [showProductStats, setShowProductStats] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRecipe, setEditingRecipe] = useState(null);
    const [qualities, setQualities] = useState(null);
    const [molds, setMolds] = useState([]);
    const [isResizeModalOpen, setIsResizeModalOpen] = useState(false);
    const [resizeMode, setResizeMode] = useState('weight'); // 'weight' | 'mold'
    const [resizeTargetWeight, setResizeTargetWeight] = useState('');
    const [resizeSelectedMold, setResizeSelectedMold] = useState('');
    const [isCreatingBatch, setIsCreatingBatch] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        recipe_type: 'Soap',
        lye_type: 'NaOH',
        superfat_percentage: 5,
        water_percentage: 33,
        total_oils_weight: 500,
        unit: 'g',
        stock_quantity: 0,
        default_price: 0.0,
        notes: '',
        ingredients: []
    });

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (!loading) { // Avoid double-fetch on mount
            const timer = setTimeout(() => {
                loadRecipes();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [searchTerm]);

    // Real-time quality recalculation when modal ingredients change
    const qualityTimer = useRef(null);
    useEffect(() => {
        if (!isModalOpen) return;

        // Debounce 300ms so we don't spam Supabase on every keystroke
        clearTimeout(qualityTimer.current);
        qualityTimer.current = setTimeout(async () => {
            try {
                const result = await computeQualities(formData.ingredients);
                setQualities(result);
            } catch (err) {
                console.error('Quality calculation error:', err);
            }
        }, 300);

        return () => clearTimeout(qualityTimer.current);
    }, [formData.ingredients, isModalOpen]);

    async function loadData() {
        try {
            setLoading(true);
            const [recipesData, ingredientsData, moldsData, ordersData] = await Promise.all([
                getRecipes({ search: searchTerm || undefined }),
                getIngredients(),
                getMolds(),
                getSalesOrders()
            ]);
            setRecipes(recipesData);
            setIngredients(ingredientsData);
            setMolds(moldsData || []);
            setSalesOrders(ordersData);
        } catch (err) {
            console.error('Failed to load data:', err);
        } finally {
            setLoading(false);
        }
    }

    async function loadRecipes() {
        try {
            const data = await getRecipes({ search: searchTerm || undefined });
            setRecipes(data);
        } catch (err) {
            console.error('Failed to load recipes:', err);
        }
    }

    async function loadIngredients() {
        try {
            const data = await getIngredients();
            setIngredients(data);
        } catch (err) {
            console.error('Failed to load ingredients:', err);
        }
    }

    async function loadMolds() {
        try {
            const data = await getMolds();
            setMolds(data || []);
        } catch (err) {
            console.error('Failed to load molds:', err);
        }
    }

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

    async function openModal(recipe = null) {
        if (!recipe) {
            const limit = getLimit('maxRecipes');
            if (recipes.length >= limit) {
                if (confirm(`You've reached your limit of ${limit} recipes on the ${tier} plan. Would you like to upgrade to create more?`)) {
                    navigate('/settings?tab=subscription');
                }
                return;
            }
            setEditingRecipe(null);
            setQualities(null);
            setFormData({
                name: '',
                description: '',
                recipe_type: 'Soap',
                lye_type: 'NaOH',
                superfat_percentage: 5,
                water_percentage: 33,
                total_oils_weight: 500,
                unit: 'g',
                stock_quantity: 0,
                default_price: 0.0,
                notes: '',
                ingredients: []
            });
        } else {
            setEditingRecipe(recipe);
            setQualities(null);
            setFormData({
                name: recipe.name,
                description: recipe.description || '',
                recipe_type: recipe.recipe_type,
                lye_type: recipe.lye_type,
                superfat_percentage: recipe.superfat_percentage,
                water_percentage: recipe.water_percentage,
                total_oils_weight: recipe.total_oils_weight,
                unit: recipe.unit,
                stock_quantity: recipe.stock_quantity || 0,
                default_price: recipe.default_price || 0.0,
                notes: recipe.notes || '',
                ingredients: recipe.ingredients.map(ing => ({
                    ingredient_id: ing.ingredient_id,
                    quantity: ing.quantity,
                    unit: ing.unit
                }))
            });
        }
        setIsModalOpen(true);
    }

    function closeModal() {
        setIsModalOpen(false);
        setEditingRecipe(null);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            const data = {
                ...formData,
                superfat_percentage: parseFloat(formData.superfat_percentage),
                water_percentage: parseFloat(formData.water_percentage),
                total_oils_weight: parseFloat(formData.total_oils_weight),
                stock_quantity: parseInt(formData.stock_quantity),
                default_price: parseFloat(formData.default_price)
            };

            if (editingRecipe) {
                await updateRecipe(editingRecipe.id, data);
            } else {
                await createRecipe(data);
            }
            closeModal();
            loadRecipes();
        } catch (err) {
            console.error('Failed to save recipe:', err);
            alert('Failed to save recipe: ' + err.message);
        }
    }

    async function handleDelete(id) {
        if (!confirm('Are you sure you want to delete this recipe?')) return;
        try {
            await deleteRecipe(id);
            loadRecipes();
        } catch (err) {
            console.error('Failed to delete recipe:', err);
            alert('Failed to delete recipe: ' + err.message);
        }
    }

    function generateJulianLot() {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 0);
        const diff = now - start;
        const oneDay = 1000 * 60 * 60 * 24;
        const dayOfYear = Math.floor(diff / oneDay);
        const yy = now.getFullYear().toString().slice(-2);
        const ddd = dayOfYear.toString().padStart(3, '0');
        const seq = now.getTime().toString().slice(-4);
        return `${yy}${ddd}-${seq}`;
    }

    async function handleMakeBatch(recipe) {
        setIsCreatingBatch(true);
        const lotNumber = generateJulianLot();
        try {
            await createBatch({
                recipe_id: recipe.id,
                lot_number: lotNumber,
                scale_factor: 1.0,
                total_weight: recipe.total_oils_weight,
                status: 'Planned'
            });
            alert(`Created batch ${lotNumber} for ${recipe.name}`);
            navigate('/production');
        } catch (err) {
            console.error('Failed to create batch:', err);
            alert('Failed to create batch: ' + err.message);
        } finally {
            setIsCreatingBatch(false);
        }
    }

    function handleInputChange(e) {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }

    function addIngredientToRecipe() {
        setFormData(prev => ({
            ...prev,
            ingredients: [...prev.ingredients, { ingredient_id: '', quantity: 0, unit: 'g' }]
        }));
    }

    function updateRecipeIngredient(index, field, value) {
        setFormData(prev => {
            const updated = [...prev.ingredients];
            updated[index] = { ...updated[index], [field]: value };
            return { ...prev, ingredients: updated };
        });
    }

    function removeRecipeIngredient(index) {
        setFormData(prev => ({
            ...prev,
            ingredients: prev.ingredients.filter((_, i) => i !== index)
        }));
    }

    function handleResize() {
        if (formData.ingredients.length === 0) {
            alert('Add ingredients first to resize.');
            return;
        }
        const currentTotal = formData.ingredients.reduce((sum, ing) => sum + (parseFloat(ing.quantity) || 0), 0);
        if (currentTotal === 0) {
            alert('Current total weight is 0.');
            return;
        }
        setResizeTargetWeight(String(currentTotal));
        setResizeSelectedMold('');
        setResizeMode('weight');
        setIsResizeModalOpen(true);
    }

    function applyResize() {
        let newWeight;
        if (resizeMode === 'mold') {
            const mold = molds.find(m => String(m.id) === String(resizeSelectedMold));
            if (!mold || !mold.volume_ml) {
                alert('Selected mold has no volume set.');
                return;
            }
            // Oils fill roughly 38% of mold volume by weight (water:oils ~33%, lye ~5%)
            // Simple approximation: oils weight ≈ mold volume * 0.65 g/mL
            newWeight = parseFloat((mold.volume_ml * 0.65).toFixed(1));
        } else {
            newWeight = parseFloat(resizeTargetWeight);
        }

        if (isNaN(newWeight) || newWeight <= 0) {
            alert('Invalid target weight.');
            return;
        }

        const currentTotal = formData.ingredients.reduce((sum, ing) => sum + (parseFloat(ing.quantity) || 0), 0);
        const ratio = newWeight / currentTotal;

        setFormData(prev => ({
            ...prev,
            total_oils_weight: newWeight,
            ingredients: prev.ingredients.map(ing => ({
                ...ing,
                quantity: parseFloat((ing.quantity * ratio).toFixed(2))
            }))
        }));
        setIsResizeModalOpen(false);
    }

    const getIngredientName = (id) => {
        const ing = ingredients.find(i => i.id === id);
        return ing ? ing.name : 'Unknown';
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">
                    <BookOpen className="icon" />
                    Recipes
                </h1>
                <button className="btn btn-primary" onClick={() => openModal()}>
                    <Plus size={18} />
                    New Recipe
                </button>
            </div>

            {/* Search */}
            <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
                    <Search
                        style={{
                            position: 'absolute',
                            left: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--text-muted)',
                            width: '18px'
                        }}
                    />
                    <input
                        type="text"
                        placeholder="Search recipes..."
                        className="form-input"
                        style={{ paddingLeft: '40px' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Recipe Cards */}
            {loading ? (
                <div className="empty-state">
                    <div className="loading-spinner" />
                </div>
            ) : recipes.length === 0 ? (
                <div className="empty-state">
                    <FileText />
                    <h3>No recipes found</h3>
                    <p>Create your first soap recipe to get started.</p>
                    <button className="btn btn-primary" onClick={() => openModal()}>
                        <Plus size={18} />
                        New Recipe
                    </button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--spacing-lg)' }}>
                    {recipes.map(recipe => (
                        <div key={recipe.id} className="card">
                            <div className="card-header">
                                <h3 className="card-title">
                                    {recipe.name}
                                    {productStats.topSellerId === recipe.id && (
                                        <span className="badge badge-green" style={{ fontSize: '0.7rem', marginLeft: '6px' }}>
                                            Top Seller
                                        </span>
                                    )}
                                </h3>
                                <span className="badge badge-purple">{recipe.recipe_type}</span>
                            </div>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)', fontSize: '0.875rem' }}>
                                {recipe.description || 'No description provided.'}
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
                                <div>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Lye Type</span>
                                    <div style={{ fontWeight: '500' }}>{recipe.lye_type}</div>
                                </div>
                                <div>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Superfat</span>
                                    <div style={{ fontWeight: '500' }}>{recipe.superfat_percentage}%</div>
                                </div>
                                <div>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Water %</span>
                                    <div style={{ fontWeight: '500' }}>{recipe.water_percentage}%</div>
                                </div>
                                <div>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Oils Weight</span>
                                    <div style={{ fontWeight: '500' }}>{recipe.total_oils_weight} {recipe.unit}</div>
                                </div>
                                <div style={{ marginTop: '8px', gridColumn: 'span 2', display: 'flex', justifyContent: 'space-between', background: 'var(--glass-bg)', padding: '8px', borderRadius: '4px' }}>
                                    <div>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>In Stock</span>
                                        <div style={{ fontWeight: 700, color: recipe.stock_quantity > 0 ? 'var(--color-success)' : 'var(--text-muted)' }}>
                                            {recipe.stock_quantity || 0}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Price</span>
                                        <div style={{ fontWeight: 700 }}>${(recipe.default_price || 0).toFixed(2)}</div>
                                    </div>
                                </div>
                            </div>
                            {recipe.ingredients && recipe.ingredients.length > 0 && (
                                <div style={{ marginBottom: 'var(--spacing-md)', padding: 'var(--spacing-sm)', background: 'var(--glass-bg)', borderRadius: 'var(--radius-sm)' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-xs)' }}>
                                        Ingredients ({recipe.ingredients.length})
                                    </div>
                                    {recipe.ingredients.slice(0, 3).map(ing => (
                                        <div key={ing.id} style={{ fontSize: '0.875rem' }}>
                                            {getIngredientName(ing.ingredient_id)} - {ing.quantity}{ing.unit}
                                        </div>
                                    ))}
                                    {recipe.ingredients.length > 3 && (
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            +{recipe.ingredients.length - 3} more...
                                        </div>
                                    )}
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginTop: 'auto' }}>
                                <button
                                    className={`btn btn-success ${isCreatingBatch ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    style={{ flex: 1 }}
                                    onClick={() => handleMakeBatch(recipe)}
                                    disabled={isCreatingBatch}
                                    title={isCreatingBatch ? 'Creating batch...' : 'Create a new batch from this recipe'}
                                >
                                    {isCreatingBatch ? (
                                        <>
                                            <Spinner size="sm" className="mr-2 inline-block" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <Factory size={16} />
                                            Make Batch
                                        </>
                                    )}
                                </button>
                                {meetsMinTier('manufacturer') && (
                                    <button
                                        className="btn-icon"
                                        title="Create Label"
                                        onClick={() => setLabelRecipe(recipe)}
                                    >
                                        <Tag size={16} />
                                    </button>
                                )}
                                <button className="btn-icon" onClick={() => openModal(recipe)}>
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    className="btn-icon"
                                    style={{ color: 'var(--color-error)' }}
                                    onClick={() => handleDelete(recipe.id)}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

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

            {/* Resize Modal */}
            {isResizeModalOpen && (
                <div className="modal-overlay" onClick={() => setIsResizeModalOpen(false)}>
                    <div className="modal" style={{ maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                <Scale size={18} style={{ marginRight: '8px' }} />
                                Resize Recipe
                            </h2>
                            <button className="btn-icon" onClick={() => setIsResizeModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-lg)' }}>
                                <button
                                    type="button"
                                    className={`btn ${resizeMode === 'weight' ? 'btn-primary' : 'btn-secondary'}`}
                                    style={{ flex: 1 }}
                                    onClick={() => setResizeMode('weight')}
                                >
                                    By Target Weight
                                </button>
                                <button
                                    type="button"
                                    className={`btn ${resizeMode === 'mold' ? 'btn-primary' : 'btn-secondary'}`}
                                    style={{ flex: 1 }}
                                    onClick={() => setResizeMode('mold')}
                                    disabled={molds.length === 0}
                                    title={molds.length === 0 ? 'No molds saved yet' : ''}
                                >
                                    By Mold
                                </button>
                            </div>

                            {resizeMode === 'weight' ? (
                                <div className="form-group">
                                    <label className="form-label">New Total Oils Weight ({formData.unit})</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={resizeTargetWeight}
                                        onChange={e => setResizeTargetWeight(e.target.value)}
                                        min="1"
                                        step="any"
                                        autoFocus
                                    />
                                </div>
                            ) : (
                                <div className="form-group">
                                    <label className="form-label">Select Mold</label>
                                    <select
                                        className="form-input form-select"
                                        value={resizeSelectedMold}
                                        onChange={e => setResizeSelectedMold(e.target.value)}
                                    >
                                        <option value="">Choose a mold...</option>
                                        {molds.map(m => (
                                            <option key={m.id} value={m.id}>
                                                {m.name} ({m.volume_ml} mL → ~{(m.volume_ml * 0.65).toFixed(0)}g oils)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={() => setIsResizeModalOpen(false)}>
                                Cancel
                            </button>
                            <button type="button" className="btn btn-primary" onClick={applyResize}>
                                Apply Resize
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Label Studio */}
            {labelRecipe && (
                <LabelStudio
                    recipe={labelRecipe}
                    onClose={() => setLabelRecipe(null)}
                    businessName={profile?.business_name || ''}
                />
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {editingRecipe ? 'Edit Recipe' : 'New Recipe'}
                            </h2>
                            <button className="btn-icon" onClick={closeModal}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Recipe Name *</label>
                                        <input
                                            type="text"
                                            name="name"
                                            className="form-input"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Type</label>
                                        <select
                                            name="recipe_type"
                                            className="form-input form-select"
                                            value={formData.recipe_type}
                                            onChange={handleInputChange}
                                        >
                                            {RECIPE_TYPES.map(t => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea
                                        name="description"
                                        className="form-input"
                                        rows="2"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Lye Type</label>
                                        <select
                                            name="lye_type"
                                            className="form-input form-select"
                                            value={formData.lye_type}
                                            onChange={handleInputChange}
                                        >
                                            {LYE_TYPES.map(t => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Superfat %</label>
                                        <input
                                            type="number"
                                            name="superfat_percentage"
                                            className="form-input"
                                            value={formData.superfat_percentage}
                                            onChange={handleInputChange}
                                            step="0.5"
                                            min="0"
                                            max="30"
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Water (% of oils)</label>
                                        <input
                                            type="number"
                                            name="water_percentage"
                                            className="form-input"
                                            value={formData.water_percentage}
                                            onChange={handleInputChange}
                                            step="1"
                                            min="20"
                                            max="50"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Total Oils Weight</label>
                                        <input
                                            type="number"
                                            name="total_oils_weight"
                                            className="form-input"
                                            value={formData.total_oils_weight}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            Default Price ($)
                                            <span className="info-bubble">
                                                <Info size={14} />
                                                <span className="info-tooltip">The standard retail price per unit for this product. Used to auto-fill price on sales orders.</span>
                                            </span>
                                        </label>
                                        <input
                                            type="number"
                                            name="default_price"
                                            className="form-input"
                                            value={formData.default_price}
                                            onChange={handleInputChange}
                                            step="0.01"
                                            min="0"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            Current Stock
                                            <span className="info-bubble">
                                                <Info size={14} />
                                                <span className="info-tooltip">Manual adjustment of on-hand inventory count. This is separate from production batch tracking and is used for quick stock corrections.</span>
                                            </span>
                                        </label>
                                        <input
                                            type="number"
                                            name="stock_quantity"
                                            className="form-input"
                                            value={formData.stock_quantity}
                                            onChange={handleInputChange}
                                            step="1"
                                        />
                                    </div>
                                </div>

                                {/* Soap Qualities Chart */}
                                <QualityChart qualities={qualities} />

                                {/* Recipe Ingredients */}
                                <div style={{ marginTop: 'var(--spacing-lg)', paddingTop: 'var(--spacing-lg)', borderTop: '1px solid var(--glass-border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
                                        <label className="form-label" style={{ marginBottom: 0 }}>Recipe Ingredients</label>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button type="button" className="btn btn-secondary" onClick={handleResize} title="Resize Recipe">
                                                <Scale size={16} />
                                                Resize
                                            </button>
                                            <button type="button" className="btn btn-secondary" onClick={addIngredientToRecipe}>
                                                <Plus size={16} />
                                                Add
                                            </button>
                                        </div>
                                    </div>
                                    {formData.ingredients.map((ing, idx) => (
                                        <div key={idx} style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)', alignItems: 'center' }}>
                                            <select
                                                className="form-input form-select"
                                                style={{ flex: 2 }}
                                                value={ing.ingredient_id}
                                                onChange={(e) => updateRecipeIngredient(idx, 'ingredient_id', parseInt(e.target.value))}
                                            >
                                                <option value="">Select ingredient</option>
                                                {ingredients.map(i => (
                                                    <option key={i.id} value={i.id}>{i.name}</option>
                                                ))}
                                            </select>
                                            <input
                                                type="number"
                                                className="form-input"
                                                style={{ flex: 1 }}
                                                value={ing.quantity}
                                                onChange={(e) => updateRecipeIngredient(idx, 'quantity', parseFloat(e.target.value))}
                                                placeholder="Qty"
                                            />
                                            <select
                                                className="form-input form-select"
                                                style={{ width: '70px' }}
                                                value={ing.unit}
                                                onChange={(e) => updateRecipeIngredient(idx, 'unit', e.target.value)}
                                            >
                                                <option value="g">g</option>
                                                <option value="oz">oz</option>
                                                <option value="ml">ml</option>
                                            </select>
                                            <button
                                                type="button"
                                                className="btn-icon"
                                                style={{ color: 'var(--color-error)' }}
                                                onClick={() => removeRecipeIngredient(idx)}
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <div className="form-group" style={{ marginTop: 'var(--spacing-lg)' }}>
                                    <label className="form-label">Notes</label>
                                    <textarea
                                        name="notes"
                                        className="form-input"
                                        rows="2"
                                        value={formData.notes}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingRecipe ? 'Update Recipe' : 'Create Recipe'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div >
            )
            }
        </div >
    );
}
