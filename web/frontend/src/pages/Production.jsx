import { useEffect, useState, useMemo } from 'react';
import {
    Factory,
    Plus,
    X,
    Calendar,
    Clock,
    CheckCircle2,
    XCircle,
    Package,
    TrendingUp,
    ChevronUp,
    ChevronDown
} from 'lucide-react';
import { getBatches, getRecipes, createBatch, updateBatch, startBatch, completeBatch } from '../api/client';
import { useSubscription } from '../contexts/SubscriptionContext';

const STATUS_OPTIONS = ['Planned', 'In Progress', 'Curing', 'Complete', 'Cancelled'];

export default function Production() {
    const { hasFeature } = useSubscription();
    const canSeeAnalytics = hasFeature('production');

    const [batches, setBatches] = useState([]);
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showEfficiency, setShowEfficiency] = useState(false);

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

            if (newStatus === 'In Progress') {
                // start_batch deducts ingredients and populates usage rows
                await startBatch(batchId);
            } else if (newStatus === 'Complete') {
                const yieldQty = prompt("Enter number of units produced (Yield):", "0");
                if (yieldQty === null) {
                    setUpdatingId(null);
                    return; // Cancelled
                }
                // complete_batch adds yield to stock, no ingredient deduction
                await completeBatch(batchId, parseInt(yieldQty) || 0);
            } else {
                // Other transitions (Curing, Cancelled) — plain update
                await updateBatch(batchId, { status: newStatus });
            }

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
