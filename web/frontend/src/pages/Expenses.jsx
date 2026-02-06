import { useEffect, useState } from 'react';
import {
    Receipt,
    Plus,
    Search,
    Calendar,
    X,
    TrendingDown,
    Trash2,
    Pencil,
    Download
} from 'lucide-react';
import {
    getExpenses,
    createExpense,
    deleteExpense,
    updateExpense
} from '../api/client';

const EXPENSE_CATEGORIES = [
    'Equipment',
    'Marketing',
    'Packaging',
    'Shipping',
    'Utilities',
    'Rent',
    'Insurance',
    'Supplies',
    'Travel',
    'Other'
];

export default function Expenses() {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Form Data
    const [formData, setFormData] = useState({
        category: 'Equipment',
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        loadExpenses();
    }, []);

    async function loadExpenses() {
        try {
            setLoading(true);
            const data = await getExpenses();
            setExpenses(data);
        } catch (err) {
            console.error('Failed to load expenses:', err);
        } finally {
            setLoading(false);
        }
    }

    function openModal(expense = null) {
        if (expense) {
            setEditingId(expense.id);
            setFormData({
                category: expense.category,
                description: expense.description,
                amount: expense.amount.toString(),
                date: new Date(expense.date).toISOString().split('T')[0]
            });
        } else {
            setEditingId(null);
            setFormData({
                category: 'Equipment',
                description: '',
                amount: '',
                date: new Date().toISOString().split('T')[0]
            });
        }
        setIsModalOpen(true);
    }

    function closeModal() {
        setIsModalOpen(false);
        setEditingId(null);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            const data = {
                ...formData,
                amount: parseFloat(formData.amount),
                date: new Date(formData.date).toISOString()
            };

            if (editingId) {
                await updateExpense(editingId, data);
            } else {
                await createExpense(data);
            }
            closeModal();
            loadExpenses();
        } catch (err) {
            console.error('Failed to save expense:', err);
            alert('Failed to save expense: ' + err.message);
        }
    }

    async function handleDelete(id) {
        if (!confirm('Are you sure you want to delete this expense?')) return;
        try {
            await deleteExpense(id);
            loadExpenses();
        } catch (err) {
            console.error('Failed to delete expense:', err);
            alert('Failed to delete expense: ' + err.message);
        }
    }

    function exportToCSV() {
        const rows = [
            ['Date', 'Category', 'Description', 'Amount'],
            ...filteredExpenses.map(e => [
                new Date(e.date).toLocaleDateString(),
                e.category,
                e.description,
                e.amount.toFixed(2)
            ])
        ];

        const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `expenses_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    const filteredExpenses = expenses.filter(exp => {
        const matchSearch = exp.description.toLowerCase().includes(search.toLowerCase());
        const matchCategory = !categoryFilter || exp.category === categoryFilter;
        return matchSearch && matchCategory;
    });

    const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    const getCategoryColor = (category) => {
        const colors = {
            'Equipment': 'badge-blue',
            'Marketing': 'badge-purple',
            'Packaging': 'badge-green',
            'Shipping': 'badge-orange',
            'Utilities': 'badge-yellow',
            'Rent': 'badge-red',
            'Insurance': 'badge-cyan',
            'Supplies': 'badge-pink',
            'Travel': 'badge-teal',
            'Other': 'badge-gray'
        };
        return colors[category] || 'badge-gray';
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">
                    <Receipt className="icon" />
                    Expenses
                </h1>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                    <button className="btn btn-secondary" onClick={exportToCSV}>
                        <Download size={18} />
                        Export
                    </button>
                    <button className="btn btn-primary" onClick={() => openModal()}>
                        <Plus size={18} />
                        New Expense
                    </button>
                </div>
            </div>

            {/* Summary Card */}
            <div className="card" style={{ marginBottom: 'var(--spacing-lg)', padding: 'var(--spacing-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '4px' }}>
                            Total Expenses {categoryFilter ? `(${categoryFilter})` : ''}
                        </div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-error)' }}>
                            ${totalExpenses.toFixed(2)}
                        </div>
                    </div>
                    <div style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        background: 'rgba(239, 68, 68, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <TrendingDown size={24} style={{ color: 'var(--color-error)' }} />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
                <div className="search-bar" style={{ flex: 1 }}>
                    <Search className="search-icon" size={20} />
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search expenses..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <select
                    className="form-input form-select"
                    style={{ width: '200px' }}
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                >
                    <option value="">All Categories</option>
                    {EXPENSE_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
            </div>

            {loading ? (
                <div className="empty-state">
                    <div className="loading-spinner" />
                </div>
            ) : filteredExpenses.length === 0 ? (
                <div className="empty-state">
                    <Receipt size={48} style={{ marginBottom: '16px', color: 'var(--text-muted)', opacity: 0.5 }} />
                    <h3>No expenses found</h3>
                    <p>{search || categoryFilter ? 'Try adjusting your filters.' : 'Track your business expenses here.'}</p>
                    {!search && !categoryFilter && (
                        <button className="btn btn-primary" onClick={() => openModal()}>
                            <Plus size={18} />
                            New Expense
                        </button>
                    )}
                </div>
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Category</th>
                                <th>Description</th>
                                <th style={{ textAlign: 'right' }}>Amount</th>
                                <th style={{ width: '100px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredExpenses.map(expense => (
                                <tr key={expense.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                                            {new Date(expense.date).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${getCategoryColor(expense.category)}`}>
                                            {expense.category}
                                        </span>
                                    </td>
                                    <td>{expense.description}</td>
                                    <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--color-error)' }}>
                                        ${expense.amount.toFixed(2)}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <button
                                                className="btn-icon"
                                                style={{ color: 'var(--color-primary)' }}
                                                onClick={() => openModal(expense)}
                                                title="Edit expense"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                className="btn-icon"
                                                style={{ color: 'var(--color-error)' }}
                                                onClick={() => handleDelete(expense.id)}
                                                title="Delete expense"
                                            >
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

            {/* Modal */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">{editingId ? 'Edit Expense' : 'New Expense'}</h2>
                            <button className="btn-icon" onClick={closeModal}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Date *</label>
                                        <input
                                            type="date"
                                            className="form-input"
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Category *</label>
                                        <select
                                            className="form-input form-select"
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            required
                                        >
                                            {EXPENSE_CATEGORIES.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Description *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g., New soap molds"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Amount ($) *</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="0.00"
                                        step="0.01"
                                        min="0"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingId ? 'Save Changes' : 'Add Expense'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
