# Sprint 9: Formula Intelligence Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebrand Calculator to Formula Designer, add persistent Formulations library with Save/Load, bridge formulations to recipe creation, and add print capability to recipe cards.

**Architecture:** Purely frontend changes + one new Supabase table (`formulations`). Tasks are sequential (each builds on the previous). No new backend RPCs needed — all interactions use Supabase JS client directly via the existing `api/client.js` pattern.

**Tech Stack:** React 18, React Router v6, Supabase JS, Lucide React icons, Vite

---

## Task 1: Calculator → Formula Designer Rebrand

**Files:**
- Rename: `web/frontend/src/pages/Calculator.jsx` → `web/frontend/src/pages/FormulaDesigner.jsx`
- Modify: `web/frontend/src/App.jsx`
- Modify: `web/frontend/src/components/Layout.jsx`
- Modify: `web/frontend/src/pages/FormulaDesigner.jsx` (the renamed file)

### Step 1: Rename the file

```bash
cd /home/nickj/Documents/Soapmaker_App/SoapManager/web/frontend/src/pages
mv Calculator.jsx FormulaDesigner.jsx
```

### Step 2: Update the component export name and page title

In `FormulaDesigner.jsx`:
- Line 26: Change `export default function Calculator()` → `export default function FormulaDesigner()`
- Line 179: Change `Professional Soap Calculator` → `Formula Designer`
- Line 157: Change `window.open('/calculator/print', ...)` → `window.open('/formula-designer/print', ...)`

### Step 3: Update App.jsx

Replace the entire import and route block. Current state:
```jsx
import Calculator from './pages/Calculator'
// ...
<Route path="calculator" element={<Calculator />} />
// ...
<Route path="calculator/print" element={<PrintRecipe />} />
```

New state — add `Navigate` import, swap import, update routes:
```jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import FormulaDesigner from './pages/FormulaDesigner'
// ...
<Route path="formula-designer" element={<FormulaDesigner />} />
<Route path="calculator" element={<Navigate to="/formula-designer" replace />} />
// ...
<Route path="formula-designer/print" element={<PrintRecipe />} />
```

Note: Remove the old `<Route path="calculator/print" ...>` line too.

### Step 4: Update Layout.jsx nav item

In `allNavItems` array (around line 51):
```jsx
// OLD:
{ path: '/calculator', icon: Calculator, label: 'Calculator' },
// NEW:
{ path: '/formula-designer', icon: Calculator, label: 'Formula Designer' },
```

The `Calculator` icon import stays — it's the lucide icon, not the page component.

### Step 5: Verify build passes

```bash
cd /home/nickj/Documents/Soapmaker_App/SoapManager/web/frontend
npm run build
```

Expected: zero errors, build completes.

### Step 6: Commit

```bash
cd /home/nickj/Documents/Soapmaker_App/SoapManager
git add web/frontend/src/pages/FormulaDesigner.jsx
git add web/frontend/src/App.jsx
git add web/frontend/src/components/Layout.jsx
git commit -m "$(cat <<'EOF'
feat: rebrand Calculator to Formula Designer

Renamed Calculator.jsx → FormulaDesigner.jsx, updated route from
/calculator → /formula-designer with backward-compat redirect,
updated sidebar label and page title.

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Formulations Library Page + API

**Files:**
- Create: `web/frontend/src/pages/Formulations.jsx`
- Modify: `web/frontend/src/api/client.js` (add 4 functions)
- Modify: `web/frontend/src/App.jsx` (add route)
- Modify: `web/frontend/src/components/Layout.jsx` (add nav item)

### Step 1: Add API functions to client.js

Read `web/frontend/src/api/client.js` to find where to add. Append these after the last export:

```js
export async function getFormulations() {
    const { data, error } = await supabase
        .from('formulations')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
}

export async function getFormulation(id) {
    const { data, error } = await supabase
        .from('formulations')
        .select('*')
        .eq('id', id)
        .single();
    if (error) throw error;
    return data;
}

