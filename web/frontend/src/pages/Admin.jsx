import { useState, useEffect } from 'react';
import {
    Users,
    ShieldCheck,
    UserPlus,
    Search,
    Filter,
    ArrowUpDown,
    MoreVertical,
    CheckCircle2,
    XCircle,
    Calendar,
    Mail
} from 'lucide-react';
import { getProfiles, updateProfileTier } from '../api/client';
import { useSubscription } from '../contexts/SubscriptionContext';

export default function Admin() {
    const { isAdmin, PLANS } = useSubscription();
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [updating, setUpdating] = useState(null);

    useEffect(() => {
        if (isAdmin) {
            fetchData();
        }
    }, [isAdmin]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await getProfiles();
            setProfiles(data || []);
        } catch (error) {
            console.error('Failed to fetch profiles:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTierChange = async (userId, newTier) => {
        try {
            setUpdating(userId);
            await updateProfileTier(userId, newTier);
            // Optimistic update
            setProfiles(prev => prev.map(p => p.id === userId ? { ...p, plan_tier: newTier } : p));
        } catch (error) {
            console.error('Failed to update tier:', error);
        } finally {
            setUpdating(null);
        }
    };

    if (!isAdmin) {
        return (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                <ShieldCheck size={64} style={{ color: 'var(--color-error)', marginBottom: 'var(--spacing-md)' }} />
                <h2>Access Denied</h2>
                <p>You do not have administrative privileges to view this page.</p>
            </div>
        );
    }

    const filteredProfiles = profiles.filter(p =>
        (p.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.business_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.id || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="admin-page">
            <div className="page-header">
                <h1 className="page-title">
                    <ShieldCheck className="icon" style={{ color: 'var(--color-primary-light)' }} />
                    User Management
                </h1>
                <div className="flex-responsive">
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Search users..."
                            style={{ paddingLeft: '40px', width: '300px' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="stats-grid">
                <div className="stat-card primary">
                    <div className="stat-icon">
                        <Users />
                    </div>
                    <div className="stat-value">{profiles.length}</div>
                    <div className="stat-label">Total Users</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">
                        <CheckCircle2 style={{ color: 'var(--color-success)' }} />
                    </div>
                    <div className="stat-value">
                        {profiles.filter(p => p.plan_tier !== 'free').length}
                    </div>
                    <div className="stat-label">Paid Subscriptions</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">
                        <Calendar style={{ color: 'var(--color-info)' }} />
                    </div>
                    <div className="stat-value">
                        {profiles.filter(p => new Date(p.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
                    </div>
                    <div className="stat-label">New (Last 7 Days)</div>
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Business</th>
                                <th>Plan Tier</th>
                                <th>Joined</th>
                                <th>ID</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i}>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                            Loading users...
                                        </td>
                                    </tr>
                                ))
                            ) : filteredProfiles.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '3rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)' }}>
                                            <Users size={48} opacity={0.3} />
                                            <p>No users found matching your search.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredProfiles.map(profile => (
                                    <tr key={profile.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{
                                                    width: '36px',
                                                    height: '36px',
                                                    borderRadius: '50%',
                                                    background: 'var(--gradient-primary)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontWeight: 'bold',
                                                    fontSize: '0.8rem'
                                                }}>
                                                    {(profile.full_name || 'U')[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: '600' }}>{profile.full_name || 'Anonymous User'}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{profile.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{profile.business_name || '—'}</td>
                                        <td>
                                            <select
                                                className="form-input"
                                                style={{ width: 'auto', fontSize: '0.8rem', padding: '4px 8px' }}
                                                value={profile.plan_tier || 'free'}
                                                onChange={(e) => handleTierChange(profile.id, e.target.value)}
                                                disabled={updating === profile.id}
                                            >
                                                {Object.values(PLANS).map(plan => (
                                                    <option key={plan.id} value={plan.id}>
                                                        {plan.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '0.875rem' }}>
                                                {new Date(profile.created_at).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td>
                                            <code style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                                {profile.id.substring(0, 8)}...
                                            </code>
                                        </td>
                                        <td>
                                            <button className="btn-icon">
                                                <MoreVertical size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
