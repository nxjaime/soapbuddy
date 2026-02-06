import { useEffect, useState, useMemo } from 'react';
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Package,
    ShoppingCart,
    ArrowUpRight,
    PieChart,
    Calendar,
    Download,
    Filter
} from 'lucide-react';
import {
    getSalesOrders,
    getSupplyOrders,
    getExpenses,
    getBatches
} from '../api/client';

export default function Financials() {
    const [loading, setLoading] = useState(true);
    const [salesOrders, setSalesOrders] = useState([]);
    const [supplyOrders, setSupplyOrders] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [batches, setBatches] = useState([]);

    // Date range filter
    const [dateRange, setDateRange] = useState('all');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            setLoading(true);
            const [sales, supplies, exps, prods] = await Promise.all([
                getSalesOrders(),
                getSupplyOrders(),
                getExpenses(),
                getBatches()
            ]);
            setSalesOrders(sales);
            setSupplyOrders(supplies);
            setExpenses(exps);
            setBatches(prods);
        } catch (err) {
            console.error('Failed to load financial data:', err);
        } finally {
            setLoading(false);
        }
    }

    // Date filtering logic
    const getDateRange = () => {
        const now = new Date();
        let startDate = null;
        let endDate = new Date(now.getTime() + 86400000); // tomorrow

        switch (dateRange) {
            case 'week':
                startDate = new Date(now.getTime() - 7 * 86400000);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'quarter':
                startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            case 'custom':
                startDate = customStart ? new Date(customStart) : null;
                endDate = customEnd ? new Date(customEnd + 'T23:59:59') : endDate;
                break;
            default:
                return { startDate: null, endDate: null };
        }
        return { startDate, endDate };
    };

    // Filter data by date range
    const filteredData = useMemo(() => {
        const { startDate, endDate } = getDateRange();

        const filterByDate = (items, dateField) => {
            if (!startDate && !endDate) return items;
            return items.filter(item => {
                const itemDate = new Date(item[dateField]);
                if (startDate && itemDate < startDate) return false;
                if (endDate && itemDate > endDate) return false;
                return true;
            });
        };

        return {
            sales: filterByDate(salesOrders, 'sale_date'),
            supplies: filterByDate(supplyOrders, 'order_date'),
            expenses: filterByDate(expenses, 'date')
        };
    }, [salesOrders, supplyOrders, expenses, dateRange, customStart, customEnd]);

    // Calculate metrics from filtered data
    const totalRevenue = filteredData.sales.reduce((sum, order) => sum + (order.total_amount || 0), 0);
    const totalSupplyCosts = filteredData.supplies.reduce((sum, order) => sum + (order.total_cost || 0), 0);
    const totalExpenses = filteredData.expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const totalCosts = totalSupplyCosts + totalExpenses;
    const netProfit = totalRevenue - totalCosts;
    const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100) : 0;

    const completedBatches = batches.filter(b => b.status === 'Complete').length;
    const totalBatches = batches.length;

    // Expense breakdown by category
    const expensesByCategory = filteredData.expenses.reduce((acc, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
        return acc;
    }, {});

    const sortedExpenseCategories = Object.entries(expensesByCategory)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    // Monthly chart data
    const monthlyData = useMemo(() => {
        const months = {};
        const last6Months = [];
        const now = new Date();

        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const label = d.toLocaleDateString('en-US', { month: 'short' });
            months[key] = { label, revenue: 0, costs: 0 };
            last6Months.push(key);
        }

        salesOrders.forEach(sale => {
            const d = new Date(sale.sale_date);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            if (months[key]) months[key].revenue += sale.total_amount || 0;
        });

        supplyOrders.forEach(order => {
            const d = new Date(order.order_date);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            if (months[key]) months[key].costs += order.total_cost || 0;
        });

        expenses.forEach(exp => {
            const d = new Date(exp.date);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            if (months[key]) months[key].costs += exp.amount || 0;
        });

        return last6Months.map(key => months[key]);
    }, [salesOrders, supplyOrders, expenses]);

    const maxChartValue = Math.max(...monthlyData.map(m => Math.max(m.revenue, m.costs)), 1);

    // Export to CSV
    function exportToCSV() {
        const rows = [
            ['Type', 'Date', 'Description', 'Amount'],
            ...filteredData.sales.map(s => ['Revenue', s.sale_date, s.customer?.name || 'Walk-in', s.total_amount]),
            ...filteredData.supplies.map(s => ['Supply Cost', s.order_date, s.supplier?.name || 'Unknown', -s.total_cost]),
            ...filteredData.expenses.map(e => ['Expense', e.date, `${e.category}: ${e.description}`, -e.amount])
        ];

        const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `financials_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // Recent transactions
    const recentSales = [...filteredData.sales].slice(0, 5);

    if (loading) {
        return (
            <div className="empty-state">
                <div className="loading-spinner" />
            </div>
        );
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">
                    <BarChart3 className="icon" />
                    Financials
                </h1>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                    <button className="btn btn-secondary" onClick={exportToCSV}>
                        <Download size={18} />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Date Range Filter */}
            <div className="card" style={{ padding: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Filter size={18} style={{ color: 'var(--text-muted)' }} />
                        <span style={{ fontWeight: 500 }}>Date Range:</span>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                        {['all', 'week', 'month', 'quarter', 'year', 'custom'].map(range => (
                            <button
                                key={range}
                                className={`btn ${dateRange === range ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setDateRange(range)}
                                style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                            >
                                {range === 'all' ? 'All Time' : range.charAt(0).toUpperCase() + range.slice(1)}
                            </button>
                        ))}
                    </div>
                    {dateRange === 'custom' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                            <input
                                type="date"
                                className="form-input"
                                value={customStart}
                                onChange={e => setCustomStart(e.target.value)}
                                style={{ width: '150px' }}
                            />
                            <span>to</span>
                            <input
                                type="date"
                                className="form-input"
                                value={customEnd}
                                onChange={e => setCustomEnd(e.target.value)}
                                style={{ width: '150px' }}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Key Metrics */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 'var(--spacing-md)',
                marginBottom: 'var(--spacing-lg)'
            }}>
                {/* Revenue Card */}
                <div className="card stat-card" style={{ padding: 'var(--spacing-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '4px' }}>
                                Revenue
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-success)' }}>
                                ${totalRevenue.toFixed(2)}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                {filteredData.sales.length} orders
                            </div>
                        </div>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <TrendingUp size={18} style={{ color: 'var(--color-success)' }} />
                        </div>
                    </div>
                </div>

                {/* Costs Card */}
                <div className="card stat-card" style={{ padding: 'var(--spacing-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '4px' }}>
                                Costs
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-error)' }}>
                                ${totalCosts.toFixed(2)}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                Supplies: ${totalSupplyCosts.toFixed(2)}
                            </div>
                        </div>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <TrendingDown size={18} style={{ color: 'var(--color-error)' }} />
                        </div>
                    </div>
                </div>

                {/* Net Profit Card */}
                <div className="card stat-card" style={{ padding: 'var(--spacing-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '4px' }}>
                                Net Profit
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: netProfit >= 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
                                ${netProfit.toFixed(2)}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                Margin: {profitMargin.toFixed(1)}%
                            </div>
                        </div>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: netProfit >= 0 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <DollarSign size={18} style={{ color: netProfit >= 0 ? 'var(--color-success)' : 'var(--color-error)' }} />
                        </div>
                    </div>
                </div>

                {/* Production Card */}
                <div className="card stat-card" style={{ padding: 'var(--spacing-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '4px' }}>
                                Production
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                                {completedBatches} / {totalBatches}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                Batches complete
                            </div>
                        </div>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Package size={18} style={{ color: 'var(--color-primary)' }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Revenue vs Costs Chart */}
            <div className="card" style={{ padding: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
                <h3 style={{ marginBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BarChart3 size={20} />
                    Revenue vs Costs (Last 6 Months)
                </h3>
                <div style={{ display: 'flex', gap: 'var(--spacing-md)', height: '180px', alignItems: 'flex-end', paddingBottom: 'var(--spacing-md)' }}>
                    {monthlyData.map((month, idx) => (
                        <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                            <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '140px' }}>
                                <div
                                    style={{
                                        width: '20px',
                                        height: `${(month.revenue / maxChartValue) * 140}px`,
                                        background: 'linear-gradient(180deg, #22c55e, #16a34a)',
                                        borderRadius: '4px 4px 0 0',
                                        minHeight: month.revenue > 0 ? '4px' : '0'
                                    }}
                                    title={`Revenue: $${month.revenue.toFixed(2)}`}
                                />
                                <div
                                    style={{
                                        width: '20px',
                                        height: `${(month.costs / maxChartValue) * 140}px`,
                                        background: 'linear-gradient(180deg, #ef4444, #dc2626)',
                                        borderRadius: '4px 4px 0 0',
                                        minHeight: month.costs > 0 ? '4px' : '0'
                                    }}
                                    title={`Costs: $${month.costs.toFixed(2)}`}
                                />
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{month.label}</div>
                        </div>
                    ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--spacing-lg)', marginTop: 'var(--spacing-sm)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                        <div style={{ width: '12px', height: '12px', background: '#22c55e', borderRadius: '2px' }} />
                        Revenue
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                        <div style={{ width: '12px', height: '12px', background: '#ef4444', borderRadius: '2px' }} />
                        Costs
                    </div>
                </div>
            </div>

            {/* Two Column Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 'var(--spacing-lg)' }}>
                {/* Expense Breakdown */}
                <div className="card" style={{ padding: 'var(--spacing-md)' }}>
                    <h3 style={{ marginBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <PieChart size={20} />
                        Expense Breakdown
                    </h3>
                    {sortedExpenseCategories.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 'var(--spacing-lg)', color: 'var(--text-muted)' }}>
                            No expenses recorded yet
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                            {sortedExpenseCategories.map(([category, amount]) => {
                                const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
                                return (
                                    <div key={category}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                            <span style={{ fontSize: '0.9rem' }}>{category}</span>
                                            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>${amount.toFixed(2)} ({percentage.toFixed(0)}%)</span>
                                        </div>
                                        <div style={{ height: '8px', background: 'var(--glass-bg)', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${percentage}%`, background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))', borderRadius: '4px' }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Recent Sales */}
                <div className="card" style={{ padding: 'var(--spacing-md)' }}>
                    <h3 style={{ marginBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ShoppingCart size={20} />
                        Recent Sales
                    </h3>
                    {recentSales.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 'var(--spacing-lg)', color: 'var(--text-muted)' }}>
                            No sales in selected period
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                            {recentSales.map(sale => (
                                <div key={sale.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--spacing-sm)', background: 'var(--glass-bg)', borderRadius: 'var(--radius-sm)' }}>
                                    <div>
                                        <div style={{ fontWeight: 500 }}>{sale.customer?.name || 'Walk-in'}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(sale.sale_date).toLocaleDateString()}</div>
                                    </div>
                                    <div style={{ fontWeight: 600, color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <ArrowUpRight size={14} />
                                        ${sale.total_amount.toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
