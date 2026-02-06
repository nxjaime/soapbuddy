import { useState } from 'react';
import {
    Settings as SettingsIcon,
    Moon,
    Sun,
    Save,
    Database,
    Bell,
    Palette,
    User
} from 'lucide-react';

export default function Settings() {
    const [settings, setSettings] = useState({
        businessName: 'My Soap Business',
        ownerName: '',
        email: '',
        currency: 'USD',
        defaultUnit: 'g',
        lowStockThreshold: 100,
        theme: 'dark'
    });

    const [saved, setSaved] = useState(false);

    function handleChange(field, value) {
        setSettings(prev => ({ ...prev, [field]: value }));
        setSaved(false);
    }

    function handleSave(e) {
        e.preventDefault();
        // In a real app, this would save to backend/localStorage
        localStorage.setItem('soapmanager_settings', JSON.stringify(settings));
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">
                    <SettingsIcon className="icon" />
                    Settings
                </h1>
            </div>

            <form onSubmit={handleSave}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'var(--spacing-lg)' }}>

                    {/* Business Info */}
                    <div className="card" style={{ padding: 'var(--spacing-lg)' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--spacing-lg)' }}>
                            <User size={20} />
                            Business Information
                        </h3>

                        <div className="form-group">
                            <label className="form-label">Business Name</label>
                            <input
                                type="text"
                                className="form-input"
                                value={settings.businessName}
                                onChange={(e) => handleChange('businessName', e.target.value)}
                                placeholder="Your Soap Company"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Owner Name</label>
                            <input
                                type="text"
                                className="form-input"
                                value={settings.ownerName}
                                onChange={(e) => handleChange('ownerName', e.target.value)}
                                placeholder="Your Name"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input
                                type="email"
                                className="form-input"
                                value={settings.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                placeholder="you@example.com"
                            />
                        </div>
                    </div>

                    {/* Preferences */}
                    <div className="card" style={{ padding: 'var(--spacing-lg)' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--spacing-lg)' }}>
                            <Palette size={20} />
                            Preferences
                        </h3>

                        <div className="form-group">
                            <label className="form-label">Currency</label>
                            <select
                                className="form-input form-select"
                                value={settings.currency}
                                onChange={(e) => handleChange('currency', e.target.value)}
                            >
                                <option value="USD">USD ($)</option>
                                <option value="EUR">EUR (€)</option>
                                <option value="GBP">GBP (£)</option>
                                <option value="CAD">CAD ($)</option>
                                <option value="AUD">AUD ($)</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Default Weight Unit</label>
                            <select
                                className="form-input form-select"
                                value={settings.defaultUnit}
                                onChange={(e) => handleChange('defaultUnit', e.target.value)}
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
                                    className={`btn ${settings.theme === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => handleChange('theme', 'dark')}
                                    style={{ flex: 1 }}
                                >
                                    <Moon size={16} />
                                    Dark
                                </button>
                                <button
                                    type="button"
                                    className={`btn ${settings.theme === 'light' ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => handleChange('theme', 'light')}
                                    style={{ flex: 1 }}
                                >
                                    <Sun size={16} />
                                    Light
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Inventory */}
                    <div className="card" style={{ padding: 'var(--spacing-lg)' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--spacing-lg)' }}>
                            <Database size={20} />
                            Inventory Settings
                        </h3>

                        <div className="form-group">
                            <label className="form-label">Low Stock Threshold (g)</label>
                            <input
                                type="number"
                                className="form-input"
                                value={settings.lowStockThreshold}
                                onChange={(e) => handleChange('lowStockThreshold', parseInt(e.target.value))}
                                min="0"
                            />
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                Get alerted when ingredient stock falls below this amount.
                            </p>
                        </div>
                    </div>

                    {/* Notifications */}
                    <div className="card" style={{ padding: 'var(--spacing-lg)' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--spacing-lg)' }}>
                            <Bell size={20} />
                            Notifications
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
                                <input type="checkbox" defaultChecked style={{ width: '18px', height: '18px' }} />
                                <span>Low stock alerts on dashboard</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
                                <input type="checkbox" defaultChecked style={{ width: '18px', height: '18px' }} />
                                <span>Batch completion reminders</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
                                <input type="checkbox" style={{ width: '18px', height: '18px' }} />
                                <span>Weekly summary reports</span>
                            </label>
                        </div>
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
                    <button type="submit" className="btn btn-primary">
                        <Save size={18} />
                        Save Settings
                    </button>
                </div>
            </form>
        </div>
    );
}
