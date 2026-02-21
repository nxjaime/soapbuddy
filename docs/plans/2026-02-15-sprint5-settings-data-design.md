# Sprint 5: Settings & Data — Design Document

**Goal:** Persist user preferences to Supabase, expand business profile for future features, and add basic data management (export/import) capabilities.

## 1. Schema Updates

We will use a `settings` JSONB column in the `profiles` table to store all user preferences flexibly.

**Table: `profiles`**
- Add column: `settings` (JSONB, default `{}`)
- Add column: `business_address` (text, nullable)
- Add column: `business_logo_url` (text, nullable)
- Add column: `tax_id` (text, nullable)
- Add column: `website` (text, nullable)

**Default Settings Structure (JSON):**
```json
{
  "theme": "light",
  "currency": "USD",
  "weightUnit": "g",
  "notifications": {
    "enabled": false,
    "email": false,
    "lowStock": true
  },
  "inventory": {
    "lowStockThreshold": 1000
  },
  "sidebar": {
    "hidden": []
  }
}
```

**Migration:**
- Create migration file to add columns.
- Update `handle_new_user` trigger function to initialize `settings` with defaults.

## 2. UI Refactor: Settings.jsx

Refactor `web/frontend/src/pages/Settings.jsx` to load and save data from/to Supabase via `SettingsContext` and `api/client.js`.

**Tabs:**
1.  **General**:
    - **Business Profile**: Name, Email, *Address, Website, Tax ID* (New fields).
    - **Preferences**: Theme, Currency, Unit System.
    - **Inventory**: Low Stock Threshold.
    - **Notifications**: Toggles for Email, In-App.
    - **Sidebar**: Toggle visibility of modules.
2.  **Subscription**: Existing plan management.
3.  **Data Management** (New Tab):
    - **Export**: "Export All Data" button -> Downloads `soapbuddy_data_<date>.json` containing Ingredients, Recipes, Customers, Sales, Production.
    - **Import**:
        - "Import Ingredients" (CSV)
        - "Import Customers" (CSV)
        - Validation: Check for required fields, skip duplicates by name/email.
    - **Danger Zone**: "Delete Account" button (optional for now, maybe just "Reset Data").

## 3. Data Logic (Client-Side)

**SettingsContext.jsx:**
- Update to fetch `profile` on mount.
- Provide `settings` object (merged from `profile.settings` and defaults).
- Provide `updateSettings(newSettings)` function which calls `supabase.from('profiles').update({ settings: ... })`.
- Provide `updateProfile(data)` function for Business Info fields.

**Import/Export Logic:**
- **Export**: Fetch all tables in parallel, construct JSON object, trigger download.
- **Import (CSV)**: Parse CSV (using a library like `papaparse` or simple split), validate rows, call `bulkInsertIngredients` / `bulkInsertCustomers` (new API functions).

## 4. Security & Validation

- **RLS**: Ensure users can only update their own profile.
- **Input Validation**: Sanitize inputs (especially CSVs) to prevent injection/corruption.
- **Tier Limits**: Respect plan limits during import (e.g., Free tier ingredient count).

## 5. Deliverables

1.  **DB Migration**: `supabase/sprint5_settings_data.sql`
2.  **API Client Updates**: `updateProfile`, `bulkInsertIngredients`, `bulkInsertCustomers`.
3.  **Context Update**: `SettingsContext.jsx`.
4.  **UI Updates**: `Settings.jsx` (Refactored with new tabs and fields).
5.  **Tests**: Manual verification of save/load and import/export flows.

---
**Status:** Approved
**Date:** 2026-02-15
