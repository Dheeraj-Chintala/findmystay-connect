
-- Media verification request status enum
CREATE TYPE public.media_verification_status AS ENUM ('pending', 'scheduled', 'under_review', 'platform_verified', 'owner_verified', 'ai_check', 'admin_review', 'rejected');

-- Media verification type enum
CREATE TYPE public.media_verification_type AS ENUM ('pr_team', 'self_capture');

-- Media verification requests table
CREATE TABLE public.media_verification_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hostel_id UUID NOT NULL REFERENCES public.hostels(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL,
  verification_type public.media_verification_type NOT NULL,
  status public.media_verification_status NOT NULL DEFAULT 'pending',
  requested_date DATE,
  assigned_pr_member TEXT,
  areas_to_capture TEXT[] DEFAULT '{}',
  admin_notes TEXT,
  risk_score NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Verification media table for storing individual media items
CREATE TABLE public.verification_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.media_verification_requests(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'image',
  capture_step TEXT,
  capture_timestamp TIMESTAMPTZ DEFAULT now(),
  gps_latitude DOUBLE PRECISION,
  gps_longitude DOUBLE PRECISION,
  uploader_id UUID NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.media_verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_media ENABLE ROW LEVEL SECURITY;

-- RLS for media_verification_requests
CREATE POLICY "Owners can view own requests" ON public.media_verification_requests
  FOR SELECT USING (auth.uid() = owner_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners can create requests" ON public.media_verification_requests
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Admins can update requests" ON public.media_verification_requests
  FOR UPDATE USING (has_role(auth.uid(), 'admin') OR auth.uid() = owner_id);

-- RLS for verification_media
CREATE POLICY "Owners and admins can view media" ON public.verification_media
  FOR SELECT USING (
    auth.uid() = uploader_id 
    OR has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.media_verification_requests r WHERE r.id = request_id AND r.owner_id = auth.uid())
  );

CREATE POLICY "Users can upload media" ON public.verification_media
  FOR INSERT WITH CHECK (auth.uid() = uploader_id);

CREATE POLICY "Admins can update media" ON public.verification_media
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- Add media_verification_badge column to hostels
ALTER TABLE public.hostels ADD COLUMN IF NOT EXISTS media_verification_badge TEXT DEFAULT NULL;

-- Updated at trigger
CREATE TRIGGER update_media_verification_requests_updated_at
  BEFORE UPDATE ON public.media_verification_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Storage bucket for verification media
INSERT INTO storage.buckets (id, name, public) VALUES ('verification-media', 'verification-media', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for verification-media bucket
CREATE POLICY "Owners can upload verification media" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'verification-media' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view verification media" ON storage.objects
  FOR SELECT USING (bucket_id = 'verification-media' AND auth.role() = 'authenticated');
