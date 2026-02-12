import { useEffect, useState } from 'react';
import {
    Factory,
    Plus,
    X,
    Calendar,
    Clock,
    CheckCircle2,
    XCircle,
    Package
} from 'lucide-react';
import { getBatches, getRecipes, createBatch, updateBatch } from '../api/client';

const STATUS_OPTIONS = ['Planned', 'In Progress', 'Curing', 'Complete', 'Cancelled'];

export default function Production() {
    const [batches, setBatches] = useState([]);
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        recipe_id: '',
        lot_number: '',
        scale_factor: 1.0,
        total_weight: 0,
        status: 'Planned',
        planned_date: '',
        notes: ''
    });

    useEffect(() => {
        loadBatches();
        loadRecipes();
    }, [statusFilter]);

    async function loadBatches() {
        try {
            setLoading(true);
            const data = await getBatches({ status: statusFilter || undefined });
            setBatches(data);
        } catch (err) {
            console.error('Failed to load batches:', err);
        } finally {
            setLoading(false);
        }
    }

    async function loadRecipes() {
        try {
            const data = await getRecipes();
            setRecipes(data);
        } catch (err) {
            console.error('Failed to load recipes:', err);
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

    function openModal() {
        setFormData({
            recipe_id: recipes.length > 0 ? recipes[0].id : '',
            lot_number: generateJulianLot(),
            scale_factor: 1.0,
            total_weight: 0,
            status: 'Planned',
            planned_date: '',
            notes: ''
        });
        setIsModalOpen(true);
    }

    function closeModal() {
        setIsModalOpen(false);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            await createBatch({
                ...formData,
                recipe_id: parseInt(formData.recipe_id),
                scale_factor: parseFloat(formData.scale_factor),
                total_weight: parseFloat(formData.total_weight),
                planned_date: formData.planned_date || null
            });
            closeModal();
            loadBatches();
        } catch (err) {
            console.error('Failed to create batch:', err);
            alert('Failed to create batch: ' + err.message);
        }
    }

    const [updatingId, setUpdatingId] = useState(null);

    async function handleStatusChange(batchId, newStatus) {
        try {
            setUpdatingId(batchId);
            const updateData = { status: newStatus };
            if (newStatus === 'In Progress') {
                updateData.production_date = new Date().toISOString();
            } else if (newStatus === 'Complete') {
                const yieldQty = prompt("Enter number of units produced (Yield):", "0");
                if (yieldQty === null) {
                    setUpdatingId(null);
                    return; // Cancelled
                }
                updateData.yield_quantity = parseInt(yieldQty) || 0;
                updateData.cure_end_date = new Date().toISOString();
            }

            await updateBatch(batchId, updateData);
            await loadBatches();
        } catch (err) {
            console.error('Failed to update batch:', err);
            alert('Failed to update batch: ' + err.message);
        } finally {
            setUpdatingId(null);
        }
    }

    function handleInputChange(e) {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }

    function handleRecipeChange(e) {
        const recipeId = e.target.value;
        const recipe = recipes.find(r => r.id === parseInt(recipeId));
        setFormData(prev => ({
            ...prev,
            recipe_id: recipeId,
            total_weight: recipe ? recipe.total_oils_weight : 0
        }));
    }

    const getRecipeName = (recipeId) => {
        const recipe = recipes.find(r => r.id === recipeId);
        return recipe ? recipe.name : 'Unknown Recipe';
    };

    const getStatusBadge = (status) => {
        const badges = {
            'Planned': 'badge-info',
            'In Progress': 'badge-warning',
            'Curing': 'badge-purple',
            'Complete': 'badge-success',
            'Cancelled': 'badge-error'
        };
        return badges[status] || 'badge-info';
    };

    const getStatusIcon = (status) => {
        const icons = {
            'Planned': Calendar,
            'In Progress': Clock,
            'Curing': Clock,
            'Complete': CheckCircle2,
            'Cancelled': XCircle
        };
        return icons[status] || Calendar;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">
                    <Factory className="icon" />
                    Production Batches
                </h1>
                <button className="btn btn-primary" onClick={openModal}>
                    <Plus size={18} />
                    New Batch
                </button>
            </div>

            {/* Status Filter */}
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-lg)', flexWrap: 'wrap' }}>
                <button
                    className={`btn ${!statusFilter ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setStatusFilter('')}
                >
                    All
                </button>
                {STATUS_OPTIONS.map(status => (
                    <button
                        key={status}
                        className={`btn ${statusFilter === status ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setStatusFilter(status)}
                    >
                        {status}
                    </button>
                ))}
            </div>

            {/* Batches */}
            {loading ? (
                <div className="empty-state">
                    <div className="loading-spinner" />
                </div>
            ) : batches.length === 0 ? (
                <div className="empty-state">
                    <Package />
                    <h3>No production batches</h3>
                    <p>Start a new batch from a recipe or create one here.</p>
                    <button className="btn btn-primary" onClick={openModal}>
                        <Plus size={18} />
                        New Batch
                    </button>
                </div>
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Lot Number</th>
                                <th>Recipe</th>
                                <th>Status</th>
                                <th>Planned Date</th>
                                <th>Production Date</th>
                                <th>Weight</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {batches.map(batch => {
                                const StatusIcon = getStatusIcon(batch.status);
                                return (
                                    <tr key={batch.id}>
                                        <td>
                                            <strong style={{ fontFamily: 'monospace' }}>{batch.lot_number}</strong>
                                        </td>
                                        <td>{getRecipeName(batch.recipe_id)}</td>
                                        <td>
                                            <span className={`badge ${getStatusBadge(batch.status)}`}>
                                                <StatusIcon size={12} style={{ marginRight: '4px' }} />
                                                {batch.status}
                                            </span>
                                        </td>
                                        <td>{formatDate(batch.planned_date)}</td>
                                        <td>{formatDate(batch.production_date)}</td>
                                        <td>{batch.total_weight}g</td>
                                        <td>
                                            <select
                                                className="form-input form-select"
                                                style={{ width: '140px', padding: '4px 8px', opacity: updatingId === batch.id ? 0.5 : 1 }}
                                                value={batch.status}
                                                onChange={(e) => handleStatusChange(batch.id, e.target.value)}
                                                disabled={updatingId === batch.id}
                                            >
                                                {STATUS_OPTIONS.map(status => (
                                                    <option key={status} value={status}>{status}</option>
                                                ))}
                                            </select>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">New Production Batch</h2>
                            <button className="btn-icon" onClick={closeModal}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Lot Number *</label>
                                    <input
                                        type="text"
                                        name="lot_number"
                                        className="form-input"
                                        value={formData.lot_number}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Recipe *</label>
                                    <select
                                        name="recipe_id"
                                        className="form-input form-select"
                                        value={formData.recipe_id}
                                        onChange={handleRecipeChange}
                                        required
                                    >
                                        <option value="">Select a recipe</option>
                                        {recipes.map(r => (
                                            <option key={r.id} value={r.id}>{r.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Scale Factor</label>
                                        <input
                                            type="number"
                                            name="scale_factor"
                                            className="form-input"
                                            value={formData.scale_factor}
                                            onChange={handleInputChange}
                                            step="0.1"
                                            min="0.1"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Total Weight (g)</label>
                                        <input
                                            type="number"
                                            name="total_weight"
                                            className="form-input"
                                            value={formData.total_weight}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Planned Date</label>
                                    <input
                                        type="date"
                                        name="planned_date"
                                        className="form-input"
                                        value={formData.planned_date}
                                        onChange={handleInputChange}
                                    />
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
                                    Create Batch
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
