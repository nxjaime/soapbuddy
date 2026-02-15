import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const SubscriptionContext = createContext();

/**
 * Tier definitions and feature limits
 */
export const PLANS = {
    free: {
        id: 'free',
        name: 'Free',
        price: '$0',
        description: 'Perfect for hobbyists starting their soap-making journey.',
        features: [
            { id: 'maxRecipes', label: 'Up to 3 Recipes', value: 3 },
            { id: 'inventoryTransfers', label: 'Basic Inventory', value: false },
            { id: 'financialInsights', label: 'Financial Insights', value: false },
            { id: 'traceability', label: 'Batch Traceability', value: false },
            { id: 'admin', label: 'Admin Access', value: false },
        ]
    },
    maker: {
        id: 'maker',
        name: 'Maker',
        price: '$12',
        period: '/mo',
        description: 'For growing craft businesses who need more control.',
        features: [
            { id: 'maxRecipes', label: 'Unlimited Recipes', value: Infinity },
            { id: 'inventoryTransfers', label: 'Inventory Transfers', value: true },
            { id: 'financialInsights', label: 'Financial Insights', value: true },
            { id: 'traceability', label: 'Batch Traceability', value: false },
            { id: 'admin', label: 'Admin Access', value: false },
        ]
    },
    manufacturer: {
        id: 'manufacturer',
        name: 'Manufacturer',
        price: '$29',
        period: '/mo',
        description: 'Advanced features for professional soap manufacturing.',
        features: [
            { id: 'maxRecipes', label: 'Unlimited Recipes', value: Infinity },
            { id: 'inventoryTransfers', label: 'Inventory Transfers', value: true },
            { id: 'financialInsights', label: 'Financial Insights', value: true },
            { id: 'traceability', label: 'End-to-end Traceability', value: true },
            { id: 'admin', label: 'Admin Access', value: false }, // Only super admins
        ]
    }
};

const TIER_LEVELS = { free: 0, maker: 1, manufacturer: 2 };

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
            if (channel) supabase.removeChannel(channel);
        };
    }, [user]);

    /**
     * Check if current tier has a specific feature
     */
    const hasFeature = (featureId) => {
        const plan = PLANS[tier] || PLANS.free;
        const feature = plan.features.find(f => f.id === featureId);
        if (!feature) return false;
        return typeof feature.value === 'boolean' ? feature.value : true;
    };

    /**
     * Get limit for a specific feature (e.g. number of recipes)
     */
    const getLimit = (featureId) => {
        const plan = PLANS[tier] || PLANS.free;
        const feature = plan.features.find(f => f.id === featureId);
        return feature ? feature.value : null;
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
        currentPlan: PLANS[tier] || PLANS.free,
        allPlans: PLANS,
        hasFeature,
        getLimit,
        meetsMinTier,
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
