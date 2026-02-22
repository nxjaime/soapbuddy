import { useState, useEffect, useRef } from 'react';
import {
    Users,
    ShieldCheck,
    Search,
    CheckCircle2,
    Calendar,
    Mail,
    Trash2,
    Shield,
    ShieldOff,
    Copy,
    Eye,
    X,
    Send,
    AlertTriangle,
    Crown,
    UserX,
    ChevronDown
} from 'lucide-react';
import { getProfiles, updateProfileTier } from '../api/client';
import { useSubscription } from '../contexts/SubscriptionContext';
import supabase from '../lib/supabase';

export default function Admin() {
    const { isAdmin, allPlans: PLANS } = useSubscription();
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [updating, setUpdating] = useState(null);
    const [openMenu, setOpenMenu] = useState(null);
    const [toast, setToast] = useState(null);

    // Modal state
    const [messageModal, setMessageModal] = useState(null);
    const [deleteModal, setDeleteModal] = useState(null);
    const [detailModal, setDetailModal] = useState(null);
    const [adminToggleModal, setAdminToggleModal] = useState(null);

    const menuRef = useRef(null);

    useEffect(() => {
        if (isAdmin) fetchData();
    }, [isAdmin]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setOpenMenu(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Auto-dismiss toast
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await getProfiles();
            setProfiles(data || []);
        } catch (error) {
            console.error('Failed to fetch profiles:', error);
            showToast('Failed to load users', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
    };

    const handleTierChange = async (userId, newTier) => {
        try {
            setUpdating(userId);
            await updateProfileTier(userId, newTier);
            setProfiles(prev => prev.map(p => p.id === userId ? { ...p, plan_tier: newTier } : p));
            showToast(`Plan updated to ${newTier}`);
        } catch (error) {
            console.error('Failed to update tier:', error);
            showToast('Failed to update plan tier', 'error');
        } finally {
            setUpdating(null);
        }
    };

    const handleToggleAdmin = async () => {
        if (!adminToggleModal) return;
        const { id, is_admin, display_name } = adminToggleModal;
        try {
            setUpdating(id);
            const { error } = await supabase
                .from('profiles')
                .update({ is_admin: !is_admin })
                .eq('id', id);
            if (error) throw error;
            setProfiles(prev => prev.map(p => p.id === id ? { ...p, is_admin: !is_admin } : p));
            showToast(`${display_name} is ${!is_admin ? 'now an admin' : 'no longer an admin'}`);
        } catch (error) {
            console.error('Failed to toggle admin:', error);
            showToast('Failed to update admin status', 'error');
        } finally {
            setUpdating(null);
            setAdminToggleModal(null);
        }
    };

    const handleDeleteUser = async () => {
        if (!deleteModal) return;
        const { id, display_name } = deleteModal;
        try {
            setUpdating(id);
            // Soft-delete: archive the profile by clearing data
            // Full auth.users deletion requires service_role via edge function
            const { error } = await supabase
                .from('profiles')
                .update({
                    display_name: '[deleted]',
                    plan_tier: 'free',
                    is_admin: false,
                    settings: {},
                    business_address: null,
                    business_logo_url: null,
                    tax_id: null,
                    website: null
                })
                .eq('id', id);
            if (error) throw error;
            setProfiles(prev => prev.map(p => p.id === id ? {
                ...p,
                display_name: '[deleted]',
                plan_tier: 'free',
                is_admin: false
            } : p));
            showToast(`User ${display_name} has been deactivated`);
        } catch (error) {
            console.error('Failed to delete user:', error);
            showToast('Failed to delete user', 'error');
        } finally {
            setUpdating(null);
            setDeleteModal(null);
        }
    };

    const handleSendMessage = () => {
        if (!messageModal) return;
        const { display_name } = messageModal;
        const subject = encodeURIComponent(messageModal.subject || '');
        const body = encodeURIComponent(messageModal.body || '');
        const email = display_name; // display_name holds the email
        window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
        showToast(`Email client opened for ${display_name}`);
        setMessageModal(null);
    };

    const handleCopyId = (id) => {
        navigator.clipboard.writeText(id);
        showToast('User ID copied to clipboard');
        setOpenMenu(null);
    };

    const tierBadgeStyle = (tier) => {
        const colors = {
            free: { bg: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8', border: '1px solid rgba(148, 163, 184, 0.3)' },
            maker: { bg: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' },
            manufacturer: { bg: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.3)' },
        };
        return {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '3px 10px',
            borderRadius: '12px',
            fontSize: '0.75rem',
            fontWeight: '600',
            textTransform: 'capitalize',
            ...(colors[tier] || colors.free)
        };
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
        (p.display_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.plan_tier || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.id || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const adminCount = profiles.filter(p => p.is_admin).length;
    const paidCount = profiles.filter(p => p.plan_tier !== 'free').length;
    const recentCount = profiles.filter(p => new Date(p.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length;

    return (
        <div className="admin-page">
            {/* Toast notification */}
            {toast && (
                <div style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    padding: '12px 20px',
                    borderRadius: '8px',
                    background: toast.type === 'error' ? 'var(--color-error)' : 'var(--color-success)',
                    color: '#fff',
                    fontWeight: '500',
                    fontSize: '0.875rem',
                    zIndex: 10000,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    animation: 'slideIn 0.3s ease-out'
                }}>
                    {toast.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
                    {toast.message}
                </div>
            )}

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
                            placeholder="Search by email, tier, or ID..."
                            style={{ paddingLeft: '40px', width: '320px' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Stats row */}
            <div className="stats-grid">
                <div className="stat-card primary">
                    <div className="stat-icon"><Users /></div>
                    <div className="stat-value">{profiles.length}</div>
                    <div className="stat-label">Total Users</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon"><CheckCircle2 style={{ color: 'var(--color-success)' }} /></div>
                    <div className="stat-value">{paidCount}</div>
                    <div className="stat-label">Paid Subscriptions</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon"><Shield style={{ color: 'var(--color-warning)' }} /></div>
                    <div className="stat-value">{adminCount}</div>
                    <div className="stat-label">Admins</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon"><Calendar style={{ color: 'var(--color-info)' }} /></div>
                    <div className="stat-value">{recentCount}</div>
                    <div className="stat-label">New (7 Days)</div>
                </div>
            </div>

            {/* Users table */}
            <div className="card" style={{ padding: 0, overflow: 'visible' }}>
                <div className="table-container" style={{ overflow: 'visible' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Plan</th>
                                <th>Joined</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array(3).fill(0).map((_, i) => (
                                    <tr key={i}>
                                        <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                            Loading users...
                                        </td>
                                    </tr>
                                ))
                            ) : filteredProfiles.length === 0 ? (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center', padding: '3rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)' }}>
                                            <Users size={48} opacity={0.3} />
                                            <p>No users found matching your search.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredProfiles.map(profile => (
                                    <tr key={profile.id} style={{ opacity: profile.display_name === '[deleted]' ? 0.5 : 1 }}>
                                        {/* User cell */}
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '50%',
                                                    background: profile.is_admin ? 'linear-gradient(135deg, #f59e0b, #ef4444)' : 'var(--gradient-primary)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontWeight: 'bold',
                                                    fontSize: '0.85rem',
                                                    flexShrink: 0
                                                }}>
                                                    {profile.is_admin ? <Crown size={18} /> : (profile.display_name || 'U')[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                                                        {profile.display_name || 'Unknown User'}
                                                    </div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <code style={{ fontSize: '0.65rem' }}>{profile.id.substring(0, 8)}</code>
                                                        {profile.is_admin && (
                                                            <span style={{
                                                                background: 'rgba(245, 158, 11, 0.2)',
                                                                color: '#f59e0b',
                                                                padding: '1px 6px',
                                                                borderRadius: '4px',
                                                                fontWeight: '700',
                                                                fontSize: '0.6rem',
                                                                letterSpacing: '0.5px'
                                                            }}>ADMIN</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Plan tier cell */}
                                        <td>
                                            <div style={tierBadgeStyle(profile.plan_tier)}>
                                                {profile.plan_tier || 'free'}
                                            </div>
                                        </td>

                                        {/* Joined cell */}
                                        <td>
                                            <div style={{ fontSize: '0.85rem' }}>
                                                {new Date(profile.created_at).toLocaleDateString()}
                                            </div>
                                        </td>

                                        {/* Actions cell */}
                                        <td style={{ textAlign: 'right', position: 'relative' }}>
                                            <div style={{ position: 'relative', display: 'inline-block' }} ref={openMenu === profile.id ? menuRef : null}>
                                                <button
                                                    className="btn-icon"
                                                    onClick={() => setOpenMenu(openMenu === profile.id ? null : profile.id)}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        padding: '6px 12px',
                                                        borderRadius: '6px',
                                                        border: '1px solid var(--border-color)',
                                                        background: openMenu === profile.id ? 'var(--bg-hover)' : 'transparent',
                                                        cursor: 'pointer',
                                                        fontSize: '0.8rem',
                                                        color: 'var(--text-secondary)'
                                                    }}
                                                >
                                                    Actions <ChevronDown size={14} />
                                                </button>

                                                {openMenu === profile.id && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        right: 0,
                                                        top: '100%',
                                                        marginTop: '4px',
                                                        background: 'var(--bg-card)',
                                                        border: '1px solid var(--border-color)',
                                                        borderRadius: '8px',
                                                        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                                                        zIndex: 1000,
                                                        minWidth: '200px',
                                                        overflow: 'hidden'
                                                    }}>
                                                        {/* View Details */}
                                                        <button
                                                            onClick={() => { setDetailModal(profile); setOpenMenu(null); }}
                                                            style={menuItemStyle}
                                                            onMouseEnter={e => e.target.style.background = 'var(--bg-hover)'}
                                                            onMouseLeave={e => e.target.style.background = 'transparent'}
                                                        >
                                                            <Eye size={15} style={{ color: 'var(--color-info)' }} /> View Details
                                                        </button>

                                                        {/* Send Message */}
                                                        <button
                                                            onClick={() => {
                                                                setMessageModal({ ...profile, subject: '', body: '' });
                                                                setOpenMenu(null);
                                                            }}
                                                            style={menuItemStyle}
                                                            onMouseEnter={e => e.target.style.background = 'var(--bg-hover)'}
                                                            onMouseLeave={e => e.target.style.background = 'transparent'}
                                                        >
                                                            <Mail size={15} style={{ color: 'var(--color-primary-light)' }} /> Send Message
                                                        </button>

                                                        {/* Change Plan */}
                                                        <div style={{ ...menuItemStyle, cursor: 'default', flexDirection: 'column', alignItems: 'flex-start', gap: '6px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                                                                <Crown size={15} style={{ color: 'var(--color-warning)' }} />
                                                                <span>Change Plan</span>
                                                            </div>
                                                            <select
                                                                className="form-input"
                                                                style={{ width: '100%', fontSize: '0.75rem', padding: '4px 6px', margin: 0 }}
                                                                value={profile.plan_tier || 'free'}
                                                                onChange={(e) => { handleTierChange(profile.id, e.target.value); setOpenMenu(null); }}
                                                                disabled={updating === profile.id}
                                                            >
                                                                {Object.values(PLANS).map(plan => (
                                                                    <option key={plan.id} value={plan.id}>
                                                                        {plan.name}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>

                                                        {/* Copy User ID */}
                                                        <button
                                                            onClick={() => handleCopyId(profile.id)}
                                                            style={menuItemStyle}
                                                            onMouseEnter={e => e.target.style.background = 'var(--bg-hover)'}
                                                            onMouseLeave={e => e.target.style.background = 'transparent'}
                                                        >
                                                            <Copy size={15} style={{ color: 'var(--text-muted)' }} /> Copy User ID
                                                        </button>

                                                        <div style={{ borderTop: '1px solid var(--border-color)', margin: '4px 0' }} />

                                                        {/* Toggle Admin */}
                                                        <button
                                                            onClick={() => { setAdminToggleModal(profile); setOpenMenu(null); }}
                                                            style={menuItemStyle}
                                                            onMouseEnter={e => e.target.style.background = 'var(--bg-hover)'}
                                                            onMouseLeave={e => e.target.style.background = 'transparent'}
                                                        >
                                                            {profile.is_admin
                                                                ? <><ShieldOff size={15} style={{ color: 'var(--color-warning)' }} /> Revoke Admin</>
                                                                : <><Shield size={15} style={{ color: 'var(--color-success)' }} /> Grant Admin</>
                                                            }
                                                        </button>

                                                        {/* Delete User */}
                                                        <button
                                                            onClick={() => { setDeleteModal(profile); setOpenMenu(null); }}
                                                            style={{ ...menuItemStyle, color: 'var(--color-error)' }}
                                                            onMouseEnter={e => e.target.style.background = 'rgba(239, 68, 68, 0.1)'}
                                                            onMouseLeave={e => e.target.style.background = 'transparent'}
                                                        >
                                                            <Trash2 size={15} /> Delete User
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ===== MODALS ===== */}

            {/* Message Modal */}
            {messageModal && (
                <ModalOverlay onClose={() => setMessageModal(null)}>
                    <div style={modalStyle}>
                        <div style={modalHeaderStyle}>
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Mail size={20} style={{ color: 'var(--color-primary-light)' }} />
                                Send Message
                            </h3>
                            <button onClick={() => setMessageModal(null)} style={closeButtonStyle}><X size={18} /></button>
                        </div>
                        <div style={modalBodyStyle}>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                                Compose an email to <strong>{messageModal.display_name}</strong>
                            </div>
                            <label style={labelStyle}>Subject</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Enter subject..."
                                value={messageModal.subject || ''}
                                onChange={(e) => setMessageModal(prev => ({ ...prev, subject: e.target.value }))}
                                style={{ marginBottom: '12px' }}
                            />
                            <label style={labelStyle}>Message</label>
                            <textarea
                                className="form-input"
                                placeholder="Write your message..."
                                rows={6}
                                value={messageModal.body || ''}
                                onChange={(e) => setMessageModal(prev => ({ ...prev, body: e.target.value }))}
                                style={{ resize: 'vertical' }}
                            />
                        </div>
                        <div style={modalFooterStyle}>
                            <button className="btn secondary" onClick={() => setMessageModal(null)}>Cancel</button>
                            <button className="btn primary" onClick={handleSendMessage} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Send size={16} /> Open Email Client
                            </button>
                        </div>
                    </div>
                </ModalOverlay>
            )}

            {/* Delete Confirmation Modal */}
            {deleteModal && (
                <ModalOverlay onClose={() => setDeleteModal(null)}>
                    <div style={modalStyle}>
                        <div style={modalHeaderStyle}>
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-error)' }}>
                                <UserX size={20} />
                                Delete User
                            </h3>
                            <button onClick={() => setDeleteModal(null)} style={closeButtonStyle}><X size={18} /></button>
                        </div>
                        <div style={modalBodyStyle}>
                            <div style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                borderRadius: '8px',
                                padding: '16px',
                                display: 'flex',
                                gap: '12px',
                                alignItems: 'flex-start',
                                marginBottom: '16px'
                            }}>
                                <AlertTriangle size={20} style={{ color: 'var(--color-error)', flexShrink: 0, marginTop: '2px' }} />
                                <div>
                                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>This action cannot be undone</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                        The user profile for <strong>{deleteModal.display_name}</strong> will be
                                        deactivated. Their data will be cleared and their account will be marked
                                        as deleted.
                                    </div>
                                </div>
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                <strong>What will happen:</strong>
                                <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', lineHeight: '1.8' }}>
                                    <li>Display name set to [deleted]</li>
                                    <li>Plan tier reverted to Free</li>
                                    <li>Admin privileges revoked</li>
                                    <li>Business info and settings cleared</li>
                                </ul>
                            </div>
                        </div>
                        <div style={modalFooterStyle}>
                            <button className="btn secondary" onClick={() => setDeleteModal(null)}>Cancel</button>
                            <button
                                className="btn"
                                onClick={handleDeleteUser}
                                disabled={updating === deleteModal.id}
                                style={{
                                    background: 'var(--color-error)',
                                    color: '#fff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <Trash2 size={16} /> {updating === deleteModal.id ? 'Deleting...' : 'Delete User'}
                            </button>
                        </div>
                    </div>
                </ModalOverlay>
            )}

            {/* Admin Toggle Confirmation Modal */}
            {adminToggleModal && (
                <ModalOverlay onClose={() => setAdminToggleModal(null)}>
                    <div style={modalStyle}>
                        <div style={modalHeaderStyle}>
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {adminToggleModal.is_admin
                                    ? <><ShieldOff size={20} style={{ color: 'var(--color-warning)' }} /> Revoke Admin</>
                                    : <><Shield size={20} style={{ color: 'var(--color-success)' }} /> Grant Admin</>
                                }
                            </h3>
                            <button onClick={() => setAdminToggleModal(null)} style={closeButtonStyle}><X size={18} /></button>
                        </div>
                        <div style={modalBodyStyle}>
                            <div style={{
                                background: adminToggleModal.is_admin ? 'rgba(245, 158, 11, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                                border: `1px solid ${adminToggleModal.is_admin ? 'rgba(245, 158, 11, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
                                borderRadius: '8px',
                                padding: '16px',
                                display: 'flex',
                                gap: '12px',
                                alignItems: 'flex-start'
                            }}>
                                <AlertTriangle size={20} style={{
                                    color: adminToggleModal.is_admin ? 'var(--color-warning)' : 'var(--color-success)',
                                    flexShrink: 0,
                                    marginTop: '2px'
                                }} />
                                <div>
                                    {adminToggleModal.is_admin ? (
                                        <>
                                            <div style={{ fontWeight: '600', marginBottom: '4px' }}>Remove admin privileges?</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                <strong>{adminToggleModal.display_name}</strong> will lose access to
                                                user management, tier controls, and this admin dashboard.
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div style={{ fontWeight: '600', marginBottom: '4px' }}>Grant admin privileges?</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                <strong>{adminToggleModal.display_name}</strong> will gain full access to
                                                user management, tier controls, and this admin dashboard.
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div style={modalFooterStyle}>
                            <button className="btn secondary" onClick={() => setAdminToggleModal(null)}>Cancel</button>
                            <button
                                className="btn primary"
                                onClick={handleToggleAdmin}
                                disabled={updating === adminToggleModal.id}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                                {adminToggleModal.is_admin ? <ShieldOff size={16} /> : <Shield size={16} />}
                                {updating === adminToggleModal.id
                                    ? 'Updating...'
                                    : adminToggleModal.is_admin ? 'Revoke Admin' : 'Grant Admin'
                                }
                            </button>
                        </div>
                    </div>
                </ModalOverlay>
            )}

            {/* User Detail Modal */}
            {detailModal && (
                <ModalOverlay onClose={() => setDetailModal(null)}>
                    <div style={{ ...modalStyle, maxWidth: '500px' }}>
                        <div style={modalHeaderStyle}>
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Eye size={20} style={{ color: 'var(--color-info)' }} />
                                User Details
                            </h3>
                            <button onClick={() => setDetailModal(null)} style={closeButtonStyle}><X size={18} /></button>
                        </div>
                        <div style={modalBodyStyle}>
                            {/* User header */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px',
                                marginBottom: '24px',
                                padding: '16px',
                                background: 'var(--bg-hover)',
                                borderRadius: '12px'
                            }}>
                                <div style={{
                                    width: '56px',
                                    height: '56px',
                                    borderRadius: '50%',
                                    background: detailModal.is_admin ? 'linear-gradient(135deg, #f59e0b, #ef4444)' : 'var(--gradient-primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 'bold',
                                    fontSize: '1.2rem',
                                    flexShrink: 0
                                }}>
                                    {detailModal.is_admin ? <Crown size={24} /> : (detailModal.display_name || 'U')[0].toUpperCase()}
                                </div>
                                <div>
                                    <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>{detailModal.display_name || 'Unknown'}</div>
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                        <span style={tierBadgeStyle(detailModal.plan_tier)}>{detailModal.plan_tier}</span>
                                        {detailModal.is_admin && (
                                            <span style={{
                                                background: 'rgba(245, 158, 11, 0.2)',
                                                color: '#f59e0b',
                                                padding: '2px 8px',
                                                borderRadius: '8px',
                                                fontWeight: '700',
                                                fontSize: '0.7rem'
                                            }}>ADMIN</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Detail rows */}
                            <div style={{ display: 'grid', gap: '12px' }}>
                                <DetailRow label="User ID" value={detailModal.id} mono />
                                <DetailRow label="Plan Tier" value={detailModal.plan_tier || 'free'} />
                                <DetailRow label="Is Admin" value={detailModal.is_admin ? 'Yes' : 'No'} />
                                <DetailRow label="Joined" value={new Date(detailModal.created_at).toLocaleString()} />
                                <DetailRow label="Last Updated" value={detailModal.updated_at ? new Date(detailModal.updated_at).toLocaleString() : '—'} />
                                <DetailRow label="Business Address" value={detailModal.business_address || '—'} />
                                <DetailRow label="Website" value={detailModal.website || '—'} />
                                <DetailRow label="Tax ID" value={detailModal.tax_id || '—'} />
                            </div>
                        </div>
                        <div style={modalFooterStyle}>
                            <button className="btn secondary" onClick={() => setDetailModal(null)}>Close</button>
                            <button
                                className="btn primary"
                                onClick={() => { handleCopyId(detailModal.id); setDetailModal(null); }}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                                <Copy size={16} /> Copy User ID
                            </button>
                        </div>
                    </div>
                </ModalOverlay>
            )}
        </div>
    );
}

// ===== Reusable sub-components =====

function ModalOverlay({ children, onClose }) {
    return (
        <div
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: '20px'
            }}
        >
            {children}
        </div>
    );
}

function DetailRow({ label, value, mono }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{label}</span>
            <span style={{
                fontWeight: '500',
                fontSize: '0.85rem',
                ...(mono ? { fontFamily: 'monospace', fontSize: '0.75rem' } : {}),
                maxWidth: '280px',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
            }}>{value}</span>
        </div>
    );
}

// ===== Shared styles =====

const menuItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
    padding: '10px 14px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '0.85rem',
    color: 'var(--text-primary)',
    textAlign: 'left',
    transition: 'background 0.15s'
};

const modalStyle = {
    background: 'var(--bg-card)',
    borderRadius: '16px',
    border: '1px solid var(--border-color)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
    maxWidth: '480px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto'
};

const modalHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid var(--border-color)'
};

const modalBodyStyle = {
    padding: '24px'
};

const modalFooterStyle = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '16px 24px',
    borderTop: '1px solid var(--border-color)'
};

const closeButtonStyle = {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '6px',
    display: 'flex'
};

const labelStyle = {
    display: 'block',
    fontSize: '0.8rem',
    fontWeight: '600',
    color: 'var(--text-secondary)',
    marginBottom: '6px'
};
