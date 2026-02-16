-- ============================================================
-- Migration: Sprint 1 — Inventory Intelligence
-- Description: Adds per-ingredient reorder threshold and
--              expiry date tracking to the ingredients table.
-- ============================================================

ALTER TABLE ingredients
    ADD COLUMN IF NOT EXISTS reorder_threshold NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS expiry_date DATE;

-- Index for quick low-stock queries (WHERE quantity_on_hand <= reorder_threshold)
CREATE INDEX IF NOT EXISTS idx_ingredients_low_stock
    ON ingredients (user_id, quantity_on_hand, reorder_threshold)
    WHERE reorder_threshold > 0;

-- Index for expiry queries
CREATE INDEX IF NOT EXISTS idx_ingredients_expiry
    ON ingredients (user_id, expiry_date)
    WHERE expiry_date IS NOT NULL;
