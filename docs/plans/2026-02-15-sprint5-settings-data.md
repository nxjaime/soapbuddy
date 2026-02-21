# Sprint 5: Settings & Data — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Persist user settings to Supabase, expand business profile, and enable data export/import.

**Architecture:** `profiles` table gets a `settings` JSONB column. `SettingsContext` manages state sync. `Settings.jsx` connects to real data. Import/Export handled client-side with bulk insert RPCs.

**Tech Stack:** React, Supabase, Lucide Icons.

---

## Task 1: DB Schema & Migration

**Files:**
- Create: `supabase/sprint5_settings_data.sql`

**Step 1: Write migration SQL**

Create `supabase/sprint5_settings_data.sql` with:
```sql
-- Add settings and business profile columns to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS business_address TEXT,
ADD COLUMN IF NOT EXISTS business_logo_url TEXT,
ADD COLUMN IF NOT EXISTS tax_id TEXT,
ADD COLUMN IF NOT EXISTS website TEXT;

-- Update handle_new_user to seed default settings
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.profiles (id, business_name, settings)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'business_name', 'My Soap Business'),
    jsonb_build_object(
      'theme', 'light',
      'currency', 'USD',
      'weightUnit', 'g',
      'notifications', jsonb_build_object('enabled', false, 'email', false, 'lowStock', true),
      'inventory', jsonb_build_object('lowStockThreshold', 1000),
      'sidebar', jsonb_build_object('hidden', jsonb_build_array())
    )
  );
  RETURN new;
END;
$function$;
```

**Step 2: Apply migration manually**

Run the SQL in your Supabase dashboard SQL editor.

**Step 3: Commit**

```bash
git add supabase/sprint5_settings_data.sql
git commit -m "feat(db): add settings and business profile columns to profiles"
```

---

## Task 2: API Client & Settings Context

**Files:**
- Modify: `web/frontend/src/api/client.js`
- Modify: `web/frontend/src/contexts/SettingsContext.jsx`

**Step 1: Add updateProfile to client.js**

Add to `api/client.js`:
```javascript
export async function updateProfile(updates) {
    const user = await getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
    
    if (error) throw error;
    return data;
}
```
Export it.

**Step 2: Update SettingsContext.jsx to load/save from DB**

Refactor `SettingsContext.jsx`:
- Remove `useEffect` that loads from localStorage (or keep as fallback).
- Add `useEffect` to fetch profile on mount:
  ```javascript
  useEffect(() => {
      async function loadProfile() {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
              const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
              if (data) {
                  setProfile(data); // Store full profile
                  setSettings(data.settings || {}); // Initialize settings state
              }
          }
      }
      loadProfile();
  }, []);
  ```
- Update `updateSettings` to call `updateProfile({ settings: newSettings })`.
- Expose `updateProfile` in context value for business info updates.

**Step 3: Build to verify**
```bash
cd web/frontend && npm run build
```

**Step 4: Commit**
```bash
git add web/frontend/src/api/client.js web/frontend/src/contexts/SettingsContext.jsx
git commit -m "feat(api): connect SettingsContext to Supabase profiles"
```

---

## Task 3: Settings UI - General Tab

**Files:**
- Modify: `web/frontend/src/pages/Settings.jsx`

**Step 1: Connect Business Info to real data**

Update `Settings.jsx` General Tab:
- Use `profile` from context for initial values (Business Name, Email, Address, Website, Tax ID).
- Add input fields for Address, Website, Tax ID.
- `handleSave` should call `updateProfile({ ...businessFields, settings: localSettings })`.

**Step 2: Connect Preferences/Inventory/Notifications**

Ensure these inputs map to `localSettings` (which mirrors `settings` JSON structure).
- Theme, Currency, Unit System, Low Stock, Notifications.

**Step 3: Build to verify**
```bash
cd web/frontend && npm run build
```

**Step 4: Commit**
```bash
git add web/frontend/src/pages/Settings.jsx
git commit -m "feat(ui): bind General Settings tab to Supabase data"
```

