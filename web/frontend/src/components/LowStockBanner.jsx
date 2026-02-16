import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';

/**
 * Shows dismissible alerts for:
 * - Ingredients at or below their reorder threshold (low stock)
 * - Ingredients expiring within 30 days or already expired
 *
 * Clicking either alert navigates to /ingredients with the relevant filter.
 */
export default function LowStockBanner() {
    const [lowStockCount, setLowStockCount] = useState(0);
    const [expiringCount, setExpiringCount] = useState(0);
    const [expiredCount, setExpiredCount] = useState(0);
    const [dismissed, setDismissed] = useState({ lowStock: false, expiry: false });
    const navigate = useNavigate();

    useEffect(() => {
        async function fetchAlerts() {
            const today = new Date().toISOString().split('T')[0];
            const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                .toISOString().split('T')[0];

            const [{ data: lowStock }, { data: expiring }, { data: expired }] =
                await Promise.all([
                    // Items where quantity has fallen to or below the reorder threshold
                    supabase
                        .from('ingredients')
                        .select('id', { count: 'exact', head: true })
                        .gt('reorder_threshold', 0)
                        .filter('quantity_on_hand', 'lte', 'reorder_threshold'),

                    // Items expiring within 30 days (but not yet expired)
                    supabase
                        .from('ingredients')
                        .select('id', { count: 'exact', head: true })
                        .gt('expiry_date', today)
                        .lte('expiry_date', in30Days),

                    // Items already past their expiry date
                    supabase
                        .from('ingredients')
                        .select('id', { count: 'exact', head: true })
                        .lte('expiry_date', today),
                ]);

            setLowStockCount(lowStock?.length ?? 0);
            setExpiringCount(expiring?.length ?? 0);
            setExpiredCount(expired?.length ?? 0);
        }

        fetchAlerts();
    }, []);

    const hasLowStock = lowStockCount > 0 && !dismissed.lowStock;
    const hasExpiry = (expiringCount > 0 || expiredCount > 0) && !dismissed.expiry;

    if (!hasLowStock && !hasExpiry) return null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-lg)' }}>
            {hasLowStock && (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-sm)',
                        padding: 'var(--spacing-sm) var(--spacing-md)',
                        background: 'color-mix(in srgb, var(--color-warning) 15%, transparent)',
                        border: '1px solid var(--color-warning)',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer'
                    }}
                    onClick={() => navigate('/ingredients?filter=low-stock')}
                    role="alert"
                >
                    <AlertTriangle size={18} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: '0.875rem' }}>
                        <strong>{lowStockCount} ingredient{lowStockCount !== 1 ? 's' : ''}</strong> below reorder threshold — click to review
                    </span>
                    <button
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0 4px' }}
                        onClick={(e) => { e.stopPropagation(); setDismissed(d => ({ ...d, lowStock: true })); }}
                        aria-label="Dismiss low stock alert"
                    >
                        ×
                    </button>
                </div>
            )}

            {hasExpiry && (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-sm)',
                        padding: 'var(--spacing-sm) var(--spacing-md)',
                        background: 'color-mix(in srgb, var(--color-error) 12%, transparent)',
                        border: '1px solid var(--color-error)',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer'
                    }}
                    onClick={() => navigate('/ingredients?filter=expiring')}
                    role="alert"
                >
                    <Clock size={18} style={{ color: 'var(--color-error)', flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: '0.875rem' }}>
                        {expiredCount > 0 && (
                            <><strong>{expiredCount} expired</strong>{expiringCount > 0 ? ' · ' : ''}</>
                        )}
                        {expiringCount > 0 && (
                            <><strong>{expiringCount} expiring</strong> within 30 days</>
                        )}
                        {' '}— click to review
                    </span>
                    <button
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0 4px' }}
                        onClick={(e) => { e.stopPropagation(); setDismissed(d => ({ ...d, expiry: true })); }}
                        aria-label="Dismiss expiry alert"
                    >
                        ×
                    </button>
                </div>
            )}
        </div>
    );
}
