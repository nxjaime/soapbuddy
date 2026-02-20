# Sprint 9 Design: Formula Intelligence & UX Polish

**Date:** 2026-02-19
**Sprint:** 9
**Status:** Approved
**Model:** Claude Haiku 4.5

---

## Overview

Sprint 9 elevates the Calculator into a professional "Formula Designer" — adding persistent storage for oil formulations, seamless recipe creation from saved formulas, and a print-quality recipe view. This sprint is purely frontend (no new migrations needed beyond one Supabase table).

---

## Item 1: Calculator → Formula Designer Rebrand

### Problem
The "Calculator" label undersells the tool's sophistication. It's a professional soap formulation studio.

### Solution
Full rebrand + route rename with backward compat redirect.

**File changes:**
- Rename `Calculator.jsx` → `FormulaDesigner.jsx`; update export name to `FormulaDesigner`
- `App.jsx`: Add new route `formula-designer` (and nested `formula-designer/print`); add redirect from `calculator` → `formula-designer` using React Router `<Navigate>`; import `FormulaDesigner` instead of `Calculator`
- `Layout.jsx`: Update nav item path `/calculator` → `/formula-designer`, label `Calculator` → `Formula Designer`, icon stays `Calculator` (or swap to `Beaker`)
- `FormulaDesigner.jsx`: Update page title from "Professional Soap Calculator" → "Formula Designer"
- `PrintRecipe.jsx`: Update `sessionStorage` key reference if needed (check current key name)

**Redirect strategy:** Add `<Route path="calculator" element={<Navigate to="/formula-designer" replace />} />` inside the protected layout in App.jsx so any bookmarks/old links redirect automatically.

### Success Criteria
- `/calculator` → redirects to `/formula-designer` (no 404)
- Sidebar shows "Formula Designer"
- Page title shows "Formula Designer"
- `/formula-designer/print` works for print view

---

## Item 2: Formulations Library Page

### Problem
Users build great oil ratios but can't save them. Each session starts from scratch.

### Solution
New `/formulations` page with CRUD table. Formulations are named oil ratio sets (not full recipes — no lye settings, just oil percentages).

