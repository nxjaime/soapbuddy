import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabase';
import { updateProfile as apiUpdateProfile } from '../api/client';

const SettingsContext = createContext();

export function useSettings() {
    return useContext(SettingsContext);
}

export function SettingsProvider({ children }) {
    const [profile, setProfile] = useState(null);
    const [settings, setSettings] = useState({
        businessName: 'My Soap Business',
        contactEmail: '',
        currency: 'USD',
        currencySymbol: '$',
        weightUnit: 'g',
        theme: 'light',
        lowStockThreshold: 1000,
        enableNotifications: false,
        emailAlerts: false,
        hiddenTabs: []
    });

    useEffect(() => {
        let mounted = true;

        async function loadProfile() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                
                if (mounted && data) {
                    setProfile(data);
                    
                    // Merge DB settings with defaults
                    const dbSettings = data.settings || {};
                    
                    // Map generic settings JSON to our specific state structure if needed
                    // or just adopt the structure we planned:
                    // { theme, currency, weightUnit, notifications: {}, inventory: {}, sidebar: {} }
                    
                    // Compatibility: We need to map the flat state structure used by the app 
                    // to the nested JSON structure, or refactor the app to use nested.
                    // For now, let's flatten the DB settings into our state to minimize app breakage,
                    // but we should eventually align them.
                    
                    const flatSettings = {
                        businessName: data.business_name || 'My Soap Business',
                        contactEmail: user.email || '',
                        currency: dbSettings.currency || 'USD',
                        weightUnit: dbSettings.weightUnit || 'g',
                        theme: dbSettings.theme || 'light',
                        lowStockThreshold: dbSettings.inventory?.lowStockThreshold || 1000,
                        enableNotifications: dbSettings.notifications?.enabled || false,
                        emailAlerts: dbSettings.notifications?.email || false,
                        hiddenTabs: dbSettings.sidebar?.hidden || []
                    };

                    const currencySymbol = getCurrencySymbol(flatSettings.currency);
                    setSettings({ ...flatSettings, currencySymbol });
                    
                    // Apply theme
                    document.documentElement.setAttribute('data-theme', flatSettings.theme);
                }
            }
        }
        
        loadProfile();

        return () => { mounted = false; };
    }, []);

    const updateSettings = async (newFlatSettings) => {
        // Optimistic update
        const currencySymbol = getCurrencySymbol(newFlatSettings.currency || settings.currency);
        const updated = { ...settings, ...newFlatSettings, currencySymbol };
        setSettings(updated);
        document.documentElement.setAttribute('data-theme', updated.theme);

        // Construct JSON for DB
        const dbSettings = {
            theme: updated.theme,
            currency: updated.currency,
            weightUnit: updated.weightUnit,
            notifications: {
                enabled: updated.enableNotifications,
                email: updated.emailAlerts,
                lowStock: true // default
            },
            inventory: {
                lowStockThreshold: updated.lowStockThreshold
            },
            sidebar: {
                hidden: updated.hiddenTabs
            }
        };

        try {
            // We update settings JSON + business_name in one go if needed
            const updates = { settings: dbSettings };
            if (newFlatSettings.businessName) {
                updates.business_name = newFlatSettings.businessName;
            }
            
            await apiUpdateProfile(updates);
            
            // Also update local profile state
            setProfile(prev => ({ 
                ...prev, 
                settings: dbSettings, 
                business_name: updates.business_name || prev?.business_name 
            }));
            
        } catch (err) {
            console.error('Failed to persist settings:', err);
            // Revert? (Not strictly necessary for non-critical settings, but good practice)
        }
    };

    const updateProfileData = async (data) => {
        try {
            await apiUpdateProfile(data);
            setProfile(prev => ({ ...prev, ...data }));
            return true;
        } catch (err) {
            console.error('Failed to update profile data:', err);
            throw err;
        }
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

    const formatWeight = (grams) => {
        const n = parseFloat(grams) || 0;
        switch (settings.weightUnit) {
            case 'oz': return `${(n / 28.3495).toFixed(2)} oz`;
            case 'kg': return `${(n / 1000).toFixed(3)} kg`;
            case 'lb': return `${(n / 453.592).toFixed(3)} lb`;
            default:   return `${n.toFixed(1)} g`;
        }
    };

    return (
        <SettingsContext.Provider value={{
            profile,
            updateProfileData,
            settings,
            updateSettings,
            toggleTab,
            isTabVisible,
            formatCurrency: (amount) => `${settings.currencySymbol}${Number(amount).toFixed(2)}`,
            formatWeight
        }}>
            {children}
        </SettingsContext.Provider>
    );
}

