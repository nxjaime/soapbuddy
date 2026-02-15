import { useState, useRef } from 'react';
import { X, Download, Upload } from 'lucide-react';
import html2canvas from 'html2canvas';

/**
 * LabelStudio — INCI-sorted cosmetic label creator.
 * Gated behind manufacturer tier (caller must enforce).
 *
 * Props:
 *   recipe  — recipe object with recipe_ingredients joined to ingredients (including inci_code)
 *   onClose — callback to close the modal
 *   businessName — business name from profile/settings (optional)
 */
export default function LabelStudio({ recipe, onClose, businessName = '' }) {
    const labelRef = useRef(null);

    const [fields, setFields] = useState({
        productName: recipe?.name || '',
        tagline: '',
        netWeight: '',
        warnings: 'Keep out of reach of children. External use only.',
        customBusinessName: businessName,
    });
    const [logoUrl, setLogoUrl] = useState(null);
    const [exporting, setExporting] = useState(false);

    // Build INCI-sorted ingredient list (descending by quantity)
    const sortedIngredients = (recipe?.ingredients || [])
        .slice()
        .sort((a, b) => (b.quantity || 0) - (a.quantity || 0));

    function getInciName(ing) {
        const ingredient = ing.ingredient || ing;
        return ingredient.inci_code || ingredient.inci_name || ingredient.name || 'Unknown';
    }

    function handleFieldChange(e) {
        const { name, value } = e.target;
        setFields(prev => ({ ...prev, [name]: value }));
    }

    function handleLogoUpload(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => setLogoUrl(ev.target.result);
        reader.readAsDataURL(file);
    }

    async function handleExport() {
        if (!labelRef.current) return;
        setExporting(true);
        try {
            const canvas = await html2canvas(labelRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
            });
            const link = document.createElement('a');
            link.download = `${fields.productName || 'label'}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            console.error('Export failed:', err);
            alert('Export failed: ' + err.message);
        } finally {
            setExporting(false);
        }
    }

    const inciList = sortedIngredients.map(ing => getInciName(ing)).join(', ');

    return (
        <div
            style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.6)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem',
                overflowY: 'auto',
            }}
        >
            <div
                style={{
                    background: 'var(--surface-1, #fff)',
                    borderRadius: 12,
                    width: '100%',
                    maxWidth: 900,
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 0,
                    overflow: 'hidden',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                }}
            >
                {/* ── Left Panel: Controls ── */}
                <div style={{ padding: '1.5rem', borderRight: '1px solid var(--border, #e5e7eb)', overflowY: 'auto', maxHeight: '90vh' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Label Studio</h2>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                            <X size={20} />
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Product Name</span>
                            <input
                                name="productName"
                                value={fields.productName}
                                onChange={handleFieldChange}
                                className="form-input"
                                style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border, #e5e7eb)', fontSize: '0.875rem' }}
                            />
                        </label>

                        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Tagline</span>
                            <input
                                name="tagline"
                                value={fields.tagline}
                                onChange={handleFieldChange}
                                placeholder="e.g. Handcrafted with love"
                                className="form-input"
                                style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border, #e5e7eb)', fontSize: '0.875rem' }}
                            />
                        </label>

                        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Net Weight (e.g. 100g)</span>
                            <input
                                name="netWeight"
                                value={fields.netWeight}
                                onChange={handleFieldChange}
                                placeholder="100g / 3.5oz"
                                className="form-input"
                                style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border, #e5e7eb)', fontSize: '0.875rem' }}
                            />
                        </label>

                        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Business Name</span>
                            <input
                                name="customBusinessName"
                                value={fields.customBusinessName}
                                onChange={handleFieldChange}
                                placeholder="Your Business"
                                className="form-input"
                                style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border, #e5e7eb)', fontSize: '0.875rem' }}
                            />
                        </label>

                        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Warnings</span>
                            <textarea
                                name="warnings"
                                value={fields.warnings}
                                onChange={handleFieldChange}
                                rows={3}
                                style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border, #e5e7eb)', fontSize: '0.875rem', resize: 'vertical' }}
                            />
                        </label>

                        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Logo (optional)</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <label
                                    htmlFor="logo-upload"
                                    style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 6,
                                        padding: '0.4rem 0.75rem',
                                        border: '1px solid var(--border, #e5e7eb)',
                                        borderRadius: 6, cursor: 'pointer',
                                        fontSize: '0.875rem',
                                        background: 'var(--surface-2, #f9fafb)'
                                    }}
                                >
                                    <Upload size={14} />
                                    Upload Logo
                                </label>
                                <input
                                    id="logo-upload"
                                    type="file"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={handleLogoUpload}
                                />
                                {logoUrl && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Uploaded</span>}
                            </div>
                        </label>

                        <div style={{ borderTop: '1px solid var(--border, #e5e7eb)', paddingTop: '1rem' }}>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 0.5rem' }}>
                                <strong>Ingredients ({sortedIngredients.length})</strong> — sorted by weight descending
                            </p>
                            <ul style={{ margin: 0, padding: '0 0 0 1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {sortedIngredients.map((ing, i) => (
                                    <li key={i}>{getInciName(ing)} ({ing.quantity}{ing.unit || 'g'})</li>
                                ))}
                            </ul>
                        </div>

                        <button
                            className="btn btn-primary"
                            onClick={handleExport}
                            disabled={exporting}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: '0.5rem' }}
                        >
                            <Download size={16} />
                            {exporting ? 'Exporting…' : 'Export PNG'}
                        </button>
                    </div>
                </div>

                {/* ── Right Panel: Label Preview ── */}
                <div style={{
                    background: '#f0ebe5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem',
                    minHeight: 400
                }}>
                    {/* Printable label */}
                    <div
                        ref={labelRef}
                        style={{
                            background: '#ffffff',
                            width: 320,
                            minHeight: 420,
                            padding: '1.5rem',
                            borderRadius: 8,
                            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem',
                            fontFamily: 'Georgia, serif',
                            color: '#1a1a1a',
                        }}
                    >
                        {/* Logo */}
                        {logoUrl && (
                            <div style={{ textAlign: 'center' }}>
                                <img src={logoUrl} alt="logo" style={{ maxHeight: 60, maxWidth: 120, objectFit: 'contain' }} />
                            </div>
                        )}

                        {/* Product name */}
                        <div style={{ textAlign: 'center', borderBottom: '1px solid #ddd', paddingBottom: '0.75rem' }}>
                            <div style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '0.03em' }}>
                                {fields.productName || 'Product Name'}
                            </div>
                            {fields.tagline && (
                                <div style={{ fontSize: '0.75rem', color: '#6b7280', fontStyle: 'italic', marginTop: 4 }}>
                                    {fields.tagline}
                                </div>
                            )}
                        </div>

                        {/* Net weight */}
                        {fields.netWeight && (
                            <div style={{ fontSize: '0.8rem', color: '#4b5563', textAlign: 'center' }}>
                                Net Wt: <strong>{fields.netWeight}</strong>
                            </div>
                        )}

                        {/* INCI ingredient list */}
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7280', marginBottom: 4 }}>
                                Ingredients
                            </div>
                            <div style={{ fontSize: '0.7rem', lineHeight: 1.5, color: '#374151' }}>
                                {inciList || 'No ingredients'}
                            </div>
                        </div>

                        {/* Warnings */}
                        {fields.warnings && (
                            <div style={{ borderTop: '1px solid #ddd', paddingTop: '0.5rem' }}>
                                <div style={{ fontSize: '0.6rem', color: '#6b7280', lineHeight: 1.4 }}>
                                    {fields.warnings}
                                </div>
                            </div>
                        )}

                        {/* Business + Date footer */}
                        <div style={{ borderTop: '1px solid #ddd', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <div style={{ fontSize: '0.65rem', color: '#374151', fontWeight: 600 }}>
                                {fields.customBusinessName || 'Your Business'}
                            </div>
                            <div style={{ fontSize: '0.6rem', color: '#9ca3af' }}>
                                {new Date().toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
