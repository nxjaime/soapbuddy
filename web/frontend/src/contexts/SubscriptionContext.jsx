import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { loadStripe } from '@stripe/stripe-js';
import { PLANS, TIER_LEVELS } from '../constants/plans';

const SubscriptionContext = createContext();

// Initialize Stripe outside component
const _stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

const _getCachedTier = () => {
    const cached = localStorage.getItem('soapbuddy_tier_cache');
    if (!cached) return 'free';

    const { tier, timestamp } = JSON.parse(cached);
    const thirtyMinutesMs = 30 * 60 * 1000;
    if (Date.now() - timestamp > thirtyMinutesMs) {
        localStorage.removeItem('soapbuddy_tier_cache');
        return 'free';
    }
    return tier;
};

const setCachedTier = (tier) => {
    localStorage.setItem('soapbuddy_tier_cache', JSON.stringify({
        tier,
        timestamp: Date.now()
    }));
};

export function SubscriptionProvider({ children }) {
    const { user } = useAuth();
    const [tier, setTier] = useState('free');
    const [profile, setProfile] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || !user.id) {
            setTier('free');
            setProfile(null);
            setLoading(false);
            return;
        }

        let mounted = true;

        const fetchProfile = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (!error && data && mounted) {
                setProfile(data);
                const newTier = data.plan_tier || 'free';
                setTier(newTier);
                setIsAdmin(data.is_admin || false);
                setCachedTier(newTier);
            } else if (error && mounted) {
                setTier('free');
                setIsAdmin(false);
            }
            if (mounted) setLoading(false);
        };

        fetchProfile();

        const channel = supabase
            .channel('profile-changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'profiles',
                filter: `id=eq.${user.id}`,
            }, (payload) => {
                if (payload.new && mounted) {
                    setProfile(payload.new);
                    const newTier = payload.new.plan_tier || 'free';
                    setTier(newTier);
                    setIsAdmin(payload.new.is_admin || false);
                    setCachedTier(newTier);
                }
            })
            .subscribe();

        return () => {
            mounted = false;
            if (channel) supabase.removeChannel(channel);
        };
    }, [user?.id]);

    /**
     * Start subscription checkout flow
     */
    const subscribe = async (planId) => {
        if (!user) return;

        try {
            const priceId = PLANS[planId]?.priceId;
            if (!priceId) throw new Error('Price ID not found for this plan');

            const { data, error } = await supabase.functions.invoke('create-checkout-session', {
                body: {
                    price: priceId,
                    return_url: window.location.origin
                }
            });

            if (error) throw error;
            if (data?.url) {
                window.location.href = data.url;
            }
        } catch (error) {
            console.error('Error creating checkout session:', error);
            alert('Failed to start checkout. Please try again.');
        }
    };

    /**
     * Open Customer Portal
     */
    const manageSubscription = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase.functions.invoke('create-portal-session', {
                body: {
                    return_url: window.location.origin + '/settings?tab=subscription'
                }
            });

            if (error) throw error;
            if (data?.url) {
                window.location.href = data.url;
            }
        } catch (error) {
            console.error('Error creating portal session:', error);
            alert('Failed to open billing portal. Please try again.');
        }
    };

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
        subscribe,
        manageSubscription,
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
