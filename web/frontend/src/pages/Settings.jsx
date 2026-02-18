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
    Box,
    Download,
    Upload,
    Trash2
} from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { getAllData, bulkInsertIngredients, bulkInsertCustomers } from '../api/client';

export default function Settings() {
    const { settings: globalSettings, updateSettings, updateProfileData, toggleTab, isTabVisible, profile } = useSettings();
    const { tier, allPlans, subscribe, manageSubscription } = useSubscription();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'general';

    const [localSettings, setLocalSettings] = useState(globalSettings);
    // Local state for business profile fields not in settings
    const [businessProfile, setBusinessProfile] = useState({
        businessName: '',
        contactEmail: '',
        address: '',
        website: '',
        taxId: ''
    });

    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        setLocalSettings(globalSettings);
        if (profile) {
            setBusinessProfile({
                businessName: profile.business_name || '',
                contactEmail: globalSettings.contactEmail || '', 
                address: profile.business_address || '',
                website: profile.website || '',
                taxId: profile.tax_id || ''
            });
        }
    }, [globalSettings, profile]);

    const handleSettingChange = (e) => {
        const { name, value, type, checked } = e.target;
        setLocalSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setBusinessProfile(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Update preferences
            await updateSettings(localSettings);

            // Update business profile
            await updateProfileData({
                business_name: businessProfile.businessName,
                business_address: businessProfile.address,
                website: businessProfile.website,
                tax_id: businessProfile.taxId
            });
            
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            console.error('Failed to save settings:', err);
            alert('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleExport = async () => {
        try {
            const data = await getAllData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `soapbuddy_export_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Export failed:', err);
            alert('Failed to export data');
        }
    };

    const handleImport = async (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target.result;
            const lines = text.split('\n').filter(line => line.trim());
            if (lines.length < 2) return; // Header + 1 row

            // Simple CSV parser
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            const items = lines.slice(1).map(line => {
                const values = line.split(',');
                const obj = {};
                headers.forEach((h, i) => {
                    obj[h] = values[i]?.trim();
                });
                return obj;
            });

            try {
                if (type === 'ingredients') {
                    const result = await bulkInsertIngredients(items);
                    alert(`Successfully imported ${result.length} ingredients.`);
                } else if (type === 'customers') {
                    const result = await bulkInsertCustomers(items);
                    alert(`Successfully imported ${result.length} customers.`);
                }
            } catch (err) {
                console.error('Import failed:', err);
                alert('Import failed: ' + err.message);
            }
            e.target.value = ''; // Reset input
        };
        reader.readAsText(file);
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
                <button
                    type="button"
                    className={`btn ${activeTab === 'data' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setSearchParams({ tab: 'data' })}
                    style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottom: activeTab === 'data' ? 'none' : '1px solid var(--glass-border)' }}
                >
                    <Database size={18} />
                    Data
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
                                    value={businessProfile.businessName}
                                    onChange={handleProfileChange}
                                    placeholder="Your Soap Company"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Contact Email</label>
                                <input
                                    type="email"
                                    name="contactEmail"
                                    className="form-input"
                                    value={businessProfile.contactEmail}
                                    onChange={handleProfileChange}
                                    placeholder="you@example.com"
                                    disabled
                                    title="Contact support to change email"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Address</label>
                                <textarea
                                    name="address"
                                    className="form-input"
                                    rows="3"
                                    value={businessProfile.address}
                                    onChange={handleProfileChange}
                                    placeholder="123 Soap St, Clean City, ST 12345"
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Website</label>
                                    <input
                                        type="url"
                                        name="website"
                                        className="form-input"
                                        value={businessProfile.website}
                                        onChange={handleProfileChange}
                                        placeholder="https://example.com"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Tax ID / VAT</label>
                                    <input
                                        type="text"
                                        name="taxId"
                                        className="form-input"
                                        value={businessProfile.taxId}
                                        onChange={handleProfileChange}
                                        placeholder="Optional"
                                    />
                                </div>
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
            ) : activeTab === 'data' ? (
                <div className="data-management-tab">
                    <div className="card">
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--spacing-lg)' }}>
                            <Download size={20} />
                            Export Data
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-lg)' }}>
                            Download a complete backup of your ingredients, recipes, customers, sales, and production history.
                            The file will be in JSON format.
                        </p>
                        <button className="btn btn-primary" onClick={handleExport}>
                            <Download size={18} />
                            Export All Data
                        </button>
                    </div>

                    <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--spacing-lg)' }}>
                            <Upload size={20} />
                            Import Data
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-lg)' }}>
                            Bulk import data using CSV files. Duplicate names/emails will be skipped.
                        </p>

                        <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
                            <div style={{ padding: 'var(--spacing-md)', background: 'var(--glass-bg)', borderRadius: 'var(--radius-sm)' }}>
                                <h4 style={{ marginBottom: '8px' }}>Import Ingredients</h4>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                                    CSV Format: <code>name, cost, stock, unit</code>
                                </p>
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={(e) => handleImport(e, 'ingredients')}
                                    className="form-input"
                                />
                            </div>

                            <div style={{ padding: 'var(--spacing-md)', background: 'var(--glass-bg)', borderRadius: 'var(--radius-sm)' }}>
                                <h4 style={{ marginBottom: '8px' }}>Import Customers</h4>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                                    CSV Format: <code>name, email, phone, type</code>
                                </p>
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={(e) => handleImport(e, 'customers')}
                                    className="form-input"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="card" style={{ marginTop: 'var(--spacing-lg)', borderLeft: '4px solid var(--color-error)' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--spacing-lg)', color: 'var(--color-error)' }}>
                            <Trash2 size={20} />
                            Danger Zone
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-lg)' }}>
                            Once you delete your account, there is no going back. Please be certain.
                        </p>
                        <button className="btn btn-secondary" style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }} onClick={() => alert('Account deletion is not yet implemented.')}>
                            Delete Account
                        </button>
                    </div>
                </div>
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
