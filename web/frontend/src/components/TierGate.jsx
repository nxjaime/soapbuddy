import { useNavigate } from 'react-router-dom';
import { Lock, ArrowRight } from 'lucide-react';
import { useSubscription } from '../contexts/SubscriptionContext';

/**
 * TierGate — wraps a route and shows an upgrade prompt if the user's tier
 * does not meet the minimum required tier.
 *
 * Usage:
 *   <TierGate requiredTier="maker">
 *     <Production />
 *   </TierGate>
 *
 *   or with featureId:
 *   <TierGate featureId="production">
 *     <Production />
 *   </TierGate>
 */
export default function TierGate({ children, requiredTier, featureId }) {
    const { meetsMinTier, hasFeature } = useSubscription();
    const navigate = useNavigate();

    // Determine if access is allowed
    let allowed = true;
    if (featureId) {
        allowed = hasFeature(featureId);
    } else if (requiredTier) {
        allowed = meetsMinTier(requiredTier);
    }

    if (allowed) return children;

    // Determine the plan name needed
    const requiredPlanName = requiredTier
        ? requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)
        : 'Maker';

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            gap: '1.5rem',
            padding: '2rem',
            textAlign: 'center'
        }}>
            <div style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'var(--surface-2, #f3f4f6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <Lock size={28} style={{ color: 'var(--text-muted, #9ca3af)' }} />
            </div>

            <div>
                <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem', fontWeight: 700 }}>
                    Upgrade to {requiredPlanName}+
                </h2>
                <p style={{ margin: 0, color: 'var(--text-muted, #6b7280)', maxWidth: 400 }}>
                    This feature is not available on your current plan.
                    Upgrade to unlock it and get access to more powerful tools.
                </p>
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                    className="btn btn-primary"
                    onClick={() => navigate('/settings?tab=subscription')}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    View Plans
                    <ArrowRight size={16} />
                </button>
                <button
                    className="btn btn-secondary"
                    onClick={() => navigate(-1)}
                >
                    Go Back
                </button>
            </div>
        </div>
    );
}
