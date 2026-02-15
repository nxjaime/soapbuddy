import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Droplets, Package, BookOpen, ArrowRight, Check, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { bulkImportOils } from '../api/client';
import { OIL_LIBRARY } from '../data/minimizedOilLibrary';

const WIZARD_STORAGE_KEY = 'soapbuddy_wizard_complete';

/**
 * WelcomeWizard — shown when a user has zero recipes.
 * 3 steps: business name → import oils → go to recipes.
 *
 * Props:
 *   userId   — current user's UUID
 *   onDone   — callback when wizard is dismissed / completed
 */
export default function WelcomeWizard({ userId, onDone }) {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [businessName, setBusinessName] = useState('');
    const [saving, setSaving] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const [importing, setImporting] = useState(false);

    function dismiss() {
        localStorage.setItem(WIZARD_STORAGE_KEY, 'true');
        onDone?.();
    }

    async function handleStep1Submit(e) {
        e.preventDefault();
        if (!businessName.trim()) { setStep(2); return; }
        setSaving(true);
        try {
            await supabase
                .from('profiles')
                .update({ business_name: businessName.trim() })
                .eq('id', userId);
        } catch (err) {
            console.warn('Could not save business name:', err);
        } finally {
            setSaving(false);
            setStep(2);
        }
    }

    async function handleImportOils() {
        setImporting(true);
        try {
            const result = await bulkImportOils(OIL_LIBRARY);
            setImportResult(result);
        } catch (err) {
            console.error('Import failed:', err);
            alert('Import failed: ' + err.message);
        } finally {
            setImporting(false);
        }
    }

    function handleGoToRecipes() {
        dismiss();
        navigate('/recipes');
    }

    const steps = [
        { n: 1, label: 'Welcome' },
        { n: 2, label: 'Import Oils' },
        { n: 3, label: 'First Recipe' },
    ];

    return (
        <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.55)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
        }}>
            <div style={{
                background: 'var(--surface-1, #fff)',
                borderRadius: 16,
                width: '100%',
                maxWidth: 520,
                padding: '2rem',
                boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
            }}>
                {/* Step indicators */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '2rem' }}>
                    {steps.map(s => (
                        <div key={s.n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                            <div style={{
                                width: 32, height: 32, borderRadius: '50%',
                                background: step === s.n ? 'var(--color-primary, #6d8b6e)' : step > s.n ? 'var(--color-success, #22c55e)' : 'var(--surface-2, #f3f4f6)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: step >= s.n ? '#fff' : 'var(--text-muted)',
                                fontWeight: 700, fontSize: '0.875rem',
                                transition: 'background 0.2s',
                            }}>
                                {step > s.n ? <Check size={16} /> : s.n}
                            </div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{s.label}</span>
                        </div>
                    ))}
                </div>

                {/* Step 1: Welcome + Business Name */}
                {step === 1 && (
                    <div>
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <Droplets size={48} style={{ color: 'var(--color-primary, #6d8b6e)', marginBottom: '0.75rem' }} />
                            <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem', fontWeight: 700 }}>
                                Welcome to SoapBuddy!
                            </h2>
                            <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                                Your craft soap business tool is ready. Let's set up your workspace in just a few steps.
                            </p>
                        </div>
                        <form onSubmit={handleStep1Submit}>
                            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: '1.5rem' }}>
                                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Business Name (optional)</span>
                                <input
                                    value={businessName}
                                    onChange={e => setBusinessName(e.target.value)}
                                    placeholder="e.g. Lavender Moon Soapworks"
                                    style={{
                                        padding: '0.625rem 0.75rem',
                                        borderRadius: 8,
                                        border: '1px solid var(--border, #e5e7eb)',
                                        fontSize: '1rem',
                                    }}
                                />
                            </label>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <button
                                    type="button"
                                    onClick={dismiss}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.875rem' }}
                                >
                                    Skip setup
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={saving}
                                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                                >
                                    {saving ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                                    Next
                                    <ArrowRight size={16} />
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Step 2: Import Oils */}
                {step === 2 && (
                    <div>
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <Package size={48} style={{ color: 'var(--color-primary, #6d8b6e)', marginBottom: '0.75rem' }} />
                            <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem', fontWeight: 700 }}>
                                Import Your Oils
                            </h2>
                            <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                                Get started instantly with our master library of {OIL_LIBRARY.length} oils &mdash; complete with SAP values, fatty acid profiles, and soap quality data.
                            </p>
                        </div>

                        {importResult ? (
                            <div style={{
                                background: 'var(--color-success-bg, #f0fdf4)',
                                border: '1px solid var(--color-success, #22c55e)',
                                borderRadius: 8,
                                padding: '1rem',
                                marginBottom: '1.5rem',
                                textAlign: 'center',
                            }}>
                                <Check size={24} style={{ color: 'var(--color-success, #22c55e)', marginBottom: 4 }} />
                                <p style={{ margin: 0, fontWeight: 600 }}>
                                    {importResult.imported} oils imported!
                                </p>
                                {importResult.skipped > 0 && (
                                    <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                        {importResult.skipped} already existed — skipped.
                                    </p>
                                )}
                            </div>
                        ) : (
                            <button
                                className="btn btn-primary"
                                onClick={handleImportOils}
                                disabled={importing}
                                style={{ width: '100%', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                            >
                                {importing ? (
                                    <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                                ) : (
                                    <Package size={16} />
                                )}
                                {importing ? 'Importing…' : `Import ${OIL_LIBRARY.length} Oils`}
                            </button>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <button
                                type="button"
                                onClick={() => setStep(3)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.875rem' }}
                            >
                                Skip for now
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={() => setStep(3)}
                                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                            >
                                Next
                                <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Create First Recipe */}
                {step === 3 && (
                    <div>
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <BookOpen size={48} style={{ color: 'var(--color-primary, #6d8b6e)', marginBottom: '0.75rem' }} />
                            <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem', fontWeight: 700 }}>
                                Create Your First Recipe
                            </h2>
                            <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                                You're all set! Head to the Recipes page to create your first soap formula. Use the Calculator to figure out your lye amounts.
                            </p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            <button
                                className="btn btn-primary"
                                onClick={handleGoToRecipes}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                            >
                                <BookOpen size={16} />
                                Go to Recipes
                                <ArrowRight size={16} />
                            </button>
                        </div>

                        <div style={{ textAlign: 'center' }}>
                            <button
                                type="button"
                                onClick={dismiss}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.875rem' }}
                            >
                                Dismiss and explore on my own
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
