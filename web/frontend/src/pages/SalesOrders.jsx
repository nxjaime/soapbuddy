import { useEffect, useState } from 'react';
import {
    Plus,
    ChevronDown,
    ChevronUp,
    DollarSign,
    X,
    Trash2,
    Edit3
} from 'lucide-react';
import {
    getSalesOrders,
    createSalesOrder,
    updateSalesOrder,
    getCustomers,
    getRecipes,
    getLocations
} from '../api/client';

export default function SalesOrders() {
    const [orders, setOrders] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [recipes, setRecipes] = useState([]);
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [expandedOrder, setExpandedOrder] = useState(null);
    const [editingOrder, setEditingOrder] = useState(null);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        customer_id: '',
        status: 'Completed',
        payment_status: 'Paid',
        source_location_id: '',
        items: []
    });

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        try {
            setLoading(true);
            const [ordersData, customersData, recipesData, locationsData] = await Promise.all([
                getSalesOrders(),
                getCustomers(),
                getRecipes(),
                getLocations()
            ]);
            setOrders(ordersData);
            setCustomers(customersData);
            setRecipes(recipesData);
            setLocations(locationsData);
        } catch (err) {
            console.error('Failed to load data:', err);
        } finally {
            setLoading(false);
        }
    }

    function openModal(order = null) {
        if (order) {
            setEditingOrder(order);
            setFormData({
                customer_id: order.customer_id || '',
                status: order.status || 'Completed',
                payment_status: order.payment_status || 'Paid',
                source_location_id: '',
                items: order.items?.map(i => ({
                    recipe_id: String(i.recipe_id),
                    quantity: i.quantity,
                    unit_price: i.unit_price,
                    discount: i.discount || 0
                })) || []
            });
        } else {
            setEditingOrder(null);
            setFormData({
                customer_id: '',
                status: 'Completed',
                payment_status: 'Paid',
                source_location_id: '',
                items: []
            });
        }
        setIsModalOpen(true);
    }

    function closeModal() {
        setIsModalOpen(false);
        setEditingOrder(null);
    }

    function addItemToOrder() {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { recipe_id: '', quantity: 1, unit_price: 0, discount: 0 }]
        }));
    }

    function updateOrderItem(index, field, value) {
        setFormData(prev => {
            const updated = [...prev.items];
            updated[index] = { ...updated[index], [field]: value };
            return { ...prev, items: updated };
        });
    }

    function removeOrderItem(index) {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (formData.items.length === 0) {
            alert("Please add at least one item.");
            return;
        }

        // Validate location for statuses that need inventory
        if ((formData.status === 'Draft' || formData.status === 'Completed') && !editingOrder && !formData.source_location_id) {
            alert("Please select a source location for inventory deduction.");
            return;
        }

        setSaving(true);
        try {
            const payload = {
                ...formData,
                customer_id: formData.customer_id ? parseInt(formData.customer_id) : null,
                source_location_id: formData.source_location_id ? parseInt(formData.source_location_id) : null,
                total_amount: formData.items.reduce(
                    (sum, item) => sum + (parseFloat(item.unit_price || 0) * parseFloat(item.quantity || 1)) - parseFloat(item.discount || 0), 0
                ),
                items: formData.items.map(item => ({
                    recipe_id: parseInt(item.recipe_id),
                    quantity: parseInt(item.quantity),
                    unit_price: parseFloat(item.unit_price),
                    discount: parseFloat(item.discount || 0)
                }))
            };

            if (editingOrder) {
                await updateSalesOrder(editingOrder.id, payload);
            } else {
                await createSalesOrder(payload);
            }
            closeModal();
            loadData();
        } catch (err) {
            console.error('Failed to save order:', err);
            alert('Failed to save order: ' + err.message);
        } finally {
            setSaving(false);
        }
    }

    const getCustomerName = (id) => {
        const c = customers.find(cus => cus.id === id);
        return c ? c.name : 'Walk-in Customer';
    };

    const getRecipeName = (id) => {
        const r = recipes.find(rec => rec.id === id);
        return r ? r.name : 'Unknown Product';
    };

    const toggleExpand = (id) => {
        setExpandedOrder(expandedOrder === id ? null : id);
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Completed': return 'badge-green';
            case 'Draft': return 'badge-yellow';
            case 'Cancelled': return 'badge-red';
            default: return 'badge-blue';
        }
    };

    // Check if the current edit is a status change that requires location
    const needsSourceLocation = () => {
        if (!editingOrder) return formData.status === 'Draft' || formData.status === 'Completed';
        const oldStatus = editingOrder.status;
        const newStatus = formData.status;
        return (newStatus === 'Draft' || newStatus === 'Completed') && oldStatus !== 'Draft' && oldStatus !== 'Completed';
    };

    const needsReturnLocation = () => {
        if (!editingOrder) return false;
        const oldStatus = editingOrder.status;
        const newStatus = formData.status;
        return newStatus === 'Cancelled' && (oldStatus === 'Draft' || oldStatus === 'Completed');
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">
                    <DollarSign className="icon" />
                    Sales Orders
                </h1>
                <button className="btn btn-primary" onClick={() => openModal()}>
                    <Plus size={18} />
                    New Order
                </button>
            </div>

            {loading ? (
                <div className="empty-state">
                    <div className="loading-spinner" />
                </div>
            ) : orders.length === 0 ? (
                <div className="empty-state">
                    <DollarSign size={48} style={{ marginBottom: '16px', color: 'var(--text-muted)', opacity: 0.5 }} />
                    <h3>No sales orders found</h3>
                    <p>Record a sale to track your revenue.</p>
                    <button className="btn btn-primary" onClick={() => openModal()}>
                        <Plus size={18} />
                        New Order
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                    {orders.map(order => (
                        <div key={order.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            <div
                                style={{
                                    padding: 'var(--spacing-md)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    cursor: 'pointer',
                                    background: 'var(--glass-bg)'
                                }}
                                onClick={() => toggleExpand(order.id)}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        background: 'var(--glass-bg)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'var(--color-success)'
                                    }}>
                                        <DollarSign size={20} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{getCustomerName(order.customer_id)}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                            {new Date(order.sale_date).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                                    <div className={`badge ${getStatusBadge(order.status)}`}>
                                        {order.status}
                                    </div>
                                    <div style={{ fontWeight: 600 }}>
                                        ${(order.total_amount || 0).toFixed(2)}
                                    </div>
                                    <button
                                        className="btn-icon"
                                        title="Edit Order"
                                        onClick={(e) => { e.stopPropagation(); openModal(order); }}
                                        style={{ color: 'var(--color-info)' }}
                                    >
                                        <Edit3 size={16} />
                                    </button>
                                    {expandedOrder === order.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </div>
                            </div>

                            {expandedOrder === order.id && (
                                <div style={{ padding: 'var(--spacing-md)', borderTop: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.1)' }}>
                                    <h4 style={{ fontSize: '0.9rem', marginBottom: 'var(--spacing-sm)', color: 'var(--text-secondary)' }}>Order Items</h4>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                        <thead>
                                            <tr style={{ color: 'var(--text-muted)', textAlign: 'left' }}>
                                                <th style={{ paddingBottom: '8px' }}>Product</th>
                                                <th style={{ paddingBottom: '8px' }}>Qty</th>
                                                <th style={{ paddingBottom: '8px', textAlign: 'right' }}>Price</th>
                                                <th style={{ paddingBottom: '8px', textAlign: 'right' }}>Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {order.items?.map((item, idx) => (
                                                <tr key={idx} style={{ borderTop: '1px solid var(--glass-border)' }}>
                                                    <td style={{ padding: '8px 0' }}>{getRecipeName(item.recipe_id)}</td>
                                                    <td style={{ padding: '8px 0' }}>{item.quantity}</td>
                                                    <td style={{ padding: '8px 0', textAlign: 'right' }}>${item.unit_price.toFixed(2)}</td>
                                                    <td style={{ padding: '8px 0', textAlign: 'right' }}>${(item.quantity * item.unit_price).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {order.payment_status && (
                                        <div style={{ marginTop: 'var(--spacing-sm)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                            Payment: <span className={`badge ${order.payment_status === 'Paid' ? 'badge-green' : 'badge-yellow'}`}>{order.payment_status}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Create / Edit Order Modal */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" style={{ maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">{editingOrder ? 'Edit Sales Order' : 'New Sales Order'}</h2>
                            <button className="btn-icon" onClick={closeModal}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-row">
                                    <div className="form-group" style={{ flex: 2 }}>
                                        <label className="form-label">Customer</label>
                                        <select
                                            className="form-input form-select"
                                            value={formData.customer_id}
                                            onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                                        >
                                            <option value="">Select Customer (Optional)</option>
                                            {customers.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label className="form-label">Status</label>
                                        <select
                                            className="form-input form-select"
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        >
                                            <option value="Draft">Draft</option>
                                            <option value="Confirmed">Confirmed</option>
                                            <option value="Completed">Completed</option>
                                            <option value="Cancelled">Cancelled</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label className="form-label">Payment Status</label>
                                        <select
                                            className="form-input form-select"
                                            value={formData.payment_status}
                                            onChange={(e) => setFormData({ ...formData, payment_status: e.target.value })}
                                        >
                                            <option value="Unpaid">Unpaid</option>
                                            <option value="Paid">Paid</option>
                                            <option value="Partial">Partial</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Source location picker (when deducting inventory) */}
                                {needsSourceLocation() && (
                                    <div className="form-group" style={{ marginTop: 'var(--spacing-md)' }}>
                                        <label className="form-label" style={{ color: 'var(--color-warning)' }}>
                                            📦 Source Location (inventory will be deducted)
                                        </label>
                                        <select
                                            className="form-input form-select"
                                            value={formData.source_location_id}
                                            onChange={(e) => setFormData({ ...formData, source_location_id: e.target.value })}
                                            required
                                        >
                                            <option value="">Select Location...</option>
                                            {locations.map(loc => (
                                                <option key={loc.id} value={loc.id}>{loc.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Return location picker (when cancelling) */}
                                {needsReturnLocation() && (
                                    <div className="form-group" style={{ marginTop: 'var(--spacing-md)' }}>
                                        <label className="form-label" style={{ color: 'var(--color-info)' }}>
                                            ↩️ Return Location (inventory will be returned)
                                        </label>
                                        <select
                                            className="form-input form-select"
                                            value={formData.return_location_id || ''}
                                            onChange={(e) => setFormData({ ...formData, return_location_id: e.target.value })}
                                            required
                                        >
                                            <option value="">Select Location...</option>
                                            {locations.map(loc => (
                                                <option key={loc.id} value={loc.id}>{loc.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div style={{ marginTop: 'var(--spacing-lg)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-sm)' }}>
                                        <h4 style={{ margin: 0 }}>Items</h4>
                                        <button type="button" className="btn btn-secondary" onClick={addItemToOrder}>
                                            <Plus size={16} />
                                            Add Item
                                        </button>
                                    </div>

                                    {formData.items.map((item, idx) => (
                                        <div key={idx} style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)', alignItems: 'center' }}>
                                            <select
                                                className="form-input form-select"
                                                style={{ flex: 3 }}
                                                value={item.recipe_id}
                                                onChange={(e) => {
                                                    const rId = e.target.value;
                                                    const recipe = recipes.find(r => r.id === parseInt(rId));
                                                    setFormData(prev => {
                                                        const updated = [...prev.items];
                                                        updated[idx] = {
                                                            ...updated[idx],
                                                            recipe_id: rId,
                                                            unit_price: recipe ? (recipe.default_price || 0) : 0
                                                        };
                                                        return { ...prev, items: updated };
                                                    });
                                                }}
                                                required
                                            >
                                                <option value="">Select Product (Recipe)</option>
                                                {recipes.map(r => (
                                                    <option key={r.id} value={r.id}>{r.name}</option>
                                                ))}
                                            </select>
                                            <input
                                                type="number"
                                                className="form-input"
                                                style={{ width: '80px' }}
                                                placeholder="Qty"
                                                value={item.quantity}
                                                onChange={(e) => updateOrderItem(idx, 'quantity', e.target.value)}
                                                min="1"
                                                required
                                            />
                                            <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '8px', position: 'relative' }}>
                                                <span style={{ position: 'absolute', left: '16px', color: 'var(--text-muted)' }}>$</span>
                                                <input
                                                    type="number"
                                                    className="form-input"
                                                    style={{ width: '100px', paddingLeft: '20px' }}
                                                    placeholder="Price"
                                                    value={item.unit_price}
                                                    onChange={(e) => updateOrderItem(idx, 'unit_price', e.target.value)}
                                                    step="0.01"
                                                    required
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                className="btn-icon"
                                                style={{ color: 'var(--color-error)' }}
                                                onClick={() => removeOrderItem(idx)}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}

                                    {formData.items.length > 0 && (
                                        <div style={{ textAlign: 'right', marginTop: 'var(--spacing-sm)', fontWeight: 600, fontSize: '1.1rem' }}>
                                            Total: ${formData.items.reduce(
                                                (sum, item) => sum + (parseFloat(item.unit_price || 0) * parseFloat(item.quantity || 1)) - parseFloat(item.discount || 0), 0
                                            ).toFixed(2)}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Saving...' : editingOrder ? 'Update Order' : 'Create Order'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
