import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Beaker,
    Plus,
    Trash2,
    Edit2,
    FileText,
    Search,
    X,
    FlaskConical
} from 'lucide-react';
import {
    getFormulations,
    updateFormulation,
    deleteFormulation
} from '../api/client';

export default function Formulations() {
    const navigate = useNavigate();
    const [formulations, setFormulations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingFormulation, setEditingFormulation] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', description: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadFormulations();
    }, []);

    async function loadFormulations() {
        try {
            setLoading(true);
            const data = await getFormulations();
            setFormulations(data);
        } catch (err) {
            console.error('Failed to load formulations:', err);
        } finally {
            setLoading(false);
        }
    }

    function openEditModal(formulation) {
        setEditingFormulation(formulation);
        setEditForm({ name: formulation.name, description: formulation.description || '' });
        setIsEditModalOpen(true);
    }

    function closeEditModal() {
        setIsEditModalOpen(false);
        setEditingFormulation(null);
        setEditForm({ name: '', description: '' });
    }

    async function handleEditSubmit(e) {
        e.preventDefault();
        if (!editForm.name.trim()) return;
        try {
            setIsSubmitting(true);
            await updateFormulation(editingFormulation.id, {
                name: editForm.name.trim(),
                description: editForm.description.trim()
            });
            await loadFormulations();
            closeEditModal();
        } catch (err) {
            console.error('Failed to update formulation:', err);
            alert('Failed to update: ' + err.message);
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleDelete(id) {
        if (!confirm('Delete this formulation? This cannot be undone.')) return;
        try {
            await deleteFormulation(id);
            setFormulations(prev => prev.filter(f => f.id !== id));
        } catch (err) {
            console.error('Failed to delete formulation:', err);
            alert('Failed to delete: ' + err.message);
        }
    }

    function handleLoadInDesigner(formulation) {
        sessionStorage.setItem('load_formulation', JSON.stringify(formulation));
        navigate('/formula-designer');
    }

    function handleUseAsRecipe(formulation) {
        navigate(`/recipes?from_formula=${formulation.id}`);
    }

    const filtered = formulations.filter(f =>
        f.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">
                    <Beaker className="icon" />
                    Formulations Library
                </h1>
                <button className="btn btn-primary" onClick={() => navigate('/formula-designer')}>
                    <Plus size={16} /> New Formula
                </button>
            </div>

            <div className="card" style={{ marginBottom: 'var(--spacing-lg)', padding: 'var(--spacing-md)' }}>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    Save your tested oil ratios as <strong>Formulations</strong>. Load them into the Formula Designer to calculate lye, or use them as a template to create a new Recipe.
                </p>
            </div>

            <div className="search-bar" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <Search className="search-icon" size={20} />
                <input
                    type="text"
                    className="search-input"
                    placeholder="Search formulations..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="empty-state"><div className="loading-spinner" /></div>
            ) : filtered.length === 0 ? (
                <div className="empty-state">
                    <FlaskConical size={48} style={{ marginBottom: '16px', color: 'var(--text-muted)', opacity: 0.5 }} />
                    <h3>{search ? 'No formulations found' : 'No saved formulations yet'}</h3>
                    <p>{search ? 'Try a different search.' : 'Go to Formula Designer and click Save to store your oil ratios here.'}</p>
                    {!search && (
                        <button className="btn btn-primary" style={{ marginTop: 'var(--spacing-md)' }} onClick={() => navigate('/formula-designer')}>
                            Open Formula Designer
                        </button>
                    )}
                </div>
            ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'var(--glass-bg)', borderBottom: '1px solid var(--glass-border)' }}>
                                <th style={{ padding: 'var(--spacing-md)', textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Name</th>
                                <th style={{ padding: 'var(--spacing-md)', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Oils</th>
                                <th style={{ padding: 'var(--spacing-md)', textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Description</th>
                                <th style={{ padding: 'var(--spacing-md)', textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Created</th>
                                <th style={{ padding: 'var(--spacing-md)', textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(f => (
                                <tr key={f.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                    <td style={{ padding: 'var(--spacing-md)', fontWeight: 600 }}>{f.name}</td>
                                    <td style={{ padding: 'var(--spacing-md)', textAlign: 'center' }}>
                                        <span className="badge badge-info">{(f.oils || []).length}</span>
                                    </td>
                                    <td style={{ padding: 'var(--spacing-md)', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                        {f.description || '—'}
                                    </td>
                                    <td style={{ padding: 'var(--spacing-md)', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                        {new Date(f.created_at).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: 'var(--spacing-md)', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'flex-end' }}>
                                            <button
                                                className="btn btn-secondary"
                                                style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                                                onClick={() => handleLoadInDesigner(f)}
                                                title="Load in Formula Designer"
                                            >
                                                <Beaker size={14} /> Load
                                            </button>
                                            <button
                                                className="btn btn-secondary"
                                                style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                                                onClick={() => handleUseAsRecipe(f)}
                                                title="Create Recipe from this Formula"
                                            >
                                                <FileText size={14} /> Recipe
                                            </button>
                                            <button className="btn-icon" onClick={() => openEditModal(f)} title="Edit name/description">
                                                <Edit2 size={16} />
                                            </button>
                                            <button className="btn-icon" style={{ color: 'var(--color-error)' }} onClick={() => handleDelete(f.id)} title="Delete">
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

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="modal-overlay" onClick={closeEditModal}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Edit Formulation</h2>
                            <button className="btn-icon" onClick={closeEditModal}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleEditSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Name *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={editForm.name}
                                        onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea
                                        className="form-input"
                                        rows={3}
                                        value={editForm.description}
                                        onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="Optional notes about this formulation..."
                                    />
                                </div>
                                {editingFormulation?.oils?.length > 0 && (
                                    <div>
                                        <label className="form-label">Oils ({editingFormulation.oils.length})</label>
                                        <div style={{ background: 'var(--glass-bg)', borderRadius: 'var(--radius-sm)', padding: 'var(--spacing-sm)', fontSize: '0.875rem' }}>
                                            {editingFormulation.oils.map((oil, idx) => (
                                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                                                    <span>{oil.name}</span>
                                                    <span style={{ color: 'var(--text-muted)' }}>{oil.percentage}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeEditModal}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
