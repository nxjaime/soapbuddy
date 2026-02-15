import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const SubscriptionContext = createContext();

/**
 * Tier access map for feature gating
 * Each tier gets all features of the tier below it + its own
 */
const TIER_LEVELS = { free: 0, maker: 1, manufacturer: 2 };

const TIER_FEATURES = {
    free: {
        maxRecipes: 3,
        inventoryTransfers: false,
        financialInsights: false,
        traceability: false,
        label: 'Free',
    },
    maker: {
        maxRecipes: Infinity,
        inventoryTransfers: true,
        financialInsights: true,
        traceability: false,
        label: 'Maker',
    },
    manufacturer: {
        maxRecipes: Infinity,
        inventoryTransfers: true,
        financialInsights: true,
        traceability: true,
        label: 'Manufacturer',
    },
};

export function SubscriptionProvider({ children }) {
    const { user } = useAuth();
    const [tier, setTier] = useState('free');
    const [profile, setProfile] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setTier('free');
            setProfile(null);
            setLoading(false);
            return;
        }

        const fetchProfile = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (!error && data) {
                setProfile(data);
                setTier(data.plan_tier || 'free');
                setIsAdmin(data.is_admin || false);
            } else {
                setTier('free');
                setIsAdmin(false);
            }
            setLoading(false);
        };

        fetchProfile();

        // Listen for realtime changes to profile (e.g. upgrade)
        const channel = supabase
            .channel('profile-changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'profiles',
                filter: `id=eq.${user.id}`,
            }, (payload) => {
                if (payload.new) {
                    setProfile(payload.new);
                    setTier(payload.new.plan_tier || 'free');
                    setIsAdmin(payload.new.is_admin || false);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    /**
     * Check if current tier has a specific feature
     */
    const hasFeature = (featureName) => {
        const features = TIER_FEATURES[tier] || TIER_FEATURES.free;
        return features[featureName] ?? false;
    };

    /**
     * Check if current tier meets a minimum required tier
     */
    const meetsMinTier = (requiredTier) => {
        return (TIER_LEVELS[tier] || 0) >= (TIER_LEVELS[requiredTier] || 0);
    };

    const value = {
        tier,
        profile,
        isAdmin,
        loading,
        features: TIER_FEATURES[tier] || TIER_FEATURES.free,
        hasFeature,
        meetsMinTier,
        TIER_FEATURES,
    };

    return (
        <SubscriptionContext.Provider value={value}>
            {children}
        </SubscriptionContext.Provider>
    );
}

export function useSubscription() {
    const context = useContext(SubscriptionContext);
    if (!context) {
        throw new Error('useSubscription must be used within a SubscriptionProvider');
    }
    return context;
}
