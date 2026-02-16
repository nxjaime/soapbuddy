import { useEffect, useState } from 'react';
import { Box, Plus, Edit2, Trash2, X } from 'lucide-react';
import { getMolds, createMold, updateMold, deleteMold } from '../api/client';

const MOLD_TYPES = ['Loaf', 'Individual', 'Cylinder', 'Slab', 'Other'];

const emptyForm = {
    name: '',
    type: 'Loaf',
    volume_ml: '',
    length_cm: '',
    width_cm: '',
    height_cm: '',
    notes: ''
};

export default function MoldManager() {
    const [molds, setMolds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMold, setEditingMold] = useState(null);
    const [formData, setFormData] = useState(emptyForm);

    useEffect(() => { loadMolds(); }, []);

    async function loadMolds() {
        try {
            setLoading(true);
            const data = await getMolds();
            setMolds(data || []);
        } catch (err) {
            console.error('Failed to load molds:', err);
        } finally {
            setLoading(false);
        }
    }

    function openModal(mold = null) {
        if (mold) {
            setEditingMold(mold);
            setFormData({
                name: mold.name,
                type: mold.type,
                volume_ml: mold.volume_ml ?? '',
                length_cm: mold.length_cm ?? '',
                width_cm: mold.width_cm ?? '',
                height_cm: mold.height_cm ?? '',
                notes: mold.notes ?? ''
            });
        } else {
            setEditingMold(null);
            setFormData(emptyForm);
        }
        setIsModalOpen(true);
    }

    function closeModal() {
        setIsModalOpen(false);
        setEditingMold(null);
    }

    function handleChange(e) {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Auto-calculate volume from dimensions when all three are provided
    function handleDimensionChange(e) {
        const { name, value } = e.target;
        const updated = { ...formData, [name]: value };
        const l = parseFloat(updated.length_cm);
        const w = parseFloat(updated.width_cm);
        const h = parseFloat(updated.height_cm);
        if (!isNaN(l) && !isNaN(w) && !isNaN(h)) {
            // 1 cm³ = 1 mL
            updated.volume_ml = (l * w * h).toFixed(1);
        }
        setFormData(updated);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            const payload = {
                name: formData.name,
                type: formData.type,
                volume_ml: parseFloat(formData.volume_ml) || 0,
                length_cm: formData.length_cm !== '' ? parseFloat(formData.length_cm) : null,
                width_cm: formData.width_cm !== '' ? parseFloat(formData.width_cm) : null,
                height_cm: formData.height_cm !== '' ? parseFloat(formData.height_cm) : null,
                notes: formData.notes || null
            };
            if (editingMold) {
                await updateMold(editingMold.id, payload);
            } else {
                await createMold(payload);
            }
            closeModal();
            loadMolds();
        } catch (err) {
            console.error('Failed to save mold:', err);
            alert('Failed to save mold: ' + err.message);
        }
    }

    async function handleDelete(id) {
        if (!confirm('Delete this mold?')) return;
        try {
            await deleteMold(id);
            loadMolds();
        } catch (err) {
            console.error('Failed to delete mold:', err);
            alert('Failed to delete mold: ' + err.message);
        }
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">
                    <Box className="icon" />
                    Mold Manager
                </h1>
                <button className="btn btn-primary" onClick={() => openModal()}>
                    <Plus size={18} />
                    New Mold
                </button>
            </div>

            {loading ? (
                <div className="empty-state"><div className="loading-spinner" /></div>
            ) : molds.length === 0 ? (
                <div className="empty-state">
                    <Box size={48} />
                    <h3>No molds yet</h3>
                    <p>Add your molds to use them in the recipe resizer.</p>
                    <button className="btn btn-primary" onClick={() => openModal()}>
                        <Plus size={18} />
                        New Mold
                    </button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--spacing-lg)' }}>
                    {molds.map(mold => (
                        <div key={mold.id} className="card">
                            <div className="card-header">
                                <h3 className="card-title">{mold.name}</h3>
                                <span className="badge badge-purple">{mold.type}</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
                                <div>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Volume</span>
                                    <div style={{ fontWeight: 500 }}>{mold.volume_ml ? `${mold.volume_ml} mL` : '—'}</div>
                                </div>
                                {(mold.length_cm || mold.width_cm || mold.height_cm) && (
                                    <div>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Dimensions (cm)</span>
                                        <div style={{ fontWeight: 500 }}>
                                            {[mold.length_cm, mold.width_cm, mold.height_cm].filter(Boolean).join(' × ')}
                                        </div>
                                    </div>
                                )}
                            </div>
                            {mold.notes && (
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 'var(--spacing-md)' }}>
                                    {mold.notes}
                                </p>
                            )}
                            <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginTop: 'auto' }}>
                                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => openModal(mold)}>
                                    <Edit2 size={16} />
                                    Edit
                                </button>
                                <button
                                    className="btn-icon"
                                    style={{ color: 'var(--color-error)' }}
                                    onClick={() => handleDelete(mold.id)}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">{editingMold ? 'Edit Mold' : 'New Mold'}</h2>
                            <button className="btn-icon" onClick={closeModal}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Mold Name *</label>
                                        <input
                                            type="text"
                                            name="name"
                                            className="form-input"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            placeholder="e.g. 4lb Wooden Loaf"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Type</label>
                                        <select
                                            name="type"
                                            className="form-input form-select"
                                            value={formData.type}
                                            onChange={handleChange}
                                        >
                                            {MOLD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Volume (mL)</label>
                                    <input
                                        type="number"
                                        name="volume_ml"
                                        className="form-input"
                                        value={formData.volume_ml}
                                        onChange={handleChange}
                                        min="0"
                                        placeholder="Auto-calculated from dimensions"
                                    />
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                        Fill dimensions below to auto-calculate, or enter manually.
                                    </p>
                                </div>

                                <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                                    <div className="form-group">
                                        <label className="form-label">Length (cm)</label>
                                        <input type="number" name="length_cm" className="form-input" value={formData.length_cm} onChange={handleDimensionChange} min="0" step="0.1" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Width (cm)</label>
                                        <input type="number" name="width_cm" className="form-input" value={formData.width_cm} onChange={handleDimensionChange} min="0" step="0.1" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Height (cm)</label>
                                        <input type="number" name="height_cm" className="form-input" value={formData.height_cm} onChange={handleDimensionChange} min="0" step="0.1" />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Notes</label>
                                    <textarea
                                        name="notes"
                                        className="form-input"
                                        rows="2"
                                        value={formData.notes}
                                        onChange={handleChange}
                                        placeholder="Material, colour, capacity notes..."
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="btn btn-primary">
                                    {editingMold ? 'Update Mold' : 'Create Mold'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
