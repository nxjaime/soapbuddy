import { useEffect, useState } from 'react';
import {
    Users,
    Plus,
    Search,
    Edit2,
    Mail,
    Phone,
    MapPin,
    Briefcase,
    User,
    X
} from 'lucide-react';
import {
    getCustomers,
    createCustomer,
    updateCustomer
} from '../api/client';

export default function Customers() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);

    // Form Data
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        customer_type: 'Retail',
        notes: ''
    });

    useEffect(() => {
        loadCustomers();
    }, []);

    async function loadCustomers() {
        try {
            setLoading(true);
            const data = await getCustomers();
            setCustomers(data);
        } catch (err) {
            console.error('Failed to load customers:', err);
        } finally {
            setLoading(false);
        }
    }

    function openModal(customer = null) {
        if (customer) {
            setEditingCustomer(customer);
            setFormData({
                name: customer.name,
                email: customer.email || '',
                phone: customer.phone || '',
                address: customer.address || '',
                customer_type: customer.customer_type || 'Retail',
                notes: customer.notes || ''
            });
        } else {
            setEditingCustomer(null);
            setFormData({
                name: '',
                email: '',
                phone: '',
                address: '',
                customer_type: 'Retail',
                notes: ''
            });
        }
        setIsModalOpen(true);
    }

    function closeModal() {
        setIsModalOpen(false);
        setEditingCustomer(null);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            if (editingCustomer) {
                await updateCustomer(editingCustomer.id, formData);
            } else {
                await createCustomer(formData);
            }
            closeModal();
            loadCustomers();
        } catch (err) {
            console.error('Failed to save customer:', err);
            alert('Failed to save customer: ' + err.message);
        }
    }

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">
                    <Users className="icon" />
                    Customers
                </h1>
                <button className="btn btn-primary" onClick={() => openModal()}>
                    <Plus size={18} />
                    New Customer
                </button>
            </div>

            {/* Search */}
            <div className="search-bar">
                <Search className="search-icon" size={20} />
                <input
                    type="text"
                    className="search-input"
                    placeholder="Search customers..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="empty-state">
                    <div className="loading-spinner" />
                </div>
            ) : filteredCustomers.length === 0 ? (
                <div className="empty-state">
                    <Users size={48} style={{ marginBottom: '16px', color: 'var(--text-muted)', opacity: 0.5 }} />
                    <h3>No customers found</h3>
                    <p>{search ? 'Try adjusting your search terms.' : 'Add your first customer to get started.'}</p>
                    {!search && (
                        <button className="btn btn-primary" onClick={() => openModal()}>
                            <Plus size={18} />
                            New Customer
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid-view">
                    {filteredCustomers.map(customer => (
                        <div key={customer.id} className="card customer-card">
                            <div className="card-header" style={{ marginBottom: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        background: 'var(--color-bg)',
                                        color: 'var(--color-primary)'
                                    }}>
                                        {customer.customer_type === 'Wholesale' ? <Briefcase size={20} /> : <User size={20} />}
                                    </div>
                                    <div style={{ overflow: 'hidden' }}>
                                        <h3 className="card-title" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {customer.name}
                                        </h3>
                                        <div className={`badge ${customer.customer_type === 'Wholesale' ? 'badge-purple' : 'badge-blue'}`} style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                                            {customer.customer_type}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    className="btn-icon"
                                    onClick={() => openModal(customer)}
                                    title="Edit"
                                >
                                    <Edit2 size={16} />
                                </button>
                            </div>

                            <div className="card-content" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                {customer.email && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                        <Mail size={14} />
                                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{customer.email}</span>
                                    </div>
                                )}
                                {customer.phone && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                        <Phone size={14} />
                                        <span>{customer.phone}</span>
                                    </div>
                                )}
                                {customer.address && (
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                                        <MapPin size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                                        <span style={{ lineHeight: '1.4' }}>{customer.address}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">{editingCustomer ? 'Edit Customer' : 'New Customer'}</h2>
                            <button className="btn-icon" onClick={closeModal}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Name *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Email</label>
                                        <input
                                            type="email"
                                            className="form-input"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Phone</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Address</label>
                                    <textarea
                                        className="form-input"
                                        rows="2"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Type</label>
                                    <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                            <input
                                                type="radio"
                                                name="customer_type"
                                                value="Retail"
                                                checked={formData.customer_type === 'Retail'}
                                                onChange={(e) => setFormData({ ...formData, customer_type: e.target.value })}
                                            />
                                            Retail
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                            <input
                                                type="radio"
                                                name="customer_type"
                                                value="Wholesale"
                                                checked={formData.customer_type === 'Wholesale'}
                                                onChange={(e) => setFormData({ ...formData, customer_type: e.target.value })}
                                            />
                                            Wholesale
                                        </label>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Notes</label>
                                    <textarea
                                        className="form-input"
                                        rows="3"
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingCustomer ? 'Save Changes' : 'Create Customer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
