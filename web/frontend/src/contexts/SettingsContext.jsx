import React, { createContext, useState, useEffect, useContext } from 'react';

const SettingsContext = createContext();

export function useSettings() {
    return useContext(SettingsContext);
}

export function SettingsProvider({ children }) {
    const [settings, setSettings] = useState({
        businessName: 'My Soap Business',
        contactEmail: '',
        currency: 'USD',
        currencySymbol: '$',
        weightUnit: 'g',
        theme: 'dark',
        lowStockThreshold: 10,
        enableNotifications: true,
        emailAlerts: false,
        hiddenTabs: []
    });

    useEffect(() => {
        const savedSettings = localStorage.getItem('soapManager_settings');
        if (savedSettings) {
            try {
                const parsed = JSON.parse(savedSettings);
                // Ensure currency symbol is set
                const currencySymbol = getCurrencySymbol(parsed.currency || 'USD');
                setSettings({ ...parsed, currencySymbol, hiddenTabs: parsed.hiddenTabs || [] });
            } catch (e) {
                console.error('Failed to parse settings', e);
            }
        }
    }, []);

    useEffect(() => {
        // Apply theme to document
        document.documentElement.setAttribute('data-theme', settings.theme);
    }, [settings.theme]);

    const updateSettings = (newSettings) => {
        const currencySymbol = getCurrencySymbol(newSettings.currency || settings.currency);
        const updated = { ...settings, ...newSettings, currencySymbol };
        setSettings(updated);
        localStorage.setItem('soapManager_settings', JSON.stringify(updated));
    };

    const toggleTab = (tabPath) => {
        const hidden = settings.hiddenTabs || [];
        const newHidden = hidden.includes(tabPath)
            ? hidden.filter(t => t !== tabPath)
            : [...hidden, tabPath];
        updateSettings({ hiddenTabs: newHidden });
    };

    const isTabVisible = (tabPath) => {
        return !(settings.hiddenTabs || []).includes(tabPath);
    };

    const getCurrencySymbol = (currencyCode) => {
        switch (currencyCode) {
            case 'EUR': return '€';
            case 'GBP': return '£';
            case 'JPY': return '¥';
            case 'USD': default: return '$';
        }
    };

    return (
        <SettingsContext.Provider value={{
            settings,
            updateSettings,
            toggleTab,
            isTabVisible,
            formatCurrency: (amount) => `${settings.currencySymbol}${Number(amount).toFixed(2)}`
        }}>
            {children}
        </SettingsContext.Provider>
    );
}

