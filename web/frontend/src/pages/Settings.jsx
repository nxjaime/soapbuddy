import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Save,
    Bell,
    Monitor,
    Database,
    User,
    Palette,
    Moon,
    Sun,
    FlaskConical,
    BookOpen,
    Factory,
    Calculator,
    Truck,
    ShoppingCart,
    Users,
    DollarSign,
    Receipt,
    BarChart3,
    FileSearch,
    Warehouse,
    PanelLeft,
    CreditCard,
    CheckCircle2,
    XCircle,
    ArrowUpCircle,
    Zap,
    Settings as SettingsIcon,
    Box
} from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useSubscription } from '../contexts/SubscriptionContext';

export default function Settings() {
    const { settings: globalSettings, updateSettings, toggleTab, isTabVisible } = useSettings();
    const { tier, allPlans, subscribe, manageSubscription } = useSubscription();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'general';

    const [localSettings, setLocalSettings] = useState(globalSettings);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        setLocalSettings(globalSettings);
    }, [globalSettings]);

    const handleSettingChange = (e) => {
        const { name, value, type, checked } = e.target;
        setLocalSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));
        updateSettings(localSettings);
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const toggleableTabs = [
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
        { path: '/molds', icon: Box, label: 'Molds' },
    ];

    if (!localSettings) return null;

    return (
        <div className="settings-page">
            <div className="page-header">
                <h1 className="page-title">
                    <Monitor className="icon" />
                    Settings
                </h1>
            </div>

            {/* Tab Navigation */}
            <div className="flex-responsive" style={{ marginBottom: 'var(--spacing-xl)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0' }}>
                <button
                    type="button"
                    className={`btn ${activeTab === 'general' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setSearchParams({ tab: 'general' })}
                    style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottom: activeTab === 'general' ? 'none' : '1px solid var(--glass-border)' }}
                >
                    <SettingsIcon size={18} />
                    General
                </button>
                <button
                    type="button"
                    className={`btn ${activeTab === 'subscription' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setSearchParams({ tab: 'subscription' })}
                    style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottom: activeTab === 'subscription' ? 'none' : '1px solid var(--glass-border)' }}
                >
                    <CreditCard size={18} />
                    Subscription
                </button>
            </div>

            {activeTab === 'general' ? (
                <form onSubmit={handleSave}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'var(--spacing-lg)' }}>

                        {/* Business Info */}
                        <div className="card">
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--spacing-lg)' }}>
                                <User size={20} />
                                Business Information
                            </h3>

                            <div className="form-group">
                                <label className="form-label">Business Name</label>
                                <input
                                    type="text"
                                    name="businessName"
                                    className="form-input"
                                    value={localSettings.businessName || ''}
                                    onChange={handleSettingChange}
                                    placeholder="Your Soap Company"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Contact Email</label>
                                <input
                                    type="email"
                                    name="contactEmail"
                                    className="form-input"
                                    value={localSettings.contactEmail || ''}
                                    onChange={handleSettingChange}
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>

                        {/* Preferences */}
                        <div className="card">
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--spacing-lg)' }}>
                                <Palette size={20} />
                                Preferences
                            </h3>

                            <div className="form-group">
                                <label className="form-label">Currency</label>
                                <select
                                    name="currency"
                                    className="form-input form-select"
                                    value={localSettings.currency || 'USD'}
                                    onChange={handleSettingChange}
                                >
                                    <option value="USD">USD ($)</option>
                                    <option value="EUR">EUR (€)</option>
                                    <option value="GBP">GBP (£)</option>
                                    <option value="CAD">CAD ($)</option>
                                    <option value="AUD">AUD ($)</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Unit System</label>
                                <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
                                    <button
                                        type="button"
                                        className={`btn ${['g', 'kg'].includes(localSettings.weightUnit || 'g') ? 'btn-primary' : 'btn-secondary'}`}
                                        onClick={() => handleSettingChange({ target: { name: 'weightUnit', value: 'g' } })}
                                        style={{ flex: 1 }}
                                    >
                                        Metric (g / kg)
                                    </button>
                                    <button
                                        type="button"
                                        className={`btn ${['oz', 'lb'].includes(localSettings.weightUnit || 'g') ? 'btn-primary' : 'btn-secondary'}`}
                                        onClick={() => handleSettingChange({ target: { name: 'weightUnit', value: 'oz' } })}
                                        style={{ flex: 1 }}
                                    >
                                        US (oz / lb)
                                    </button>
                                </div>
                                <select
                                    name="weightUnit"
                                    className="form-input form-select"
                                    value={localSettings.weightUnit || 'g'}
                                    onChange={handleSettingChange}
                                >
                                    <option value="g">Grams (g)</option>
                                    <option value="oz">Ounces (oz)</option>
                                    <option value="kg">Kilograms (kg)</option>
                                    <option value="lb">Pounds (lb)</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Theme</label>
                                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                    <button
                                        type="button"
                                        className={`btn ${localSettings.theme === 'dark' ? 'btn-primary' : 'btn-secondary'} `}
                                        onClick={() => handleSettingChange({ target: { name: 'theme', value: 'dark' } })}
                                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                    >
                                        <Moon size={16} />
                                        Dark
                                    </button>
                                    <button
                                        type="button"
                                        className={`btn ${localSettings.theme === 'light' ? 'btn-primary' : 'btn-secondary'} `}
                                        onClick={() => handleSettingChange({ target: { name: 'theme', value: 'light' } })}
                                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                    >
                                        <Sun size={16} />
                                        Light
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Inventory */}
                        <div className="card">
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--spacing-lg)' }}>
                                <Database size={20} />
                                Inventory Settings
                            </h3>

                            <div className="form-group">
                                <label className="form-label">Low Stock Threshold (g)</label>
                                <input
                                    type="number"
                                    name="lowStockThreshold"
                                    className="form-input"
                                    value={localSettings.lowStockThreshold || 0}
                                    onChange={handleSettingChange}
                                    min="0"
                                />
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                    Get alerted when ingredient stock falls below this amount.
                                </p>
                            </div>
                        </div>

                        {/* Notifications */}
                        <div className="card">
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--spacing-lg)' }}>
                                <Bell size={20} />
                                Notifications
                            </h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        name="enableNotifications"
                                        checked={localSettings.enableNotifications || false}
                                        onChange={handleSettingChange}
                                        style={{ width: '18px', height: '18px' }}
                                    />
                                    <span>Enable Notifications</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        name="emailAlerts"
                                        checked={localSettings.emailAlerts || false}
                                        onChange={handleSettingChange}
                                        style={{ width: '18px', height: '18px' }}
                                    />
                                    <span>Email Alerts</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Navigation */}
                    <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--spacing-sm)' }}>
                            <PanelLeft size={20} />
                            Sidebar Navigation
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-lg)' }}>
                            Toggle which tabs are visible in the sidebar. Dashboard and Settings are always shown.
                        </p>

                        <div className="settings-tab-grid">
                            {toggleableTabs.map(tab => (
                                <div key={tab.path} className="settings-tab-item">
                                    <div className="settings-tab-info">
                                        <tab.icon size={20} />
                                        <span>{tab.label}</span>
                                    </div>
                                    <label className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={isTabVisible(tab.path)}
                                            onChange={() => toggleTab(tab.path)}
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ marginTop: 'var(--spacing-xl)', display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-md)' }}>
                        {saved && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                color: 'var(--color-success)',
                                padding: '0 var(--spacing-md)'
                            }}>
                                ✓ Settings saved
                            </div>
                        )}
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            <Save size={18} />
                            {saving ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </form>
            ) : (
                <div className="subscription-tab">
                    <div className="card" style={{ marginBottom: 'var(--spacing-xl)', borderLeft: '4px solid var(--color-primary)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h2 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>
                                    Your Current Plan: <span style={{ color: 'var(--color-primary-light)' }}>{tier.charAt(0).toUpperCase() + tier.slice(1)}</span>
                                </h2>
                                <p style={{ color: 'var(--text-secondary)' }}>
                                    {tier === 'free' ? 'Unlock professional features to take your business to the next level.' : 'Thank you for being a subscriber!'}
                                </p>
                            </div>
                            {tier === 'free' ? (
                                <button className="btn btn-primary" onClick={() => document.getElementById('plans-grid').scrollIntoView({ behavior: 'smooth' })}>
                                    <ArrowUpCircle size={18} />
                                    Upgrade Now
                                </button>
                            ) : (
                                <button className="btn btn-secondary" onClick={manageSubscription}>
                                    <CreditCard size={18} />
                                    Manage Subscription
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="plans-grid" id="plans-grid">
                        {Object.values(allPlans).map((plan) => (
                            <div key={plan.id} className={`plan-card ${tier === plan.id ? 'current' : ''}`}>
                                {tier === plan.id && <div className="current-plan-badge">Current Plan</div>}
                                <div className="plan-header">
                                    <div className="plan-name">{plan.name}</div>
                                    <div className="plan-description">{plan.description}</div>
                                    <div className="plan-price">
                                        {plan.price}
                                        {plan.period && <span>{plan.period}</span>}
                                    </div>
                                </div>
                                <ul className="plan-features">
                                    {plan.features.map((feature, idx) => {
                                        const isChecked = typeof feature.value === 'boolean' ? feature.value : true;
                                        return (
                                            <li key={idx} className={`plan-feature-item ${!isChecked ? 'locked' : ''}`}>
                                                {isChecked ? (
                                                    <CheckCircle2 size={16} style={{ color: 'var(--color-success)' }} />
                                                ) : (
                                                    <XCircle size={16} style={{ color: 'var(--text-muted)' }} />
                                                )}
                                                <span>{feature.label}</span>
                                            </li>
                                        );
                                    })}
                                </ul>
                                {tier !== plan.id && (
                                    <button
                                        type="button"
                                        className={`btn ${plan.id === 'maker' ? 'btn-primary' : 'btn-secondary'}`}
                                        style={{ width: '100%', marginTop: 'var(--spacing-lg)' }}
                                        onClick={() => plan.id === 'free' ? manageSubscription() : subscribe(plan.id)}
                                    >
                                        {plan.id === 'free' ? 'Downgrade' : 'Select Plan'}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="card" style={{ marginTop: 'var(--spacing-2xl)', background: 'var(--glass-bg)' }}>
                        <div style={{ display: 'flex', gap: 'var(--spacing-lg)', alignItems: 'center' }}>
                            <div style={{ padding: 'var(--spacing-md)', background: 'rgba(124, 58, 237, 0.1)', borderRadius: '50%' }}>
                                <Zap size={32} style={{ color: 'var(--color-primary)' }} />
                            </div>
                            <div>
                                <h3 style={{ marginBottom: '4px' }}>Why upgrade?</h3>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                    Professional plans unlock advanced manufacturing tools like <strong>End-to-end Traceability</strong>,
                                    <strong> Financial Insights</strong>, and <strong>Inventory History</strong> to help you scale your production and satisfy compliance requirements.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
