import { useEffect, useState } from 'react';
import {
    ShoppingCart,
    Plus,
    ChevronDown,
    ChevronUp,
    Package,
    X,
    Trash2,
    Edit3
} from 'lucide-react';
import {
    getSupplyOrders,
    createSupplyOrder,
    updateSupplyOrder,
    getSuppliers,
    getIngredients
} from '../api/client';

export default function SupplyOrders() {
    const [orders, setOrders] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [ingredients, setIngredients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [expandedOrder, setExpandedOrder] = useState(null);
    const [editingOrder, setEditingOrder] = useState(null);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        supplier_id: '',
        status: 'Ordered',
        items: []
    });

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        try {
            setLoading(true);
            const [ordersData, suppliersData, ingredientsData] = await Promise.all([
                getSupplyOrders(),
                getSuppliers(),
                getIngredients()
            ]);
            setOrders(ordersData);
            setSuppliers(suppliersData);
            setIngredients(ingredientsData);
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
                supplier_id: String(order.supplier_id || ''),
                status: order.status || 'Ordered',
                items: order.items?.map(i => ({
                    ingredient_id: String(i.ingredient_id),
                    quantity: i.quantity,
                    unit: i.unit || 'g',
                    cost: i.cost
                })) || []
            });
        } else {
            setEditingOrder(null);
            setFormData({
                supplier_id: '',
                status: 'Ordered',
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
            items: [...prev.items, { ingredient_id: '', quantity: 0, unit: 'g', cost: 0 }]
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

        setSaving(true);
        try {
            const payload = {
                ...formData,
                supplier_id: parseInt(formData.supplier_id),
                total_cost: formData.items.reduce((sum, item) => sum + parseFloat(item.cost || 0), 0),
                items: formData.items.map(item => ({
                    ...item,
                    ingredient_id: parseInt(item.ingredient_id),
                    quantity: parseFloat(item.quantity),
                    cost: parseFloat(item.cost)
                }))
            };

            if (editingOrder) {
                await updateSupplyOrder(editingOrder.id, payload);
            } else {
                await createSupplyOrder(payload);
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

    const getSupplierName = (id) => {
        const s = suppliers.find(sup => sup.id === id);
        return s ? s.name : 'Unknown';
    };

    const getIngredientName = (id) => {
        const i = ingredients.find(ing => ing.id === id);
        return i ? i.name : 'Unknown';
    };

    const toggleExpand = (id) => {
        setExpandedOrder(expandedOrder === id ? null : id);
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Received': return 'badge-green';
            case 'Shipped': return 'badge-yellow';
            case 'Cancelled': return 'badge-red';
            default: return 'badge-blue';
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">
                    <ShoppingCart className="icon" />
                    Supply Orders
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
                    <ShoppingCart size={48} style={{ marginBottom: '16px', color: 'var(--text-muted)', opacity: 0.5 }} />
                    <h3>No orders found</h3>
                    <p>Create a purchase order to restock your inventory.</p>
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
                                        color: 'var(--color-primary)'
                                    }}>
                                        <Package size={20} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{getSupplierName(order.supplier_id)}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                            {new Date(order.order_date).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                                    <div className={`badge ${getStatusBadge(order.status)}`}>
                                        {order.status}
                                    </div>
                                    <div style={{ fontWeight: 600 }}>
                                        ${(order.total_cost || 0).toFixed(2)}
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
                                                <th style={{ paddingBottom: '8px' }}>Ingredient</th>
                                                <th style={{ paddingBottom: '8px' }}>Quantity</th>
                                                <th style={{ paddingBottom: '8px', textAlign: 'right' }}>Cost</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {order.items?.map((item, idx) => (
                                                <tr key={idx} style={{ borderTop: '1px solid var(--glass-border)' }}>
                                                    <td style={{ padding: '8px 0' }}>{getIngredientName(item.ingredient_id)}</td>
                                                    <td style={{ padding: '8px 0' }}>{item.quantity} {item.unit}</td>
                                                    <td style={{ padding: '8px 0', textAlign: 'right' }}>${(item.cost || 0).toFixed(2)}</td>
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

            {/* Create / Edit Order Modal */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" style={{ maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">{editingOrder ? 'Edit Supply Order' : 'New Supply Order'}</h2>
                            <button className="btn-icon" onClick={closeModal}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-row">
                                    <div className="form-group" style={{ flex: 2 }}>
                                        <label className="form-label">Supplier *</label>
                                        <select
                                            className="form-input form-select"
                                            value={formData.supplier_id}
                                            onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                                            required
                                        >
                                            <option value="">Select Supplier</option>
                                            {suppliers.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
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
                                            <option value="Ordered">Ordered</option>
                                            <option value="Shipped">Shipped</option>
                                            <option value="Received">Received</option>
                                            <option value="Cancelled">Cancelled</option>
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
                                                value={item.ingredient_id}
                                                onChange={(e) => updateOrderItem(idx, 'ingredient_id', e.target.value)}
                                                required
                                            >
                                                <option value="">Select Ingredient</option>
                                                {ingredients.map(i => (
                                                    <option key={i.id} value={i.id}>{i.name}</option>
                                                ))}
                                            </select>
                                            <input
                                                type="number"
                                                className="form-input"
                                                style={{ flex: 1 }}
                                                placeholder="Qty"
                                                value={item.quantity}
                                                onChange={(e) => updateOrderItem(idx, 'quantity', e.target.value)}
                                                required
                                            />
                                            <select
                                                className="form-input form-select"
                                                style={{ width: '70px' }}
                                                value={item.unit}
                                                onChange={(e) => updateOrderItem(idx, 'unit', e.target.value)}
                                            >
                                                <option value="g">g</option>
                                                <option value="oz">oz</option>
                                                <option value="ml">ml</option>
                                                <option value="units">units</option>
                                            </select>
                                            <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '8px', position: 'relative' }}>
                                                <span style={{ position: 'absolute', left: '16px', color: 'var(--text-muted)' }}>$</span>
                                                <input
                                                    type="number"
                                                    className="form-input"
                                                    style={{ width: '100px', paddingLeft: '20px' }}
                                                    placeholder="Cost"
                                                    value={item.cost}
                                                    onChange={(e) => updateOrderItem(idx, 'cost', e.target.value)}
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
                                            Total: ${formData.items.reduce((sum, item) => sum + parseFloat(item.cost || 0), 0).toFixed(2)}
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
