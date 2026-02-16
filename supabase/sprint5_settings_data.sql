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
