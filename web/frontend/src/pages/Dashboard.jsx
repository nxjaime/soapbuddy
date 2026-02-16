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
    Warehouse,
    ArrowUpRight,
    ArrowDownRight,
    Activity,
    Droplets,
    ScrollText
} from 'lucide-react';
import {
    getDashboardStats,
    getFinancialSummary,
    getRecentActivity
} from '../api/client';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import WelcomeWizard from '../components/WelcomeWizard';
import LowStockBanner from '../components/LowStockBanner';

const WIZARD_STORAGE_KEY = 'soapbuddy_wizard_complete';

export default function Dashboard() {
    const { formatCurrency } = useSettings();
    const { user } = useAuth();
    const [showWizard, setShowWizard] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({
        total_ingredients: 0,
        total_recipes: 0,
        total_batches: 0,
        active_batches: 0,
        total_customers: 0,
        total_sales: 0,
        total_supplies: 0
    });
    const [financials, setFinancials] = useState({
        revenue: 0,
        costs: 0,
        profit: 0,
        margin: 0
    });
    const [recentActivity, setRecentActivity] = useState([]);

    useEffect(() => {
        loadDashboard();
    }, []);

    async function loadDashboard() {
        try {
            setLoading(true);

            const [statsData, financialData, activityData] = await Promise.all([
                getDashboardStats(),
                getFinancialSummary(),
                getRecentActivity()
            ]);

            setStats(statsData);
            setFinancials({
                revenue: financialData.total_revenue,
                costs: financialData.total_expenses,
                profit: financialData.net_profit,
                margin: financialData.margin
            });
            setRecentActivity(activityData);

            // Show welcome wizard for new users with zero recipes
            const wizardDone = localStorage.getItem(WIZARD_STORAGE_KEY);
            if (!wizardDone && statsData.total_recipes === 0) {
                setShowWizard(true);
            }

        } catch (err) {
            console.error('Error loading dashboard:', err);
            setError('Failed to load dashboard data');
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
            {/* Welcome Wizard for new empty accounts */}
            {showWizard && (
                <WelcomeWizard
                    userId={user?.id}
                    onDone={() => setShowWizard(false)}
                />
            )}

            <LowStockBanner />

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
            <div className="responsive-grid" style={{ marginBottom: 'var(--spacing-lg)', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <div className="card stat-card" style={{ padding: 'var(--spacing-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Revenue</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-success)' }}>
                                {formatCurrency(financials?.revenue || 0)}
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
                                {formatCurrency(financials?.costs || 0)}
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
                                {formatCurrency(financials?.profit || 0)}
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
                    <div className="flex-responsive" style={{ gap: 'var(--spacing-md)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', flex: 1 }}>
                            <AlertTriangle style={{ color: 'var(--color-error)' }} />
                            <div>
                                <h3 style={{ margin: 0 }}>Low Stock Warning</h3>
                                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                                    {stats.low_stock_items} ingredient(s) are running low on stock.
                                </p>
                            </div>
                        </div>
                        <Link to="/ingredients" className="btn btn-secondary">
                            View
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
                            {recentActivity.map((activity, idx) => {
                                const activityConfig = {
                                    sale: { icon: DollarSign, color: 'var(--color-success)' },
                                    batch: { icon: Factory, color: 'var(--color-primary)' },
                                    expense: { icon: ScrollText, color: 'var(--color-error)' },
                                    inventory: { icon: Warehouse, color: 'var(--color-primary-light)' },
                                    default: { icon: Activity, color: 'var(--text-muted)' }
                                };
                                const config = activityConfig[activity.type] || activityConfig.default;
                                const Icon = config.icon;

                                return (
                                    <div key={idx} style={{
                                        display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)',
                                        padding: 'var(--spacing-sm)',
                                        background: 'var(--glass-bg)',
                                        borderRadius: 'var(--radius-sm)'
                                    }}>
                                        <div style={{
                                            width: '32px', height: '32px', borderRadius: '50%',
                                            background: `${config.color}22`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <Icon size={16} style={{ color: config.color }} />
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
                                );
                            })}
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