---

## Task 4: Sidebar Visibility Logic

**Files:**
- Modify: `web/frontend/src/contexts/SettingsContext.jsx`
- Modify: `web/frontend/src/components/Layout.jsx`

**Step 1: Update isTabVisible logic**

In `SettingsContext.jsx`:
- Ensure `isTabVisible(path)` checks `settings.sidebar?.hidden?.includes(path)`.
- Ensure `toggleTab(path)` updates `settings.sidebar.hidden` array and calls `updateSettings`.

**Step 2: Verify Layout.jsx**

Check `Layout.jsx` uses `isTabVisible` from context (it already does). No changes needed if context logic is correct.

**Step 3: Build to verify**
```bash
cd web/frontend && npm run build
```

**Step 4: Commit**
```bash
git add web/frontend/src/contexts/SettingsContext.jsx
git commit -m "feat(ui): persist sidebar visibility settings"
```

---

## Task 5: Data Export

**Files:**
- Modify: `web/frontend/src/pages/Settings.jsx`
- Modify: `web/frontend/src/api/client.js`

**Step 1: Add getAllData to client.js**

Add `getAllData()`:
```javascript
export async function getAllData() {
    const [ingredients, recipes, customers, sales, batches] = await Promise.all([
        getIngredients(),
        getRecipes(),
        getCustomers(),
        getSalesOrders(),
        getBatches()
    ]);
    return { ingredients, recipes, customers, sales, batches, exportedAt: new Date().toISOString() };
}
```

**Step 2: Add Data Tab to Settings.jsx**

Add "Data Management" tab.
Add "Export All Data" button.
OnClick handler:
```javascript
const data = await getAllData();
const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `soapbuddy_export_${new Date().toISOString().split('T')[0]}.json`;
a.click();
```

**Step 3: Build to verify**
```bash
cd web/frontend && npm run build
```

**Step 4: Commit**
```bash
git add web/frontend/src/pages/Settings.jsx web/frontend/src/api/client.js
git commit -m "feat(data): add data export functionality"
```

---

## Task 6: Data Import (Simple CSV)

**Files:**
- Modify: `web/frontend/src/pages/Settings.jsx`
- Modify: `web/frontend/src/api/client.js`

**Step 1: Add bulk insert functions to client.js**

Add `bulkInsertIngredients(items)` and `bulkInsertCustomers(items)`.
- Ensure they loop and call `createIngredient`/`createCustomer` or use `insert` with array.

**Step 2: Add Import UI to Data Tab**

Add file inputs for "Import Ingredients (CSV)" and "Import Customers (CSV)".
Add parsing logic (simple CSV split by newline and comma):
- Ingredients CSV format: `Name, Cost, Stock`
- Customers CSV format: `Name, Email, Phone`

**Step 3: Build to verify**
```bash
cd web/frontend && npm run build
```

**Step 4: Commit**
```bash
git add web/frontend/src/pages/Settings.jsx web/frontend/src/api/client.js
git commit -m "feat(data): add basic CSV import for ingredients and customers"
```

---

## Task 7: Sprint Wrap-up

**Files:**
- Modify: `HANDOFF.md`
- Modify: `EXECUTION_JOURNAL.md`

**Step 1: Update HANDOFF.md**

Update `HANDOFF.md` to reflect the completion of Sprint 5 and readiness for Sprint 6 (whatever that may be).

**Step 2: Update EXECUTION_JOURNAL.md**

Append Sprint 5 summary to `EXECUTION_JOURNAL.md`.

**Step 3: Update NotebookLM (Manual)**

Add a note to `HANDOFF.md` instructing the user to update the NotebookLM notebook with the `sprint5-settings-data-design.md` and `EXECUTION_JOURNAL.md` files.

**Step 4: Commit**
```bash
git add HANDOFF.md EXECUTION_JOURNAL.md
git commit -m "chore: sprint 5 wrap-up"
```

