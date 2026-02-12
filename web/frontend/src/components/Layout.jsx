import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import ErrorBoundary from './ErrorBoundary';
import { useSettings } from '../contexts/SettingsContext';
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
    Warehouse
} from 'lucide-react';

export default function Layout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { isTabVisible } = useSettings();

    const allNavItems = [
        { path: '/', icon: LayoutDashboard, label: 'Dashboard', alwaysVisible: true },
        { path: '/ingredients', icon: FlaskConical, label: 'Ingredients' },
        { path: '/calculator', icon: Calculator, label: 'Calculator' },
        { path: '/recipes', icon: BookOpen, label: 'Recipes' },
        { path: '/production', icon: Factory, label: 'Production' },
        { path: '/inventory', icon: Warehouse, label: 'Inventory' },
        { path: '/suppliers', icon: Truck, label: 'Suppliers' },
        { path: '/supply-orders', icon: ShoppingCart, label: 'Supply Orders' },
        { path: '/customers', icon: Users, label: 'Customers' },
        { path: '/sales-orders', icon: DollarSign, label: 'Sales Orders' },
        { path: '/expenses', icon: Receipt, label: 'Expenses' },
        { path: '/financials', icon: BarChart3, label: 'Financials' },
        { path: '/traceability', icon: FileSearch, label: 'Traceability' },
        { path: '/settings', icon: SettingsIcon, label: 'Settings', alwaysVisible: true }
    ];

    const navItems = allNavItems.filter(item => item.alwaysVisible || isTabVisible(item.path));

    return (
        <div className="app-layout">
            {/* Mobile Header */}
            <header className="mobile-header">
                <button className="menu-btn" onClick={() => setIsSidebarOpen(true)}>
                    <Menu size={24} />
                </button>
                <div className="logo">SoapBuddy</div>
            </header>

            {/* Sidebar Overlay */}
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
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `nav-item ${isActive ? 'active' : ''}`
                            }
                            onClick={() => setIsSidebarOpen(false)}
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>
            </aside>

            <main className="main-content">
                <ErrorBoundary>
                    <Outlet />
                </ErrorBoundary>
            </main>
        </div>
    );
}

