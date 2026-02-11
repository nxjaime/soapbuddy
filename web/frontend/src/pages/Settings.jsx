import { useState, useEffect } from 'react';
import {
    Save,
    Bell,
    Monitor,
    Database,
    Building2,
    User,
    Palette,
    Moon,
    Sun
} from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

export default function Settings() {
    const { settings: globalSettings, updateSettings } = useSettings();
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
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        updateSettings(localSettings);
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    if (!localSettings) return null;

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">
                    <Monitor className="icon" />
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
                    <div className="card" style={{ padding: 'var(--spacing-lg)' }}>
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
                            <label className="form-label">Default Weight Unit</label>
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
                    <div className="card" style={{ padding: 'var(--spacing-lg)' }}>
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
                    <div className="card" style={{ padding: 'var(--spacing-lg)' }}>
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
        </div>
    );
}
