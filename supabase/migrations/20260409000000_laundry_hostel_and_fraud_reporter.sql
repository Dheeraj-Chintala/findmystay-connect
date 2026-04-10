-- Add hostel_id to laundry_services so owners can define per-hostel services
ALTER TABLE public.laundry_services
  ADD COLUMN IF NOT EXISTS hostel_id uuid REFERENCES public.hostels(id) ON DELETE CASCADE;

-- Add reported_by to fraud_alerts so user submissions can be attributed
ALTER TABLE public.fraud_alerts
  ADD COLUMN IF NOT EXISTS reported_by uuid;
