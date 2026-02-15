import { useEffect, useState, useCallback, useRef } from 'react';
import {
    BookOpen,
    Plus,
    Search,
    Edit2,
    Trash2,
    X,
    FileText,
    Factory,
    Activity,
    Scale,
    Info
} from 'lucide-react';
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip
} from 'recharts';
import {
    getRecipes,
    getRecipe,
    getIngredients,
    createRecipe,
    updateRecipe,
    deleteRecipe,
    createBatch
} from '../api/client';
import { computeQualities } from '../utils/soapMath';

const RECIPE_TYPES = ['Soap', 'Lotion', 'Lip Balm', 'Body Butter', 'Other'];
const LYE_TYPES = ['NaOH', 'KOH', 'Dual'];

export default function Recipes() {
    const [recipes, setRecipes] = useState([]);
    const [ingredients, setIngredients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRecipe, setEditingRecipe] = useState(null);
    const [qualities, setQualities] = useState(null);
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
        loadIngredients();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadRecipes();
        }, 500);
        return () => clearTimeout(timer);
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

    async function loadRecipes() {
        try {
            setLoading(true);
            const data = await getRecipes({ search: searchTerm || undefined });
            setRecipes(data);
        } catch (err) {
            console.error('Failed to load recipes:', err);
        } finally {
            setLoading(false);
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

    async function openModal(recipe = null) {
        if (recipe) {
            setEditingRecipe(recipe);
            setQualities(null); // Reset while loading

            // Set initial form data from the recipe list
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
            // Qualities will be computed by the useEffect above
        } else {
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
        } catch (err) {
            console.error('Failed to create batch:', err);
            alert('Failed to create batch: ' + err.message);
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

        const newWeightStr = prompt(`Current Total Oils: ${currentTotal}${formData.unit}\nEnter new Total Oils weight:`, currentTotal);
        if (!newWeightStr) return;

        const newWeight = parseFloat(newWeightStr);
        if (isNaN(newWeight) || newWeight <= 0) {
            alert('Invalid weight entered.');
            return;
        }

        const ratio = newWeight / currentTotal;

        setFormData(prev => ({
            ...prev,
            total_oils_weight: newWeight,
            ingredients: prev.ingredients.map(ing => ({
                ...ing,
                quantity: parseFloat((ing.quantity * ratio).toFixed(2))
            }))
        }));
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
                                <h3 className="card-title">{recipe.name}</h3>
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
                                <button className="btn btn-success" style={{ flex: 1 }} onClick={() => handleMakeBatch(recipe)}>
                                    <Factory size={16} />
                                    Make Batch
                                </button>
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
                                {qualities && (
                                    <div style={{ marginTop: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 'var(--spacing-sm)' }}>
                                            <Activity size={16} style={{ marginRight: '8px' }} />
                                            <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Soap Qualities</h4>
                                        </div>
                                        <div style={{ height: '250px', width: '100%', background: 'var(--glass-bg)', borderRadius: 'var(--radius-md)', display: 'flex' }}>
                                            <div style={{ flex: 1 }}>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={[
                                                        { subject: 'Hardness', A: qualities.hardness, fullMark: 100 },
                                                        { subject: 'Cleansing', A: qualities.cleansing, fullMark: 100 },
                                                        { subject: 'Cond.', A: qualities.conditioning, fullMark: 100 },
                                                        { subject: 'Bubbly', A: qualities.bubbly, fullMark: 100 },
                                                        { subject: 'Creamy', A: qualities.creamy, fullMark: 100 },
                                                    ]}>
                                                        <PolarGrid stroke="#e5e7eb" strokeOpacity={0.2} />
                                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                                        <Radar
                                                            name="Qualities"
                                                            dataKey="A"
                                                            stroke="#8b5cf6"
                                                            strokeWidth={2}
                                                            fill="#8b5cf6"
                                                            fillOpacity={0.3}
                                                        />
                                                        <Tooltip
                                                            contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }}
                                                            itemStyle={{ color: '#d1d5db' }}
                                                        />
                                                    </RadarChart>
                                                </ResponsiveContainer>
                                            </div>
                                            <div style={{ width: '140px', padding: '16px', fontSize: '0.8rem', borderLeft: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                <div style={{ marginBottom: '8px' }}>
                                                    <div style={{ color: 'var(--text-muted)' }}>Hardness</div>
                                                    <div style={{ fontWeight: 600 }}>{qualities.hardness}</div>
                                                </div>
                                                <div style={{ marginBottom: '8px' }}>
                                                    <div style={{ color: 'var(--text-muted)' }}>Cleansing</div>
                                                    <div style={{ fontWeight: 600 }}>{qualities.cleansing}</div>
                                                </div>
                                                <div style={{ marginBottom: '8px' }}>
                                                    <div style={{ color: 'var(--text-muted)' }}>Conditioning</div>
                                                    <div style={{ fontWeight: 600 }}>{qualities.conditioning}</div>
                                                </div>
                                                <div style={{ marginBottom: '8px' }}>
                                                    <div style={{ color: 'var(--text-muted)' }}>Bubbly</div>
                                                    <div style={{ fontWeight: 600 }}>{qualities.bubbly}</div>
                                                </div>
                                                <div>
                                                    <div style={{ color: 'var(--text-muted)' }}>Creamy</div>
                                                    <div style={{ fontWeight: 600 }}>{qualities.creamy}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

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
