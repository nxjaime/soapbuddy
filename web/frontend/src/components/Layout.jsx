import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import ErrorBoundary from './ErrorBoundary';
import { useSettings } from '../contexts/SettingsContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import {
    LayoutDashboard,
    FlaskConical,
    BookOpen,
    Factory,
    Calculator,
    Settings as SettingsIcon,
    Droplets,
    Truck,
    ShoppingCart,
    Users,
    DollarSign,
    Receipt,
    Menu,
    X,
    BarChart3,
    FileSearch,
    Warehouse,
    LogOut,
    ShieldCheck,
    Lock
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Layout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { isTabVisible } = useSettings();
    const { signOut } = useAuth();
    const { isAdmin, hasFeature } = useSubscription();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await signOut();
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    const allNavItems = [
        { path: '/', icon: LayoutDashboard, label: 'Dashboard', alwaysVisible: true },
        { path: '/ingredients', icon: FlaskConical, label: 'Ingredients' },
        { path: '/calculator', icon: Calculator, label: 'Calculator' },
        { path: '/recipes', icon: BookOpen, label: 'Recipes' },
        { path: '/production', icon: Factory, label: 'Production', featureId: 'production' },
        { path: '/inventory', icon: Warehouse, label: 'Inventory', featureId: 'inventory' },
        { path: '/suppliers', icon: Truck, label: 'Suppliers', featureId: 'supplyChain' },
        { path: '/supply-orders', icon: ShoppingCart, label: 'Supply Orders', featureId: 'supplyChain' },
        { path: '/customers', icon: Users, label: 'Customers', featureId: 'salesTracking' },
        { path: '/sales-orders', icon: DollarSign, label: 'Sales Orders', featureId: 'salesTracking' },
        { path: '/expenses', icon: Receipt, label: 'Expenses', featureId: 'salesTracking' },
        { path: '/financials', icon: BarChart3, label: 'Financials', featureId: 'financialInsights' },
        { path: '/traceability', icon: FileSearch, label: 'Traceability', featureId: 'traceability' },
        { path: '/settings', icon: SettingsIcon, label: 'Settings', alwaysVisible: true },
        { path: '/admin', icon: ShieldCheck, label: 'Admin', isAdminOnly: true }
    ];

    const navItems = allNavItems.map(item => {
        const isLocked = item.featureId && !hasFeature(item.featureId);
        const isHidden = !item.alwaysVisible && !isTabVisible(item.path) && !isAdmin;
        const isAdminHidden = item.isAdminOnly && !isAdmin;

        return {
            ...item,
            isLocked,
            isVisible: !isHidden && !isAdminHidden
        };
    }).filter(item => item.isVisible);

    return (
        <div className="app-layout">
            <header className="mobile-header">
                <button className="menu-btn" onClick={() => setIsSidebarOpen(true)}>
                    <Menu size={24} />
                </button>
                <div className="logo">SoapBuddy</div>
            </header>

            {isSidebarOpen && (
                <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
            )}

            <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="logo">SoapBuddy</div>
                    <button className="close-btn" onClick={() => setIsSidebarOpen(false)}>
                        <X size={24} />
                    </button>
                </div>
                <nav className="nav-menu">
                    {navItems.map((item) => (
                        <div key={item.path} style={{ position: 'relative' }}>
                            <NavLink
                                to={item.isLocked ? '#' : item.path}
                                className={({ isActive }) =>
                                    `nav-item ${isActive && !item.isLocked ? 'active' : ''} ${item.isLocked ? 'locked' : ''}`
                                }
                                onClick={(e) => {
                                    if (item.isLocked) {
                                        e.preventDefault();
                                        navigate('/settings?tab=subscription');
                                    }
                                    setIsSidebarOpen(false);
                                }}
                            >
                                <item.icon size={20} />
                                <span>{item.label}</span>
                                {item.isLocked && (
                                    <Lock size={14} className="lock-icon" style={{ marginLeft: 'auto', opacity: 0.5 }} />
                                )}
                            </NavLink>
                        </div>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <button
                        className="nav-item logout-btn"
                        onClick={handleLogout}
                        style={{
                            width: '100%',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-muted)'
                        }}
                    >
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            <main className="main-content">
                <ErrorBoundary>
                    <Outlet />
                </ErrorBoundary>
            </main>
        </div>
    );
}