export async function createFormulation(formulation) {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
        .from('formulations')
        .insert({ ...formulation, user_id: user.id })
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function updateFormulation(id, updates) {
    const { data, error } = await supabase
        .from('formulations')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function deleteFormulation(id) {
    const { error } = await supabase
        .from('formulations')
        .delete()
        .eq('id', id);
    if (error) throw error;
}
```

### Step 2: Create Formulations.jsx

Create `web/frontend/src/pages/Formulations.jsx` with this full content:

```jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Beaker,
    Plus,
    Trash2,
    Edit2,
    FileText,
    Search,
    X,
    FlaskConical
} from 'lucide-react';
import {
    getFormulations,
    updateFormulation,
    deleteFormulation
} from '../api/client';

export default function Formulations() {
    const navigate = useNavigate();
    const [formulations, setFormulations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingFormulation, setEditingFormulation] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', description: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadFormulations();
    }, []);

    async function loadFormulations() {
        try {
            setLoading(true);
            const data = await getFormulations();
            setFormulations(data);
        } catch (err) {
            console.error('Failed to load formulations:', err);
        } finally {
            setLoading(false);
        }
    }

    function openEditModal(formulation) {
        setEditingFormulation(formulation);
        setEditForm({ name: formulation.name, description: formulation.description || '' });
        setIsEditModalOpen(true);
    }

    function closeEditModal() {
        setIsEditModalOpen(false);
        setEditingFormulation(null);
        setEditForm({ name: '', description: '' });
    }

    async function handleEditSubmit(e) {
        e.preventDefault();
        if (!editForm.name.trim()) return;
        try {
            setIsSubmitting(true);
            await updateFormulation(editingFormulation.id, {
                name: editForm.name.trim(),
                description: editForm.description.trim()
            });
            await loadFormulations();
            closeEditModal();
        } catch (err) {
            console.error('Failed to update formulation:', err);
            alert('Failed to update: ' + err.message);
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleDelete(id) {
        if (!confirm('Delete this formulation? This cannot be undone.')) return;
        try {
            await deleteFormulation(id);
            setFormulations(prev => prev.filter(f => f.id !== id));
        } catch (err) {
            console.error('Failed to delete formulation:', err);
            alert('Failed to delete: ' + err.message);
        }
    }

    function handleLoadInDesigner(formulation) {
        // Store formulation in sessionStorage and navigate to Formula Designer
        sessionStorage.setItem('load_formulation', JSON.stringify(formulation));
        navigate('/formula-designer');
    }

    function handleUseAsRecipe(formulation) {
        navigate(`/recipes?from_formula=${formulation.id}`);
    }

    const filtered = formulations.filter(f =>
        f.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">
                    <Beaker className="icon" />
                    Formulations Library
                </h1>
                <button className="btn btn-primary" onClick={() => navigate('/formula-designer')}>
                    <Plus size={16} /> New Formula
                </button>
            </div>

            <div className="card" style={{ marginBottom: 'var(--spacing-lg)', padding: 'var(--spacing-md)' }}>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    Save your tested oil ratios as <strong>Formulations</strong>. Load them into the Formula Designer to calculate lye, or use them as a template to create a new Recipe.
                </p>
            </div>

            <div className="search-bar" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <Search className="search-icon" size={20} />
                <input
                    type="text"
                    className="search-input"
                    placeholder="Search formulations..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="empty-state"><div className="loading-spinner" /></div>
            ) : filtered.length === 0 ? (
                <div className="empty-state">
                    <FlaskConical size={48} style={{ marginBottom: '16px', color: 'var(--text-muted)', opacity: 0.5 }} />
                    <h3>{search ? 'No formulations found' : 'No saved formulations yet'}</h3>
                    <p>{search ? 'Try a different search.' : 'Go to Formula Designer and click Save to store your oil ratios here.'}</p>
                    {!search && (
                        <button className="btn btn-primary" style={{ marginTop: 'var(--spacing-md)' }} onClick={() => navigate('/formula-designer')}>
                            Open Formula Designer
                        </button>
                    )}
                </div>
            ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'var(--glass-bg)', borderBottom: '1px solid var(--glass-border)' }}>
                                <th style={{ padding: 'var(--spacing-md)', textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Name</th>
                                <th style={{ padding: 'var(--spacing-md)', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Oils</th>
                                <th style={{ padding: 'var(--spacing-md)', textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Description</th>
                                <th style={{ padding: 'var(--spacing-md)', textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Created</th>
                                <th style={{ padding: 'var(--spacing-md)', textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(f => (
                                <tr key={f.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                    <td style={{ padding: 'var(--spacing-md)', fontWeight: 600 }}>{f.name}</td>
                                    <td style={{ padding: 'var(--spacing-md)', textAlign: 'center' }}>
                                        <span className="badge badge-info">{(f.oils || []).length}</span>
                                    </td>
                                    <td style={{ padding: 'var(--spacing-md)', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                        {f.description || '—'}
                                    </td>
                                    <td style={{ padding: 'var(--spacing-md)', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                        {new Date(f.created_at).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: 'var(--spacing-md)', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'flex-end' }}>
                                            <button
                                                className="btn btn-secondary"
                                                style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                                                onClick={() => handleLoadInDesigner(f)}
                                                title="Load in Formula Designer"
                                            >
                                                <Beaker size={14} /> Load
                                            </button>
                                            <button
                                                className="btn btn-secondary"
                                                style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                                                onClick={() => handleUseAsRecipe(f)}
                                                title="Create Recipe from this Formula"
                                            >
                                                <FileText size={14} /> Recipe
                                            </button>
                                            <button className="btn-icon" onClick={() => openEditModal(f)} title="Edit name/description">
                                                <Edit2 size={16} />
                                            </button>
                                            <button className="btn-icon" style={{ color: 'var(--color-error)' }} onClick={() => handleDelete(f.id)} title="Delete">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="modal-overlay" onClick={closeEditModal}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Edit Formulation</h2>
                            <button className="btn-icon" onClick={closeEditModal}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleEditSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Name *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={editForm.name}
                                        onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea
                                        className="form-input"
                                        rows={3}
                                        value={editForm.description}
                                        onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="Optional notes about this formulation..."
                                    />
                                </div>
                                {editingFormulation?.oils?.length > 0 && (
                                    <div>
                                        <label className="form-label">Oils ({editingFormulation.oils.length})</label>
                                        <div style={{ background: 'var(--glass-bg)', borderRadius: 'var(--radius-sm)', padding: 'var(--spacing-sm)', fontSize: '0.875rem' }}>
                                            {editingFormulation.oils.map((oil, idx) => (
                                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                                                    <span>{oil.name}</span>
                                                    <span style={{ color: 'var(--text-muted)' }}>{oil.percentage}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeEditModal}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
```

### Step 3: Add route to App.jsx

After the `formula-designer` route, add:
```jsx
import Formulations from './pages/Formulations'
// ...
<Route path="formulations" element={<Formulations />} />
```

### Step 4: Add nav item to Layout.jsx

In `allNavItems`, add after the formula-designer entry:
```jsx
{ path: '/formulations', icon: Beaker, label: 'Formulations' },
```

Note: `Beaker` is already imported from lucide-react in Layout.jsx? Check — if not, add it to the import list. If Beaker isn't there, use `FlaskConical` instead (which IS already imported as a fallback).

Actually — check Layout.jsx imports. The current imports are:
```
LayoutDashboard, FlaskConical, BookOpen, Factory, Calculator, Settings,
Droplets, Truck, ShoppingCart, Users, DollarSign, Receipt, Menu, X,
BarChart3, FileSearch, Warehouse, LogOut, ShieldCheck, Lock, ShoppingBag, Box, Palette
```

`Beaker` is NOT in Layout.jsx imports. Add it: `import { ..., Beaker } from 'lucide-react'` OR just use `FlaskConical` (already imported) for the Formulations nav icon.

Use `FlaskConical` for the nav item to avoid changing the import:
```jsx
{ path: '/formulations', icon: FlaskConical, label: 'Formulations' },
```

### Step 5: Verify build

```bash
cd /home/nickj/Documents/Soapmaker_App/SoapManager/web/frontend
npm run build
```

Expected: zero errors.

### Step 6: Commit

```bash
cd /home/nickj/Documents/Soapmaker_App/SoapManager
git add web/frontend/src/pages/Formulations.jsx
git add web/frontend/src/api/client.js
git add web/frontend/src/App.jsx
git add web/frontend/src/components/Layout.jsx
git commit -m "$(cat <<'EOF'
feat: add Formulations Library page and API

New /formulations page with table view, edit/delete actions, Load to
Formula Designer, and Use as Recipe navigation. Added 5 Supabase CRUD
functions to api/client.js for the formulations table.

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Save/Load Formulas in Formula Designer

**Files:**
- Modify: `web/frontend/src/pages/FormulaDesigner.jsx`

### Step 1: Add new imports and state

At top of `FormulaDesigner.jsx`, add to the import from `../api/client`:
```jsx
import { getIngredients, calculateLye, getFormulations, createFormulation } from '../api/client';
```

Add new state variables after existing state declarations:
```jsx
const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
const [formulations, setFormulations] = useState([]);
const [saveFormData, setSaveFormData] = useState({ name: '', description: '' });
const [isSavingFormula, setIsSavingFormula] = useState(false);
```

### Step 2: Add sessionStorage load effect

After the existing `useEffect(() => { loadIngredients(); }, [])`, add a new effect to handle the "Load" navigation from Formulations page:

```jsx
useEffect(() => {
    const stored = sessionStorage.getItem('load_formulation');
    if (stored) {
        try {
            const formulation = JSON.parse(stored);
            sessionStorage.removeItem('load_formulation');
            // Map stored oil percentages to recipeOils format
            const oils = (formulation.oils || []).map(oil => ({
                ingredient_id: oil.ingredient_id,
                name: oil.name,
                percentage: oil.percentage,
                weight: (oil.percentage / 100) * settings.total_oil_weight
            }));
            setRecipeOils(oils);
        } catch (err) {
            console.error('Failed to load formulation:', err);
        }
    }
}, []);
```

### Step 3: Add loadFormulationsForPicker function

```jsx
async function loadFormulationsForPicker() {
    try {
        const data = await getFormulations();
        setFormulations(data);
    } catch (err) {
        console.error('Failed to load formulations:', err);
    }
}
```

### Step 4: Add Save and Load handler functions

```jsx
function openSaveModal() {
    setSaveFormData({ name: '', description: '' });
    setIsSaveModalOpen(true);
}

function closeSaveModal() {
    setIsSaveModalOpen(false);
}

async function handleSaveFormula(e) {
    e.preventDefault();
    if (!saveFormData.name.trim()) return;
    if (recipeOils.length === 0) {
        alert('Add at least one oil before saving a formulation.');
        return;
    }
    try {
        setIsSavingFormula(true);
        const oils = recipeOils.map(o => ({
            ingredient_id: o.ingredient_id,
            name: o.name,
            percentage: o.percentage
        }));
        await createFormulation({
            name: saveFormData.name.trim(),
            description: saveFormData.description.trim(),
            oils
        });
        closeSaveModal();
        alert(`Formulation "${saveFormData.name}" saved! View it in the Formulations Library.`);
    } catch (err) {
        console.error('Failed to save formulation:', err);
        alert('Failed to save: ' + err.message);
    } finally {
        setIsSavingFormula(false);
    }
}

async function openLoadModal() {
    await loadFormulationsForPicker();
    setIsLoadModalOpen(true);
}

function closeLoadModal() {
    setIsLoadModalOpen(false);
}

function handleLoadFormulation(formulation) {
    const oils = (formulation.oils || []).map(oil => ({
        ingredient_id: oil.ingredient_id,
        name: oil.name,
        percentage: oil.percentage,
        weight: (oil.percentage / 100) * settings.total_oil_weight
    }));
    setRecipeOils(oils);
    closeLoadModal();
}
```

### Step 5: Wire the Save button and add Load button to toolbar

Find the existing toolbar in FormulaDesigner.jsx (the `<div className="flex-responsive">` with Reset, View, Calculate buttons).

Replace the stub Save button (currently `<Download size={14} /> Save` in the results section) AND add Load button to the main toolbar:

In the main page-header toolbar, add Load button:
```jsx
<button className="btn btn-secondary" onClick={openLoadModal}>
    <BookOpen size={16} /> <span className="hide-on-mobile">Load</span>
</button>
```

In the results section (section7), replace the stub Save button:
```jsx
<button className="btn btn-secondary" style={{ padding: '0.5rem', fontSize: '0.75rem', flex: 1 }} onClick={openSaveModal}>
    <Download size={14} /> Save
</button>
```

### Step 6: Add Save and Load modals at end of return (before closing `</div>`)

Add after the existing Recipe Summary Modal:

```jsx
{/* Save Formulation Modal */}
{isSaveModalOpen && (
    <div className="modal-overlay" onClick={closeSaveModal}>
        <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
                <h2 className="modal-title">Save Formulation</h2>
                <button className="btn-icon" onClick={closeSaveModal}><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveFormula}>
                <div className="modal-body">
                    <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--spacing-md)', fontSize: '0.875rem' }}>
                        Saving {recipeOils.length} oil{recipeOils.length !== 1 ? 's' : ''} as a reusable formulation (percentages only, not weights).
                    </p>
                    <div className="form-group">
                        <label className="form-label">Formulation Name *</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. Classic Bastille, Summer Citrus Blend..."
                            value={saveFormData.name}
                            onChange={e => setSaveFormData(prev => ({ ...prev, name: e.target.value }))}
                            required
                            autoFocus
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Description (optional)</label>
                        <textarea
                            className="form-input"
                            rows={2}
                            placeholder="Notes about this formulation..."
                            value={saveFormData.description}
                            onChange={e => setSaveFormData(prev => ({ ...prev, description: e.target.value }))}
                        />
                    </div>
                </div>
                <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={closeSaveModal}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={isSavingFormula}>
                        {isSavingFormula ? 'Saving...' : 'Save Formulation'}
                    </button>
                </div>
            </form>
        </div>
    </div>
)}

{/* Load Formulation Modal */}
{isLoadModalOpen && (
    <div className="modal-overlay" onClick={closeLoadModal}>
        <div className="modal" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
                <h2 className="modal-title">Load Formulation</h2>
                <button className="btn-icon" onClick={closeLoadModal}><X size={18} /></button>
            </div>
            <div className="modal-body">
                {formulations.length === 0 ? (
                    <div className="empty-state" style={{ padding: 'var(--spacing-xl)' }}>
                        <p>No saved formulations yet. Save your current oils using the Save button.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                        {formulations.map(f => (
                            <div
                                key={f.id}
                                className="card"
                                style={{ padding: 'var(--spacing-md)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                onClick={() => handleLoadFormulation(f)}
                            >
                                <div>
                                    <div style={{ fontWeight: 600 }}>{f.name}</div>
                                    {f.description && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{f.description}</div>}
                                </div>
                                <span className="badge badge-info">{(f.oils || []).length} oils</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <div className="modal-footer">
                <button className="btn btn-secondary" onClick={closeLoadModal}>Cancel</button>
            </div>
        </div>
    </div>
)}
```

### Step 7: Verify build

```bash
cd /home/nickj/Documents/Soapmaker_App/SoapManager/web/frontend
npm run build
```

Expected: zero errors.

### Step 8: Commit

```bash
cd /home/nickj/Documents/Soapmaker_App/SoapManager
git add web/frontend/src/pages/FormulaDesigner.jsx
git commit -m "$(cat <<'EOF'
feat: add Save/Load formulas in Formula Designer

Wire Save button to persist oil ratios as named formulations in
Supabase. Add Load button with picker modal to restore saved
formulations. Handles sessionStorage-based load from Formulations page.

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Formula Templates (New Recipe from Formula)

**Files:**
- Modify: `web/frontend/src/pages/Recipes.jsx`
- Modify: `web/frontend/src/api/client.js` (verify `getFormulation` exists — added in Task 2)

### Step 1: Add imports to Recipes.jsx

Add to existing API imports:
```jsx
import { ..., getFormulation } from '../api/client';
```

Add `useSearchParams` or use `useLocation`/`useNavigate` — simpler: use `window.location.search` directly (pattern already used in Traceability.jsx).

Add to lucide imports: `Printer` (needed for Task 5 too — add now).

### Step 2: Add useEffect for ?from_formula param

In Recipes.jsx, after the existing `useEffect(() => { loadData(); }, [])`, add:

```jsx
useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const formulaId = params.get('from_formula');
    if (formulaId) {
        loadFormulaAsRecipe(formulaId);
    }
}, []);

async function loadFormulaAsRecipe(formulaId) {
    try {
        const formulation = await getFormulation(formulaId);
        // Map formulation oils to recipe ingredients format
        const mappedIngredients = (formulation.oils || []).map(oil => ({
            ingredient_id: oil.ingredient_id,
            name: oil.name,
            quantity: oil.percentage,
            unit: '%'
        }));
        setFormData(prev => ({
            ...prev,
            name: `${formulation.name} Soap`,
            description: formulation.description || '',
            ingredients: mappedIngredients
        }));
        setIsModalOpen(true);
    } catch (err) {
        console.error('Failed to load formula as recipe template:', err);
    }
}
```

### Step 3: Verify build

```bash
cd /home/nickj/Documents/Soapmaker_App/SoapManager/web/frontend
npm run build
```

Expected: zero errors.

### Step 4: Commit

```bash
cd /home/nickj/Documents/Soapmaker_App/SoapManager
git add web/frontend/src/pages/Recipes.jsx
git commit -m "$(cat <<'EOF'
feat: formula templates — prefill recipe modal from saved formulation

Reading ?from_formula=<id> on /recipes navigates opens recipe create
modal with oils and name pre-populated from the chosen formulation.

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Print Recipe from Recipe Cards

**Files:**
- Modify: `web/frontend/src/pages/Recipes.jsx`
- Modify: `web/frontend/src/pages/PrintRecipe.jsx`

### Step 1: Read Recipes.jsx to find the expanded recipe card section

The recipe detail card (expanded view) is somewhere in Recipes.jsx — search for `isExpanded` or the recipe detail section. Find where the recipe body renders ingredients, notes, etc.

### Step 2: Add print handler to Recipes.jsx

Add this function (place near other handler functions):

```jsx
function handlePrintRecipe(recipe) {
    const printData = {
        recipe: {
            name: recipe.name,
            description: recipe.description,
            lye_type: recipe.lye_type,
            superfat_percentage: recipe.superfat_percentage,
            water_percentage: recipe.water_percentage,
            total_oils_weight: recipe.total_oils_weight,
            unit: recipe.unit || 'g',
            notes: recipe.notes,
            ingredients: (recipe.ingredients || []).map(ri => ({
                name: ri.ingredient?.name || ri.name || `Ingredient ${ri.ingredient_id}`,
                quantity: ri.quantity,
                unit: ri.unit
            }))
        }
    };
    sessionStorage.setItem('print_recipe_data', JSON.stringify(printData));
    window.open('/formula-designer/print', '_blank', 'width=1000,height=800');
}
```

### Step 3: Add Print button to the expanded recipe card

Find the recipe action buttons area in the expanded recipe detail (look for existing "Make Batch", "Edit", "Delete" buttons in the expanded section). Add alongside them:

```jsx
<button
    className="btn btn-secondary"
    onClick={() => handlePrintRecipe(recipe)}
    title="Print recipe"
>
    <Printer size={16} /> Print
</button>
```

Make sure `Printer` is imported from lucide-react (added in Task 4 Step 1).

### Step 4: Update PrintRecipe.jsx to handle dual modes

Replace the destructuring on line 23:
```jsx
// OLD:
const { results, recipeOils, settings } = recipeData;
```

With a conditional branch. Also update the render to support recipe-mode. Full replacement of the component's render logic after the `recipeData` null check:

```jsx
const isRecipeMode = !!recipeData.recipe;
```

Then wrap the existing Calculator-mode render in a conditional, and add a Recipe-mode render:

For recipe mode, render:
```jsx
if (isRecipeMode) {
    const { recipe } = recipeData;
    return (
        <div className="print-view" style={{ background: 'white', color: '#333', minHeight: '100vh', padding: '40px', fontFamily: "'Inter', sans-serif" }}>
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px', borderBottom: '1px solid #eee', paddingBottom: '20px' }}>
                <button className="btn btn-secondary" onClick={() => window.close()}>
                    <ChevronLeft size={16} /> Back
                </button>
                <button className="btn btn-primary" onClick={() => window.print()}>
                    <Printer size={16} /> Print Recipe
                </button>
            </div>

            <div style={{ maxWidth: '900px', margin: '0 auto', border: '1px solid #000', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #000', paddingBottom: '10px' }}>
                    <h1 style={{ margin: 0, fontSize: '24px' }}>{recipe.name}</h1>
                    <span style={{ fontSize: '14px' }}>{new Date().toLocaleDateString()}</span>
                </div>

                {recipe.description && (
                    <p style={{ marginBottom: '20px', color: '#555', fontSize: '14px' }}>{recipe.description}</p>
                )}

                {/* Settings */}
                <table style={{ width: '50%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '20px' }}>
                    <tbody>
                        <tr style={{ background: '#f8f8f8' }}>
                            <td style={{ padding: '4px', border: '1px solid #ddd', fontWeight: 700 }}>Lye Type</td>
                            <td style={{ padding: '4px', border: '1px solid #ddd', textAlign: 'right' }}>{recipe.lye_type}</td>
                        </tr>
                        <tr>
                            <td style={{ padding: '4px', border: '1px solid #ddd', fontWeight: 700 }}>Superfat</td>
                            <td style={{ padding: '4px', border: '1px solid #ddd', textAlign: 'right' }}>{recipe.superfat_percentage}%</td>
                        </tr>
                        <tr style={{ background: '#f8f8f8' }}>
                            <td style={{ padding: '4px', border: '1px solid #ddd', fontWeight: 700 }}>Water</td>
                            <td style={{ padding: '4px', border: '1px solid #ddd', textAlign: 'right' }}>{recipe.water_percentage}%</td>
                        </tr>
                        <tr>
                            <td style={{ padding: '4px', border: '1px solid #ddd', fontWeight: 700 }}>Total Oils</td>
                            <td style={{ padding: '4px', border: '1px solid #ddd', textAlign: 'right' }}>{recipe.total_oils_weight} {recipe.unit}</td>
                        </tr>
                    </tbody>
                </table>

                {/* Ingredients */}
                <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>Ingredients</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
                    <thead>
                        <tr style={{ background: '#334155', color: 'white' }}>
                            <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #333' }}>#</th>
                            <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #333' }}>Ingredient</th>
                            <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #333' }}>Quantity</th>
                            <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #333' }}>Unit</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recipe.ingredients.map((ing, idx) => (
                            <tr key={idx} style={{ background: idx % 2 === 0 ? '#f8f8f8' : 'white' }}>
                                <td style={{ padding: '6px', border: '1px solid #ddd' }}>{idx + 1}</td>
                                <td style={{ padding: '6px', border: '1px solid #ddd', fontWeight: 600 }}>{ing.name}</td>
                                <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'center' }}>{ing.quantity}</td>
                                <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'center' }}>{ing.unit}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {recipe.notes && (
                    <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                        <h3 style={{ fontSize: '14px', marginBottom: '8px', color: '#475569' }}>Notes</h3>
                        <p style={{ fontSize: '13px', color: '#555', margin: 0 }}>{recipe.notes}</p>
                    </div>
                )}

                <div style={{ marginTop: '40px', fontSize: '12px', color: '#666', fontStyle: 'italic', textAlign: 'center' }}>
                    Generated by SoapBuddy — Professional Soap Management Solution
                </div>
            </div>

            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; padding: 0 !important; }
                    .print-view { padding: 0 !important; }
                }
            `}</style>
        </div>
    );
}
```

The existing Calculator-mode render runs when `!isRecipeMode` (leave unchanged after the recipe-mode early return).

### Step 5: Verify build

```bash
cd /home/nickj/Documents/Soapmaker_App/SoapManager/web/frontend
npm run build
```

Expected: zero errors.

### Step 6: Commit

```bash
cd /home/nickj/Documents/Soapmaker_App/SoapManager
git add web/frontend/src/pages/Recipes.jsx
git add web/frontend/src/pages/PrintRecipe.jsx
git commit -m "$(cat <<'EOF'
feat: print recipe cards from Recipes page

Added Print button to expanded recipe cards. PrintRecipe.jsx now
handles dual mode: recipe-mode (from Recipes page) and calculator-mode
(from Formula Designer). Both use sessionStorage print_recipe_data key.

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Final Verification + Wrap-up

### Step 1: Full build

```bash
cd /home/nickj/Documents/Soapmaker_App/SoapManager/web/frontend
npm run build
```

Expected: zero errors, all chunks < 600kB.

### Step 2: Push to remote

```bash
cd /home/nickj/Documents/Soapmaker_App/SoapManager
git push origin main
```

### Step 3: Supabase migration note

Run this SQL manually in the Supabase SQL editor (ezkqfuxzcbtywtfubmon):

```sql
CREATE TABLE IF NOT EXISTS formulations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  oils jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE formulations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own formulations" ON formulations
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

### Step 4: Update HANDOFF.md

Mark Sprint 9 complete with all 5 items, update Current Head, add Sprint 10 roadmap placeholder.

### Step 5: Update EXECUTION_JOURNAL.md

Add Sprint 9 summary entry.

### Step 6: Commit docs

```bash
cd /home/nickj/Documents/Soapmaker_App/SoapManager
git add HANDOFF.md EXECUTION_JOURNAL.md
git commit -m "$(cat <<'EOF'
docs: update HANDOFF.md — Sprint 9 complete

Sprint 9 (Formula Intelligence & UX Polish) complete: Calculator
rebranded to Formula Designer, Formulations Library with CRUD, Save/Load
formulas, Formula Templates for recipe creation, Print Recipe cards.

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>
EOF
)"
```

### Step 7: Push final docs

```bash
git push origin main
```

---

## Quick Reference

| Task | Files Touched | Commit |
|------|--------------|--------|
| 1. Rebrand | FormulaDesigner.jsx, App.jsx, Layout.jsx | feat: rebrand Calculator to Formula Designer |
| 2. Formulations page | Formulations.jsx (new), client.js, App.jsx, Layout.jsx | feat: add Formulations Library page and API |
| 3. Save/Load | FormulaDesigner.jsx | feat: add Save/Load formulas in Formula Designer |
| 4. Formula Templates | Recipes.jsx | feat: formula templates — prefill recipe modal |
| 5. Print Recipe | Recipes.jsx, PrintRecipe.jsx | feat: print recipe cards from Recipes page |
| Wrap-up | HANDOFF.md, EXECUTION_JOURNAL.md | docs: update HANDOFF.md — Sprint 9 complete |
