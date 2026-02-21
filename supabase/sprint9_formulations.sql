-- Sprint 9: Formula Intelligence - Formulations Library
-- Created: 2026-02-21
-- Purpose: Create formulations table for saving and managing soap formulas

-- Create formulations table
CREATE TABLE IF NOT EXISTS formulations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  oils jsonb NOT NULL DEFAULT '[]',  -- Array of {ingredient_id, name, percentage}
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE formulations ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: Users can only manage their own formulations
CREATE POLICY "Users manage own formulations" ON formulations
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add helpful comment
COMMENT ON TABLE formulations IS 'Stores saved soap formulations from the Formula Designer';
COMMENT ON COLUMN formulations.oils IS 'JSONB array of oil objects: [{ingredient_id: uuid, name: string, percentage: number}]';