**Supabase table (no migration file needed — run in SQL editor):**
```sql
CREATE TABLE formulations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  oils jsonb NOT NULL DEFAULT '[]', -- [{ingredient_id, name, percentage}]
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE formulations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own formulations" ON formulations
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

**New file:** `web/frontend/src/pages/Formulations.jsx`
- Page header: "Formulations Library" with Beaker icon
- Table: Name, # oils, description, Created date, Actions (Load → Formula Designer, Edit, Delete)
- Empty state with CTA to go to Formula Designer
- CRUD modal: Name (required), Description (optional), oil list display (read-only in edit — oils come from Formula Designer)
- No standalone oil editor in this page — oils are always saved FROM Formula Designer

**API additions to `api/client.js`:**
```js
getFormulations()           // SELECT * FROM formulations ORDER BY created_at DESC
createFormulation(data)     // INSERT with user_id from auth
updateFormulation(id, data) // UPDATE name/description
deleteFormulation(id)       // DELETE
```

**App.jsx:** Add route `formulations` → `<Formulations />`
**Layout.jsx:** Add nav item `{ path: '/formulations', icon: Beaker, label: 'Formulations' }` after Calculator/FormulaDesigner

### Success Criteria
- `/formulations` page renders with empty state
- Can create/rename/delete formulations
- Table shows correct oil count from JSONB array

---

## Item 3: Save/Load Formulas in Formula Designer

### Problem
Formula Designer has a stub "Save" button that does nothing.

### Solution
Wire the existing Save button to persist current oil list. Add a Load button to populate oils from a saved formulation.

**Save flow (in `FormulaDesigner.jsx`):**
1. User clicks "Save" → modal opens: Name input (pre-filled if loaded from formulation) + optional description
2. On submit: calls `createFormulation({ name, description, oils: recipeOils.map(...) })`
3. Success toast/alert; modal closes

**Load flow:**
1. Add "Load Formula" button to toolbar (BookOpen icon)
2. Opens modal: list of saved formulations (name, # oils, description)
3. User clicks one → `setRecipeOils(formulation.oils)` + updates total weight if needed
4. Modal closes; oils now populated in designer

**State additions:**
```js
const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
const [formulations, setFormulations] = useState([]);
const [saveFormData, setSaveFormData] = useState({ name: '', description: '' });
```

**Oil format for storage:**
```json
[{ "ingredient_id": "uuid", "name": "Olive Oil", "percentage": 60 }]
```
Note: weights are NOT stored — they depend on `total_oil_weight` setting. Only percentages are canonical.

### Success Criteria
- Save creates a record in Supabase and appears in Formulations page
- Load populates oils correctly from stored percentages
- Weights recalculate from current total_oil_weight setting after load

---

## Item 4: Formula Templates (New Recipe from Formula)

### Problem
There's no bridge from a tested formulation to an actual recipe. Users have to manually re-enter the same oils twice.

### Solution
"New Recipe from Formula" button in Formulations page (and as secondary CTA in the Load modal).

**Flow:**
1. In Formulations page, each row gets a "Use as Recipe" button (FileText icon)
2. Clicking it navigates to `/recipes` with a query param: `/recipes?from_formula=<formulation_id>`
3. Recipes.jsx reads `?from_formula` on mount → fetches that formulation → pre-populates the new recipe modal with oil ingredients matching names from the formulation
4. User fills in recipe name, lye type, superfat, etc. → saves normally

**Implementation detail:**
- In Recipes.jsx, add `useEffect` that reads `?from_formula` URLSearchParam
- Fetch formulation by ID, map `oils` array to `formData.ingredients` format:
  ```js
  { ingredient_id, name, quantity: percentage, unit: '%' }
  ```
- Open the recipe create modal pre-populated

**API addition:**
```js
getFormulation(id) // SELECT single formulation by id
```

### Success Criteria
- Clicking "Use as Recipe" in Formulations opens recipe modal with oils pre-filled
- Recipe saves normally with pre-filled ingredients

---

## Item 5: Print Recipe

### Problem
Recipe detail cards in Recipes.jsx have no print capability. The Calculator's print uses `sessionStorage` + a separate `/calculator/print` route, but recipes live in Recipes.jsx and have different data.

### Solution
Print button on each recipe detail card. Opens the existing `PrintRecipe.jsx` pattern but with recipe data.

**Flow:**
1. Add `Printer` icon button to recipe detail card (expanded view) in Recipes.jsx
2. On click: serialize the recipe to `sessionStorage` under key `print_recipe_data` (reuse existing PrintRecipe page format or extend it)
3. `window.open('/formula-designer/print', '_blank')` — reuses the existing PrintRecipe page

**PrintRecipe.jsx adaptation:**
- Already reads `sessionStorage.getItem('print_recipe_data')`
- Currently renders `results`, `recipeOils`, `settings` (Calculator-specific)
- Extend to also handle `recipe` key in the object for recipe-mode rendering
- If `recipe` key present: render recipe name, ingredients table, lye/water/superfat settings, notes
- If `results` key present: render calculator output (existing behavior)

**Data structure for recipe print:**
```js
sessionStorage.setItem('print_recipe_data', JSON.stringify({
  recipe: {
    name, description, lye_type, superfat_percentage, water_percentage,
    total_oils_weight, unit, notes, ingredients: [{ name, quantity, unit }]
  }
}))
```

### Success Criteria
- Print button visible on expanded recipe card
- Clicking it opens print view in new tab with recipe data
- Browser print dialog works cleanly (no sidebars, no nav)

---

## Architecture Notes

**No new migrations** beyond the `formulations` table (SQL provided in Item 2 above — to be run manually in Supabase SQL editor after the sprint).

**Route summary after Sprint 9:**
```
/formula-designer       → FormulaDesigner.jsx (was /calculator)
/formula-designer/print → PrintRecipe.jsx (was /calculator/print)
/calculator             → <Navigate to="/formula-designer" replace />
/formulations           → Formulations.jsx (new)
```

**Sidebar additions:**
- `Calculator` → `Formula Designer` (renamed entry)
- New: `Formulations` entry after Formula Designer

**API additions (all in client.js):**
- `getFormulations()`
- `createFormulation(data)`
- `updateFormulation(id, data)`
- `deleteFormulation(id)`
- `getFormulation(id)`

---

## Implementation Order

1. Rebrand Calculator → FormulaDesigner (safe, no deps)
2. Formulations Library page + API (new standalone feature)
3. Save/Load in FormulaDesigner (depends on Item 2 API)
4. Formula Templates in Recipes (depends on Items 2+3)
5. Print Recipe (depends on Item 1 for route)

---

## Testing Checklist

- [ ] `/calculator` → redirects to `/formula-designer`
- [ ] Sidebar shows "Formula Designer" + new "Formulations" item
- [ ] Save Formulation creates row in Supabase
- [ ] Load Formulation populates oil list in Formula Designer
- [ ] Formulations page shows table with correct oil count
- [ ] "Use as Recipe" opens recipe modal with pre-filled ingredients
- [ ] Print button on recipe detail opens print view with recipe data
- [ ] `npm run build` passes with zero errors
