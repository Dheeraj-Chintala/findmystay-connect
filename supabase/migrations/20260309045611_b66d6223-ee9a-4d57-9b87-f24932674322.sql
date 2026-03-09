
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS occupation text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_location text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS budget_min integer;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS budget_max integer;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hostel_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS property_location text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_complete boolean DEFAULT false;
