
-- Create hostel_videos table
CREATE TABLE public.hostel_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hostel_id uuid NOT NULL REFERENCES public.hostels(id) ON DELETE CASCADE,
  video_url text NOT NULL,
  uploaded_by text NOT NULL DEFAULT 'owner' CHECK (uploaded_by IN ('owner', 'admin_pr_team')),
  display_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.hostel_videos ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view hostel videos" ON public.hostel_videos FOR SELECT TO public USING (true);
CREATE POLICY "Owners can insert hostel videos" ON public.hostel_videos FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM hostels WHERE hostels.id = hostel_videos.hostel_id AND hostels.owner_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);
CREATE POLICY "Owners can delete hostel videos" ON public.hostel_videos FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM hostels WHERE hostels.id = hostel_videos.hostel_id AND hostels.owner_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Add uploaded_by column to hostel_images for verified media badge
ALTER TABLE public.hostel_images ADD COLUMN IF NOT EXISTS uploaded_by text NOT NULL DEFAULT 'owner' CHECK (uploaded_by IN ('owner', 'admin_pr_team'));

-- Create storage bucket for hostel videos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('hostel-videos', 'hostel-videos', true, 104857600, ARRAY['video/mp4', 'video/quicktime']);

-- Storage RLS for hostel-videos bucket
CREATE POLICY "Anyone can view hostel videos storage" ON storage.objects FOR SELECT TO public USING (bucket_id = 'hostel-videos');
CREATE POLICY "Authenticated users can upload hostel videos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'hostel-videos');
CREATE POLICY "Authenticated users can delete own hostel videos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'hostel-videos');
