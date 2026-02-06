import { NavLink, Outlet } from 'react-router-dom';
import {
    LayoutDashboard,
    FlaskConical,
    BookOpen,
    Factory,
    Calculator,
    Settings,
    Droplets,
    Truck,
    ShoppingCart,
    Users,
    DollarSign,
    Receipt,
    BarChart3,
    FileSearch
} from 'lucide-react';

const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/ingredients', icon: FlaskConical, label: 'Ingredients' },
    { to: '/suppliers', icon: Truck, label: 'Suppliers' },
    { to: '/supply-orders', icon: ShoppingCart, label: 'Supply Orders' },
    { to: '/customers', icon: Users, label: 'Customers' },
    { to: '/sales-orders', icon: DollarSign, label: 'Sales Orders' },
    { to: '/recipes', icon: BookOpen, label: 'Recipes' },
    { to: '/production', icon: Factory, label: 'Production' },
    { to: '/calculator', icon: Calculator, label: 'Lye Calculator' },
    { to: '/expenses', icon: Receipt, label: 'Expenses' },
    { to: '/financials', icon: BarChart3, label: 'Financials' },
    { to: '/traceability', icon: FileSearch, label: 'Traceability' },
];

export default function Layout() {
    return (
        <div className="app-layout">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <a href="/" className="sidebar-logo">
                        <Droplets className="icon" style={{ color: 'var(--color-primary-light)' }} />
                        <h1>SoapBuddy</h1>
                    </a>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                `nav-link ${isActive ? 'active' : ''}`
                            }
                            end={item.to === '/'}
                        >
                            <item.icon />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div style={{ marginTop: 'auto', paddingTop: 'var(--spacing-lg)', borderTop: '1px solid var(--glass-border)' }}>
                    <NavLink to="/settings" className="nav-link">
                        <Settings />
                        <span>Settings</span>
                    </NavLink>
                </div>
            </aside>

            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
}
