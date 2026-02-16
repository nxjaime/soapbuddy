import { useEffect, useState } from 'react';
import {
    FlaskConical,
    Plus,
    Search,
    Edit2,
    Trash2,
    X,
    Package,
    Barcode,
    Camera
} from 'lucide-react';
import BarcodeScanner from '../components/BarcodeScanner';
import {
    getIngredients,
    createIngredient,
    updateIngredient,
    deleteIngredient
} from '../api/client';

const CATEGORIES = [
    'Base Oil',
    'Butter',
    'Lye',
    'Fragrance',
    'Essential Oil',
    'Colorant',
    'Additive',
    'Packaging',
    'Other'
];

const UNITS = ['g', 'kg', 'oz', 'lb', 'ml', 'L', 'each'];

export default function Ingredients() {
    const [ingredients, setIngredients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingIngredient, setEditingIngredient] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        category: 'Base Oil',
        barcode: '',
        inci_code: '',
        sap_naoh: '',
        sap_koh: '',
        unit: 'g',
        quantity_on_hand: 0,
        reorder_threshold: 0,
        cost_per_unit: 0,
        supplier: '',
        notes: '',
        expiry_date: ''
    });

    useEffect(() => {
        loadIngredients();
    }, [searchTerm, categoryFilter]);

    async function loadIngredients() {
        try {
            setLoading(true);
            const data = await getIngredients({
                search: searchTerm || undefined,
                category: categoryFilter || undefined
            });
            setIngredients(data);
        } catch (err) {
            console.error('Failed to load ingredients:', err);
        } finally {
            setLoading(false);
        }
    }

    function openModal(ingredient = null) {
        if (ingredient) {
            setEditingIngredient(ingredient);
            setFormData({
                name: ingredient.name,
                category: ingredient.category,
                barcode: ingredient.barcode || '',
                inci_code: ingredient.inci_code || '',
                sap_naoh: ingredient.sap_naoh || '',
                sap_koh: ingredient.sap_koh || '',
                unit: ingredient.unit,
                quantity_on_hand: ingredient.quantity_on_hand,
                reorder_threshold: ingredient.reorder_threshold ?? 0,
                cost_per_unit: ingredient.cost_per_unit,
                supplier: ingredient.supplier || '',
                notes: ingredient.notes || '',
                expiry_date: ingredient.expiry_date || ''
            });
        } else {
            setEditingIngredient(null);
            setFormData({
                name: '',
                category: 'Base Oil',
                barcode: '',
                inci_code: '',
                sap_naoh: '',
                sap_koh: '',
                unit: 'g',
                quantity_on_hand: 0,
                reorder_threshold: 0,
                cost_per_unit: 0,
                supplier: '',
                notes: '',
                expiry_date: ''
            });
        }
        setIsModalOpen(true);
    }

    function closeModal() {
        setIsModalOpen(false);
        setEditingIngredient(null);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            const data = {
                ...formData,
                sap_naoh: formData.sap_naoh ? parseFloat(formData.sap_naoh) : null,
                sap_koh: formData.sap_koh ? parseFloat(formData.sap_koh) : null,
                quantity_on_hand: parseFloat(formData.quantity_on_hand),
                reorder_threshold: parseFloat(formData.reorder_threshold) || 0,
                cost_per_unit: parseFloat(formData.cost_per_unit),
                expiry_date: formData.expiry_date || null
            };

            if (editingIngredient) {
                await updateIngredient(editingIngredient.id, data);
            } else {
                await createIngredient(data);
            }
            closeModal();
            loadIngredients();
        } catch (err) {
            console.error('Failed to save ingredient:', err);
            alert('Failed to save ingredient: ' + err.message);
        }
    }

    async function handleDelete(id) {
        if (!confirm('Are you sure you want to delete this ingredient?')) return;
        try {
            await deleteIngredient(id);
            loadIngredients();
        } catch (err) {
            console.error('Failed to delete ingredient:', err);
            alert('Failed to delete ingredient: ' + err.message);
        }
    }

    function handleInputChange(e) {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }

    const handleBarcodeScan = async (result) => {
        setIsScannerOpen(false);

        // Search for existing ingredient with this barcode
        const existing = ingredients.find(ing => ing.barcode === result.barcode);

        if (existing) {
            if (confirm(`Ingredient "${existing.name}" already exists with this barcode. Would you like to edit it?`)) {
                openModal(existing);
                return;
            }
        }

        // Open modal with pre-filled data
        setEditingIngredient(null);
        setFormData({
            name: result.name || '',
            category: 'Other', // Lookups might not provide category easily
            barcode: result.barcode,
            inci_code: result.inci || '',
            sap_naoh: '',
            sap_koh: '',
            unit: 'g',
            quantity_on_hand: 0,
            cost_per_unit: 0,
            supplier: result.brand || '',
            notes: ''
        });
        setIsModalOpen(true);
    };

    const getExpiryStatus = (expiryDate) => {
        if (!expiryDate) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiry = new Date(expiryDate);
        const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
        if (diffDays <= 0) return 'expired';
        if (diffDays <= 30) return 'expiring';
        return null;
    };

    const getCategoryBadge = (category) => {
        const colors = {
            'Base Oil': 'badge-purple',
            'Butter': 'badge-warning',
            'Lye': 'badge-error',
            'Fragrance': 'badge-info',
            'Essential Oil': 'badge-success',
            'Colorant': 'badge-warning',
            'Additive': 'badge-info',
            'Packaging': 'badge-purple',
            'Other': 'badge-info'
        };
        return colors[category] || 'badge-info';
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">
                    <FlaskConical className="icon" />
                    Ingredients
                </h1>
                <div className="flex-responsive">
                    <button className="btn btn-secondary" onClick={() => setIsScannerOpen(true)}>
                        <Barcode size={18} />
                        Scan
                    </button>
                    <button className="btn btn-primary" onClick={() => openModal()}>
                        <Plus size={18} />
                        Add
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex-responsive" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
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
                        placeholder="Search ingredients..."
                        className="form-input"
                        style={{ paddingLeft: '40px' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    className="form-input form-select"
                    style={{ width: 'auto', flex: '0 1 200px' }}
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                >
                    <option value="">All Categories</option>
                    {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
            </div>

            {/* Table */}
            {loading ? (
                <div className="empty-state">
                    <div className="loading-spinner" />
                </div>
            ) : ingredients.length === 0 ? (
                <div className="empty-state">
                    <Package />
                    <h3>No ingredients found</h3>
                    <p>Start by adding your first ingredient.</p>
                    <button className="btn btn-primary" onClick={() => openModal()}>
                        <Plus size={18} />
                        Add Ingredient
                    </button>
                </div>
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th className="hide-on-mobile">Category</th>
                                <th className="hide-on-mobile">SAP (NaOH)</th>
                                <th>Stock</th>
                                <th className="hide-on-mobile">Cost/Unit</th>
                                <th className="hide-on-mobile">Supplier</th>
                                <th style={{ width: '100px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ingredients.map(ing => (
                                <tr key={ing.id}>
                                    <td>
                                        <div>
                                            <strong>{ing.name}</strong>
                                            {ing.inci_code && (
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                    {ing.inci_code}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="hide-on-mobile">
                                        <span className={`badge ${getCategoryBadge(ing.category)}`}>
                                            {ing.category}
                                        </span>
                                    </td>
                                    <td className="hide-on-mobile">{ing.sap_naoh || '-'}</td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <span style={{
                                                color: ing.reorder_threshold > 0 && ing.quantity_on_hand <= ing.reorder_threshold
                                                    ? 'var(--color-error)'
                                                    : 'inherit',
                                                fontWeight: 600
                                            }}>
                                                {ing.quantity_on_hand} {ing.unit}
                                                {ing.reorder_threshold > 0 && ing.quantity_on_hand <= ing.reorder_threshold && (
                                                    <span className="badge badge-error" style={{ marginLeft: '6px', fontSize: '0.65rem' }}>Low</span>
                                                )}
                                            </span>
                                            {(() => {
                                                const status = getExpiryStatus(ing.expiry_date);
                                                if (status === 'expired') return (
                                                    <span className="badge badge-error" style={{ fontSize: '0.65rem', width: 'fit-content' }}>Expired</span>
                                                );
                                                if (status === 'expiring') return (
                                                    <span className="badge badge-warning" style={{ fontSize: '0.65rem', width: 'fit-content' }}>Expiring Soon</span>
                                                );
                                                return null;
                                            })()}
                                        </div>
                                    </td>
                                    <td className="hide-on-mobile">${ing.cost_per_unit.toFixed(2)}/{ing.unit}</td>
                                    <td className="hide-on-mobile">{ing.supplier || '-'}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                                            <button className="btn-icon" onClick={() => openModal(ing)}>
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                className="btn-icon"
                                                style={{ color: 'var(--color-error)' }}
                                                onClick={() => handleDelete(ing.id)}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {editingIngredient ? 'Edit Ingredient' : 'Add Ingredient'}
                            </h2>
                            <button className="btn-icon" onClick={closeModal}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Name *</label>
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
                                        <label className="form-label">Category *</label>
                                        <select
                                            name="category"
                                            className="form-input form-select"
                                            value={formData.category}
                                            onChange={handleInputChange}
                                            required
                                        >
                                            {CATEGORIES.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Barcode</label>
                                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                        <input
                                            type="text"
                                            name="barcode"
                                            className="form-input"
                                            value={formData.barcode}
                                            onChange={handleInputChange}
                                            placeholder="Scan or enter barcode"
                                            style={{ flex: 1 }}
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-secondary btn-icon"
                                            onClick={() => setIsScannerOpen(true)}
                                            style={{ padding: '0 12px' }}
                                        >
                                            <Barcode size={18} />
                                        </button>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">INCI Code</label>
                                    <input
                                        type="text"
                                        name="inci_code"
                                        className="form-input"
                                        value={formData.inci_code}
                                        onChange={handleInputChange}
                                        placeholder="e.g., Olea Europaea Fruit Oil"
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">SAP Value (NaOH)</label>
                                        <input
                                            type="number"
                                            name="sap_naoh"
                                            className="form-input"
                                            value={formData.sap_naoh}
                                            onChange={handleInputChange}
                                            step="0.001"
                                            placeholder="e.g., 134.5"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">SAP Value (KOH)</label>
                                        <input
                                            type="number"
                                            name="sap_koh"
                                            className="form-input"
                                            value={formData.sap_koh}
                                            onChange={handleInputChange}
                                            step="0.001"
                                            placeholder="e.g., 188.3"
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Quantity on Hand</label>
                                        <input
                                            type="number"
                                            name="quantity_on_hand"
                                            className="form-input"
                                            value={formData.quantity_on_hand}
                                            onChange={handleInputChange}
                                            step="0.01"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Unit</label>
                                        <select
                                            name="unit"
                                            className="form-input form-select"
                                            value={formData.unit}
                                            onChange={handleInputChange}
                                        >
                                            {UNITS.map(u => (
                                                <option key={u} value={u}>{u}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Cost per Unit ($)</label>
                                        <input
                                            type="number"
                                            name="cost_per_unit"
                                            className="form-input"
                                            value={formData.cost_per_unit}
                                            onChange={handleInputChange}
                                            step="0.01"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Reorder Threshold</label>
                                        <input
                                            type="number"
                                            name="reorder_threshold"
                                            className="form-input"
                                            value={formData.reorder_threshold}
                                            onChange={handleInputChange}
                                            step="1"
                                            min="0"
                                            placeholder="0 = no alert"
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Supplier</label>
                                        <input
                                            type="text"
                                            name="supplier"
                                            className="form-input"
                                            value={formData.supplier}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Expiry Date</label>
                                        <input
                                            type="date"
                                            name="expiry_date"
                                            className="form-input"
                                            value={formData.expiry_date}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Notes</label>
                                    <textarea
                                        name="notes"
                                        className="form-input"
                                        rows="3"
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
                                    {editingIngredient ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Barcode Scanner Modal */}
            {isScannerOpen && (
                <BarcodeScanner
                    onScan={handleBarcodeScan}
                    onClose={() => setIsScannerOpen(false)}
                />
            )}
        </div>
    );
}
