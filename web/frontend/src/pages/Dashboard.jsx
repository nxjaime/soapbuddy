import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    FlaskConical,
    BookOpen,
    Factory,
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    Plus,
    DollarSign,
    Users,
    ShoppingCart,
    Truck,
    Package,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';
import {
    getDashboardStats,
    getSalesOrders,
    getSupplyOrders,
    getExpenses,
    getBatches,
    getCustomers
} from '../api/client';

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [financials, setFinancials] = useState(null);
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadDashboard();
    }, []);

    async function loadDashboard() {
        try {
            setLoading(true);
            const [statsData, sales, supplies, expenses, batches, customers] = await Promise.all([
                getDashboardStats(),
                getSalesOrders(),
                getSupplyOrders(),
                getExpenses(),
                getBatches(),
                getCustomers()
            ]);

            setStats({
                ...statsData,
                customers: customers.length,
                sales_orders: sales.length,
                supply_orders: supplies.length
            });

            // Calculate financials
            const totalRevenue = sales.reduce((sum, o) => sum + (o.total_amount || 0), 0);
            const totalSupplyCosts = supplies.reduce((sum, o) => sum + (o.total_cost || 0), 0);
            const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
            const netProfit = totalRevenue - totalSupplyCosts - totalExpenses;

            setFinancials({
                revenue: totalRevenue,
                costs: totalSupplyCosts + totalExpenses,
                profit: netProfit,
                margin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0
            });

            // Build recent activity feed
            const activities = [];

            sales.slice(0, 3).forEach(s => {
                activities.push({
                    type: 'sale',
                    title: `Sale: $${s.total_amount.toFixed(2)}`,
                    date: s.sale_date,
                    icon: DollarSign,
                    color: 'var(--color-success)'
                });
            });

            batches.slice(0, 3).forEach(b => {
                activities.push({
                    type: 'batch',
                    title: `Batch: ${b.lot_number}`,
                    subtitle: b.recipe?.name || 'Unknown',
                    date: b.created_at,
                    icon: Package,
                    color: 'var(--color-primary)'
                });
            });

            expenses.slice(0, 2).forEach(e => {
                activities.push({
                    type: 'expense',
                    title: `Expense: ${e.description}`,
                    subtitle: `$${e.amount.toFixed(2)}`,
                    date: e.date,
                    icon: TrendingDown,
                    color: 'var(--color-error)'
                });
            });

            // Sort by date
            activities.sort((a, b) => new Date(b.date) - new Date(a.date));
            setRecentActivity(activities.slice(0, 6));

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="empty-state">
                <div className="loading-spinner" />
                <p>Loading dashboard...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="empty-state">
                <AlertTriangle style={{ color: 'var(--color-error)' }} />
                <h3>Unable to load dashboard</h3>
                <p>{error}</p>
                <button className="btn btn-primary" onClick={loadDashboard}>
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">
                    <TrendingUp className="icon" />
                    Dashboard
                </h1>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                    <Link to="/sales-orders" className="btn btn-primary">
                        <Plus size={18} />
                        New Sale
                    </Link>
                    <Link to="/production" className="btn btn-secondary">
                        <Plus size={18} />
                        New Batch
                    </Link>
                </div>
            </div>

            {/* Financial Summary Row */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 'var(--spacing-md)',
                marginBottom: 'var(--spacing-lg)'
            }}>
                <div className="card stat-card" style={{ padding: 'var(--spacing-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Revenue</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-success)' }}>
                                ${financials?.revenue.toFixed(2) || '0.00'}
                            </div>
                        </div>
                        <div style={{
                            width: '36px', height: '36px', borderRadius: '50%',
                            background: 'rgba(34, 197, 94, 0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <ArrowUpRight size={18} style={{ color: 'var(--color-success)' }} />
                        </div>
                    </div>
                </div>

                <div className="card stat-card" style={{ padding: 'var(--spacing-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Costs</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-error)' }}>
                                ${financials?.costs.toFixed(2) || '0.00'}
                            </div>
                        </div>
                        <div style={{
                            width: '36px', height: '36px', borderRadius: '50%',
                            background: 'rgba(239, 68, 68, 0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <ArrowDownRight size={18} style={{ color: 'var(--color-error)' }} />
                        </div>
                    </div>
                </div>

                <div className="card stat-card" style={{ padding: 'var(--spacing-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Net Profit</div>
                            <div style={{
                                fontSize: '1.5rem', fontWeight: 700,
                                color: (financials?.profit || 0) >= 0 ? 'var(--color-success)' : 'var(--color-error)'
                            }}>
                                ${financials?.profit.toFixed(2) || '0.00'}
                            </div>
                        </div>
                        <div style={{
                            width: '36px', height: '36px', borderRadius: '50%',
                            background: (financials?.profit || 0) >= 0 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <DollarSign size={18} style={{ color: (financials?.profit || 0) >= 0 ? 'var(--color-success)' : 'var(--color-error)' }} />
                        </div>
                    </div>
                </div>

                <div className="card stat-card" style={{ padding: 'var(--spacing-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Margin</div>
                            <div style={{
                                fontSize: '1.5rem', fontWeight: 700,
                                color: (financials?.margin || 0) >= 0 ? 'var(--color-success)' : 'var(--color-error)'
                            }}>
                                {financials?.margin.toFixed(1) || '0.0'}%
                            </div>
                        </div>
                        <div style={{
                            width: '36px', height: '36px', borderRadius: '50%',
                            background: 'rgba(139, 92, 246, 0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <TrendingUp size={18} style={{ color: 'var(--color-primary)' }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Operations Stats */}
            <div className="stats-grid" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <div className="stat-card primary">
                    <div className="stat-icon">
                        <FlaskConical />
                    </div>
                    <div className="stat-value">{stats?.ingredients || 0}</div>
                    <div className="stat-label">Ingredients</div>
                </div>

                <div className="stat-card secondary">
                    <div className="stat-icon">
                        <BookOpen />
                    </div>
                    <div className="stat-value">{stats?.recipes || 0}</div>
                    <div className="stat-label">Recipes</div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        <Factory />
                    </div>
                    <div className="stat-value">{stats?.batches || 0}</div>
                    <div className="stat-label">Batches</div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        <Users />
                    </div>
                    <div className="stat-value">{stats?.customers || 0}</div>
                    <div className="stat-label">Customers</div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        <ShoppingCart />
                    </div>
                    <div className="stat-value">{stats?.sales_orders || 0}</div>
                    <div className="stat-label">Sales</div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        <Truck />
                    </div>
                    <div className="stat-value">{stats?.supply_orders || 0}</div>
                    <div className="stat-label">Supplies</div>
                </div>
            </div>

            {/* Low Stock Alert */}
            {stats?.low_stock_items > 0 && (
                <div className="card" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'var(--color-error)', marginBottom: 'var(--spacing-lg)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                        <AlertTriangle style={{ color: 'var(--color-error)' }} />
                        <div>
                            <h3 style={{ margin: 0 }}>Low Stock Warning</h3>
                            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                                {stats.low_stock_items} ingredient(s) are running low on stock.
                            </p>
                        </div>
                        <Link to="/ingredients" className="btn btn-secondary" style={{ marginLeft: 'auto' }}>
                            View Ingredients
                        </Link>
                    </div>
                </div>
            )}

            {/* Two Column Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--spacing-lg)' }}>
                {/* Recent Activity */}
                <div className="card">
                    <h3 className="card-title">Recent Activity</h3>
                    {recentActivity.length === 0 ? (
                        <div style={{ padding: 'var(--spacing-lg)', textAlign: 'center', color: 'var(--text-muted)' }}>
                            No recent activity. Start by creating a sale or batch!
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-md)' }}>
                            {recentActivity.map((activity, idx) => (
                                <div key={idx} style={{
                                    display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)',
                                    padding: 'var(--spacing-sm)',
                                    background: 'var(--glass-bg)',
                                    borderRadius: 'var(--radius-sm)'
                                }}>
                                    <div style={{
                                        width: '32px', height: '32px', borderRadius: '50%',
                                        background: `${activity.color}22`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <activity.icon size={16} style={{ color: activity.color }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{activity.title}</div>
                                        {activity.subtitle && (
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{activity.subtitle}</div>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        {new Date(activity.date).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="card">
                    <h3 className="card-title">Quick Actions</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-md)' }}>
                        <Link to="/calculator" className="btn btn-secondary" style={{ justifyContent: 'center' }}>
                            🧮 Calculator
                        </Link>
                        <Link to="/production" className="btn btn-secondary" style={{ justifyContent: 'center' }}>
                            🏭 Batches
                        </Link>
                        <Link to="/sales-orders" className="btn btn-secondary" style={{ justifyContent: 'center' }}>
                            💰 Sales
                        </Link>
                        <Link to="/expenses" className="btn btn-secondary" style={{ justifyContent: 'center' }}>
                            🧾 Expenses
                        </Link>
                        <Link to="/financials" className="btn btn-secondary" style={{ justifyContent: 'center' }}>
                            📊 Financials
                        </Link>
                        <Link to="/traceability" className="btn btn-secondary" style={{ justifyContent: 'center' }}>
                            🔍 Traceability
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
