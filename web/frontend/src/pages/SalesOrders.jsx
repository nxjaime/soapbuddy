import { useEffect, useState } from 'react';
import {
    ShoppingCart,
    Plus,
    Search,
    ChevronDown,
    ChevronUp,
    Package,
    Calendar,
    DollarSign,
    CheckCircle,
    User,
    X,
    Trash2
} from 'lucide-react';
import {
    getSalesOrders,
    createSalesOrder,
    getCustomers,
    getRecipes
} from '../api/client';

export default function SalesOrders() {
    const [orders, setOrders] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [recipes, setRecipes] = useState([]); // Used as Products
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [expandedOrder, setExpandedOrder] = useState(null);

    // Form Data
    const [formData, setFormData] = useState({
        customer_id: '',
        status: 'Completed',
        payment_status: 'Paid',
        items: []
    });

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            setLoading(true);
            const [ordersData, customersData, recipesData] = await Promise.all([
                getSalesOrders(),
                getCustomers(),
                getRecipes()
            ]);
            setOrders(ordersData);
            setCustomers(customersData);
            setRecipes(recipesData);
        } catch (err) {
            console.error('Failed to load data:', err);
        } finally {
            setLoading(false);
        }
    }

    function openModal() {
        setFormData({
            customer_id: '',
            status: 'Completed',
            payment_status: 'Paid',
            items: []
        });
        setIsModalOpen(true);
    }

    function closeModal() {
        setIsModalOpen(false);
    }

    function addItemToOrder() {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { recipe_id: '', quantity: 1, unit_price: 0 }]
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

        try {
            const payload = {
                ...formData,
                customer_id: formData.customer_id ? parseInt(formData.customer_id) : null,
                total_amount: formData.items.reduce((sum, item) => sum + (parseFloat(item.unit_price || 0) * parseFloat(item.quantity || 1)), 0),
                items: formData.items.map(item => ({
                    ...item,
                    recipe_id: parseInt(item.recipe_id),
                    quantity: parseInt(item.quantity),
                    unit_price: parseFloat(item.unit_price)
                }))
            };

            await createSalesOrder(payload);
            closeModal();
            loadData();
        } catch (err) {
            console.error('Failed to create order:', err);
            alert('Failed to create order: ' + err.message);
        }
    }

    const getCustomerName = (id) => {
        const c = customers.find(cus => cus.id === id);
        return c ? c.name : 'Unknown Customer';
    };

    const getRecipeName = (id) => {
        const r = recipes.find(rec => rec.id === id);
        return r ? r.name : 'Unknown Product';
    };

    const toggleExpand = (id) => {
        setExpandedOrder(expandedOrder === id ? null : id);
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">
                    <DollarSign className="icon" />
                    Sales Orders
                </h1>
                <button className="btn btn-primary" onClick={openModal}>
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
                    <button className="btn btn-primary" onClick={openModal}>
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
                                        background: 'var(--color-bg)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'var(--color-success)'
                                    }}>
                                        <DollarSign size={20} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{order.customer_id ? getCustomerName(order.customer_id) : 'Walk-in Customer'}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                            {new Date(order.sale_date).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-lg)' }}>
                                    <div className={`badge ${order.status === 'Completed' ? 'badge-green' : 'badge-blue'}`}>
                                        {order.status}
                                    </div>
                                    <div style={{ fontWeight: 600 }}>
                                        ${order.total_amount.toFixed(2)}
                                    </div>
                                    {expandedOrder === order.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </div>
                            </div>

                            {expandedOrder === order.id && (
                                <div style={{ padding: 'var(--spacing-md)', borderTop: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)' }}>
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
                                            {order.items.map((item, idx) => (
                                                <tr key={idx} style={{ borderTop: '1px solid var(--glass-border)' }}>
                                                    <td style={{ padding: '8px 0' }}>{getRecipeName(item.recipe_id)}</td>
                                                    <td style={{ padding: '8px 0' }}>{item.quantity}</td>
                                                    <td style={{ padding: '8px 0', textAlign: 'right' }}>${item.unit_price.toFixed(2)}</td>
                                                    <td style={{ padding: '8px 0', textAlign: 'right' }}>${(item.quantity * item.unit_price).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Create Order Modal */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" style={{ maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">New Sales Order</h2>
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
                                        </select>
                                    </div>
                                </div>

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
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Create Order
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
