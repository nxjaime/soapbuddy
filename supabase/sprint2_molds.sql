-- Sprint 2: Molds Table
-- Run in Supabase SQL editor

CREATE TABLE IF NOT EXISTS molds (
    id            BIGSERIAL PRIMARY KEY,
    user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name          TEXT NOT NULL,
    type          TEXT NOT NULL DEFAULT 'Loaf',   -- Loaf, Individual, Cylinder, Slab, Other
    volume_ml     NUMERIC DEFAULT 0,
    length_cm     NUMERIC,
    width_cm      NUMERIC,
    height_cm     NUMERIC,
    notes         TEXT,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE molds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own molds"
    ON molds
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
