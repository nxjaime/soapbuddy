import { useEffect, useState } from 'react';
import {
    Truck,
    Plus,
    Search,
    Edit2,
    Trash2,
    X,
    Globe,
    Phone,
    Mail
} from 'lucide-react';
import {
    getSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier
} from '../api/client';

export default function Suppliers() {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        contact_name: '',
        email: '',
        phone: '',
        website: '',
        notes: ''
    });

    useEffect(() => {
        loadSuppliers();
    }, []);

    async function loadSuppliers() {
        try {
            setLoading(true);
            const data = await getSuppliers();
            setSuppliers(data);
        } catch (err) {
            console.error('Failed to load suppliers:', err);
        } finally {
            setLoading(false);
        }
    }

    function openModal(supplier = null) {
        if (supplier) {
            setEditingSupplier(supplier);
            setFormData({
                name: supplier.name,
                contact_name: supplier.contact_name || '',
                email: supplier.email || '',
                phone: supplier.phone || '',
                website: supplier.website || '',
                notes: supplier.notes || ''
            });
        } else {
            setEditingSupplier(null);
            setFormData({
                name: '',
                contact_name: '',
                email: '',
                phone: '',
                website: '',
                notes: ''
            });
        }
        setIsModalOpen(true);
    }

    function closeModal() {
        setIsModalOpen(false);
        setEditingSupplier(null);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            if (editingSupplier) {
                await updateSupplier(editingSupplier.id, formData);
            } else {
                await createSupplier(formData);
            }
            closeModal();
            loadSuppliers();
        } catch (err) {
            console.error('Failed to save supplier:', err);
            alert('Failed to save supplier: ' + err.message);
        }
    }

    async function handleDelete(id) {
        if (!confirm('Are you sure you want to delete this supplier?')) return;
        try {
            await deleteSupplier(id);
            loadSuppliers();
        } catch (err) {
            console.error('Failed to delete supplier:', err);
            alert('Failed to delete supplier: ' + err.message);
        }
    }

    function handleInputChange(e) {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }

    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.contact_name && s.contact_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">
                    <Truck className="icon" />
                    Suppliers
                </h1>
                <button className="btn btn-primary" onClick={() => openModal()}>
                    <Plus size={18} />
                    New Supplier
                </button>
            </div>

            {/* Search */}
            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                <div style={{ position: 'relative', maxWidth: '300px' }}>
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
                        placeholder="Search suppliers..."
                        className="form-input"
                        style={{ paddingLeft: '40px' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Suppliers Grid */}
            {loading ? (
                <div className="empty-state">
                    <div className="loading-spinner" />
                </div>
            ) : filteredSuppliers.length === 0 ? (
                <div className="empty-state">
                    <Truck size={48} style={{ marginBottom: '16px', color: 'var(--text-muted)', opacity: 0.5 }} />
                    <h3>No suppliers found</h3>
                    <p>Add your first supplier to track where you buy ingredients.</p>
                    <button className="btn btn-primary" onClick={() => openModal()}>
                        <Plus size={18} />
                        New Supplier
                    </button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--spacing-lg)' }}>
                    {filteredSuppliers.map(supplier => (
                        <div key={supplier.id} className="card">
                            <div className="card-header">
                                <h3 className="card-title">{supplier.name}</h3>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button className="btn-icon" onClick={() => openModal(supplier)}>
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        className="btn-icon"
                                        style={{ color: 'var(--color-error)' }}
                                        onClick={() => handleDelete(supplier.id)}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {supplier.contact_name && (
                                <div style={{ marginBottom: 'var(--spacing-sm)', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                    Contact: {supplier.contact_name}
                                </div>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                                {supplier.email && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Mail size={14} style={{ color: 'var(--text-muted)' }} />
                                        <a href={`mailto:${supplier.email}`} style={{ color: 'var(--color-primary)' }}>{supplier.email}</a>
                                    </div>
                                )}
                                {supplier.phone && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Phone size={14} style={{ color: 'var(--text-muted)' }} />
                                        <span>{supplier.phone}</span>
                                    </div>
                                )}
                                {supplier.website && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Globe size={14} style={{ color: 'var(--text-muted)' }} />
                                        <a href={supplier.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)' }}>
                                            Visit Website
                                        </a>
                                    </div>
                                )}
                            </div>

                            {supplier.notes && (
                                <div style={{ marginTop: 'var(--spacing-md)', fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                    "{supplier.notes}"
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {editingSupplier ? 'Edit Supplier' : 'New Supplier'}
                            </h2>
                            <button className="btn-icon" onClick={closeModal}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Company Name *</label>
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
                                    <label className="form-label">Contact Person</label>
                                    <input
                                        type="text"
                                        name="contact_name"
                                        className="form-input"
                                        value={formData.contact_name}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            className="form-input"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Phone</label>
                                        <input
                                            type="text"
                                            name="phone"
                                            className="form-input"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Website</label>
                                    <input
                                        type="url"
                                        name="website"
                                        className="form-input"
                                        placeholder="https://example.com"
                                        value={formData.website}
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
                                    {editingSupplier ? 'Update Supplier' : 'Create Supplier'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
