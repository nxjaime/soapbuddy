import { useEffect, useState, useMemo } from 'react';
import {
    Users,
    Plus,
    Search,
    Edit2,
    Mail,
    Phone,
    Briefcase,
    User,
    X,
    Trash2,
    ShoppingBag,
    DollarSign,
    ChevronDown,
    ChevronUp,
    AlertTriangle
} from 'lucide-react';
import {
    getCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getSalesOrders
} from '../api/client';
import { useSubscription } from '../contexts/SubscriptionContext';

export default function Customers() {
    const [customers, setCustomers] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [expandedCustomer, setExpandedCustomer] = useState(null);

    const { hasFeature } = useSubscription();
    const canSeeAnalytics = hasFeature('salesTracking');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        customer_type: 'Retail',
        notes: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            setLoading(true);
            const [customersData, ordersData] = await Promise.all([
                getCustomers(),
                getSalesOrders()
            ]);
            setCustomers(customersData);
            setOrders(ordersData);
        } catch (err) {
            console.error('Failed to load data:', err);
        } finally {
            setLoading(false);
        }
    }

    // Compute per-customer stats from the loaded orders
    function getCustomerStats(customerId) {
        const customerOrders = orders.filter(
            o => o.customer_id === customerId && o.status !== 'Cancelled'
        );
        const totalSpend = customerOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
        return { orderCount: customerOrders.length, totalSpend };
    }

    function getCustomerOrders(customerId) {
        return orders
            .filter(o => o.customer_id === customerId)
            .sort((a, b) => new Date(b.sale_date) - new Date(a.sale_date));
    }

    const retentionStats = useMemo(() => {
        const customersWithOrders = customers.filter(c => {
            const customerOrders = orders.filter(
                o => o.customer_id === c.id && o.status !== 'Cancelled'
            );
            return customerOrders.length > 0;
        });

        const repeatBuyers = customers.filter(c => {
            const customerOrders = orders.filter(
                o => o.customer_id === c.id && o.status !== 'Cancelled'
            );
            return customerOrders.length > 1;
        });

        const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
        const atRisk = customers.filter(c => {
            const customerOrders = orders.filter(
                o => o.customer_id === c.id && o.status !== 'Cancelled'
            );
            if (customerOrders.length === 0) return false;
            const lastOrder = customerOrders.reduce((latest, o) =>
                new Date(o.sale_date) > new Date(latest.sale_date) ? o : latest
            );
            return new Date(lastOrder.sale_date) < sixtyDaysAgo;
        });

        const retailRevenue = orders
            .filter(o => {
                const c = customers.find(c => c.id === o.customer_id);
                return c && c.customer_type === 'Retail' && o.status !== 'Cancelled';
            })
            .reduce((sum, o) => sum + (o.total_amount || 0), 0);

        const wholesaleRevenue = orders
            .filter(o => {
                const c = customers.find(c => c.id === o.customer_id);
                return c && c.customer_type === 'Wholesale' && o.status !== 'Cancelled';
            })
            .reduce((sum, o) => sum + (o.total_amount || 0), 0);

        return {
            totalWithOrders: customersWithOrders.length,
            repeatBuyers: repeatBuyers.length,
            repeatRate: customersWithOrders.length > 0
                ? (repeatBuyers.length / customersWithOrders.length) * 100
                : 0,
            atRisk,
            retailRevenue,
            wholesaleRevenue
        };
    }, [customers, orders]);

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
            loadData();
        } catch (err) {
            console.error('Failed to save customer:', err);
            alert('Failed to save customer: ' + err.message);
        }
    }

    async function handleDelete(customer) {
        const { orderCount } = getCustomerStats(customer.id);
        const confirmMsg = orderCount > 0
            ? `Delete "${customer.name}"? They have ${orderCount} order(s). The orders will remain but be unlinked.`
            : `Delete "${customer.name}"?`;
        if (!confirm(confirmMsg)) return;
        try {
            await deleteCustomer(customer.id);
            loadData();
        } catch (err) {
            console.error('Failed to delete customer:', err);
            alert('Failed to delete customer: ' + err.message);
        }
    }

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Completed': return 'badge-green';
            case 'Draft': return 'badge-yellow';
            case 'Cancelled': return 'badge-red';
            default: return 'badge-blue';
        }
    };

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

            {!loading && canSeeAnalytics && customers.length > 0 && (
                <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                    {/* Retention Stats Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
                        <div className="card" style={{ padding: 'var(--spacing-md)' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Repeat Buyers</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{retentionStats.repeatBuyers}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                {retentionStats.repeatRate.toFixed(0)}% of buyers
                            </div>
                            <div style={{ height: '4px', background: 'var(--glass-bg)', borderRadius: '2px', marginTop: '8px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${retentionStats.repeatRate}%`, background: 'var(--color-primary)', borderRadius: '2px' }} />
                            </div>
                        </div>
                        <div className="card" style={{ padding: 'var(--spacing-md)' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Retail Revenue</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-success)' }}>
                                ${retentionStats.retailRevenue.toFixed(2)}
                            </div>
                        </div>
                        <div className="card" style={{ padding: 'var(--spacing-md)' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Wholesale Revenue</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                                ${retentionStats.wholesaleRevenue.toFixed(2)}
                            </div>
                        </div>
                    </div>

                    {/* At-Risk Customers */}
                    {retentionStats.atRisk.length > 0 && (
                        <div className="card" style={{ padding: 'var(--spacing-md)', borderLeft: '3px solid var(--color-warning)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--spacing-sm)', color: 'var(--color-warning)', fontWeight: 600 }}>
                                <AlertTriangle size={16} />
                                {retentionStats.atRisk.length} customer{retentionStats.atRisk.length > 1 ? 's' : ''} haven't ordered in 60+ days
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {retentionStats.atRisk.map(c => (
                                    <span key={c.id} className="badge badge-yellow">{c.name}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                    {filteredCustomers.map(customer => {
                        const { orderCount, totalSpend } = getCustomerStats(customer.id);
                        const isExpanded = expandedCustomer === customer.id;
                        const customerOrders = isExpanded ? getCustomerOrders(customer.id) : [];

                        return (
                            <div key={customer.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                                {/* Customer Row */}
                                <div style={{ padding: 'var(--spacing-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                                    {/* Avatar + Name */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, overflow: 'hidden' }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: '44px',
                                            height: '44px',
                                            borderRadius: '50%',
                                            background: 'var(--glass-bg)',
                                            color: 'var(--color-primary)',
                                            flexShrink: 0
                                        }}>
                                            {customer.customer_type === 'Wholesale' ? <Briefcase size={20} /> : <User size={20} />}
                                        </div>
                                        <div style={{ overflow: 'hidden' }}>
                                            <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {customer.name}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                                                <span className={`badge ${customer.customer_type === 'Wholesale' ? 'badge-purple' : 'badge-blue'}`} style={{ fontSize: '0.72rem' }}>
                                                    {customer.customer_type}
                                                </span>
                                                {customer.email && (
                                                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <Mail size={12} /> {customer.email}
                                                    </span>
                                                )}
                                                {customer.phone && (
                                                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <Phone size={12} /> {customer.phone}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-lg)', flexShrink: 0 }}>
                                        <div style={{ textAlign: 'center', minWidth: '60px' }}>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Orders</div>
                                            <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                                <ShoppingBag size={14} style={{ color: 'var(--color-primary)' }} />
                                                {orderCount}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'center', minWidth: '70px' }}>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Lifetime</div>
                                            <div style={{ fontWeight: 600, color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                                                <DollarSign size={14} />
                                                {totalSpend.toFixed(2)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                                        <button
                                            className="btn-icon"
                                            onClick={() => openModal(customer)}
                                            title="Edit"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            className="btn-icon"
                                            onClick={() => handleDelete(customer)}
                                            title="Delete"
                                            style={{ color: 'var(--color-error)' }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                        {orderCount > 0 && (
                                            <button
                                                className="btn-icon"
                                                onClick={() => setExpandedCustomer(isExpanded ? null : customer.id)}
                                                title={isExpanded ? 'Hide orders' : 'View orders'}
                                                style={{ color: 'var(--color-info)' }}
                                            >
                                                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Inline Order History */}
                                {isExpanded && (
                                    <div style={{ borderTop: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.08)', padding: 'var(--spacing-md)' }}>
                                        <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-sm)' }}>
                                            Order History
                                        </h4>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                                            <thead>
                                                <tr style={{ color: 'var(--text-muted)', textAlign: 'left' }}>
                                                    <th style={{ paddingBottom: '8px' }}>Date</th>
                                                    <th style={{ paddingBottom: '8px' }}>Status</th>
                                                    <th style={{ paddingBottom: '8px' }}>Payment</th>
                                                    <th style={{ paddingBottom: '8px', textAlign: 'right' }}>Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {customerOrders.map(order => (
                                                    <tr key={order.id} style={{ borderTop: '1px solid var(--glass-border)' }}>
                                                        <td style={{ padding: '8px 0' }}>
                                                            {new Date(order.sale_date).toLocaleDateString()}
                                                        </td>
                                                        <td style={{ padding: '8px 0' }}>
                                                            <span className={`badge ${getStatusBadge(order.status)}`} style={{ fontSize: '0.75rem' }}>
                                                                {order.status}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: '8px 0' }}>
                                                            <span className={`badge ${order.payment_status === 'Paid' ? 'badge-green' : 'badge-yellow'}`} style={{ fontSize: '0.75rem' }}>
                                                                {order.payment_status}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 600 }}>
                                                            ${(order.total_amount || 0).toFixed(2)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        );
                    })}
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
