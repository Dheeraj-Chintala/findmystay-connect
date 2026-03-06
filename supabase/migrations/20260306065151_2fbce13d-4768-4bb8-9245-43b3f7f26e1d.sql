
-- ============================================
-- FindMyStay Database Schema
-- ============================================

-- 1. ROLE ENUM & USER ROLES TABLE
CREATE TYPE public.app_role AS ENUM ('admin', 'owner', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Users can read their own roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can manage all roles
CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 2. PROFILES TABLE
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. HOSTELS TABLE
CREATE TYPE public.verification_status AS ENUM ('pending', 'under_review', 'verified', 'rejected');

CREATE TABLE public.hostels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hostel_name TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  city TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  price_min INTEGER NOT NULL DEFAULT 0,
  price_max INTEGER NOT NULL DEFAULT 0,
  gender TEXT NOT NULL DEFAULT 'co-ed' CHECK (gender IN ('male', 'female', 'co-ed')),
  property_type TEXT NOT NULL DEFAULT 'hostel' CHECK (property_type IN ('hostel', 'pg', 'co-living')),
  verified_status verification_status NOT NULL DEFAULT 'pending',
  rating NUMERIC(2,1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.hostels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view verified active hostels"
  ON public.hostels FOR SELECT
  USING (
    (verified_status = 'verified' AND is_active = true)
    OR (auth.uid() = owner_id)
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Owners can insert hostels"
  ON public.hostels FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update own hostels"
  ON public.hostels FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners can delete own hostels"
  ON public.hostels FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_hostels_city ON public.hostels(city);
CREATE INDEX idx_hostels_location ON public.hostels USING gin(to_tsvector('english', location || ' ' || hostel_name));
CREATE INDEX idx_hostels_price ON public.hostels(price_min, price_max);
CREATE INDEX idx_hostels_rating ON public.hostels(rating DESC);
CREATE INDEX idx_hostels_owner ON public.hostels(owner_id);
CREATE INDEX idx_hostels_verified_active ON public.hostels(verified_status, is_active);
CREATE INDEX idx_hostels_gender ON public.hostels(gender);
CREATE INDEX idx_hostels_type ON public.hostels(property_type);

-- 4. ROOMS TABLE
CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hostel_id UUID NOT NULL REFERENCES public.hostels(id) ON DELETE CASCADE,
  sharing_type TEXT NOT NULL CHECK (sharing_type IN ('single', 'double', 'triple', 'quad', 'dormitory')),
  price_per_month INTEGER NOT NULL,
  available_beds INTEGER NOT NULL DEFAULT 0,
  total_beds INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view rooms"
  ON public.rooms FOR SELECT USING (true);

CREATE POLICY "Owners can insert rooms"
  ON public.rooms FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.hostels WHERE id = hostel_id AND owner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Owners can update rooms"
  ON public.rooms FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.hostels WHERE id = hostel_id AND owner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Owners can delete rooms"
  ON public.rooms FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.hostels WHERE id = hostel_id AND owner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE INDEX idx_rooms_hostel ON public.rooms(hostel_id);
CREATE INDEX idx_rooms_price ON public.rooms(price_per_month);
CREATE INDEX idx_rooms_sharing ON public.rooms(sharing_type);

-- 5. FACILITIES TABLE
CREATE TABLE public.facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hostel_id UUID NOT NULL UNIQUE REFERENCES public.hostels(id) ON DELETE CASCADE,
  wifi BOOLEAN DEFAULT false,
  ac BOOLEAN DEFAULT false,
  food BOOLEAN DEFAULT false,
  laundry BOOLEAN DEFAULT false,
  parking BOOLEAN DEFAULT false,
  geyser BOOLEAN DEFAULT false,
  washing_machine BOOLEAN DEFAULT false,
  gym BOOLEAN DEFAULT false,
  power_backup BOOLEAN DEFAULT false,
  cctv BOOLEAN DEFAULT false,
  study_room BOOLEAN DEFAULT false,
  common_kitchen BOOLEAN DEFAULT false,
  pool BOOLEAN DEFAULT false,
  housekeeping BOOLEAN DEFAULT false
);

ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view facilities"
  ON public.facilities FOR SELECT USING (true);

CREATE POLICY "Owners can insert facilities"
  ON public.facilities FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.hostels WHERE id = hostel_id AND owner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Owners can update facilities"
  ON public.facilities FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.hostels WHERE id = hostel_id AND owner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Owners can delete facilities"
  ON public.facilities FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.hostels WHERE id = hostel_id AND owner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- 6. REVIEWS TABLE
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hostel_id UUID NOT NULL REFERENCES public.hostels(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_verified BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, hostel_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews"
  ON public.reviews FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create reviews"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
  ON public.reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
  ON public.reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_reviews_hostel ON public.reviews(hostel_id);
CREATE INDEX idx_reviews_user ON public.reviews(user_id);
CREATE INDEX idx_reviews_rating ON public.reviews(rating);

-- Auto-update hostel rating trigger
CREATE OR REPLACE FUNCTION public.update_hostel_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.hostels SET
    rating = (SELECT ROUND(AVG(rating)::numeric, 1) FROM public.reviews WHERE hostel_id = COALESCE(NEW.hostel_id, OLD.hostel_id)),
    review_count = (SELECT COUNT(*) FROM public.reviews WHERE hostel_id = COALESCE(NEW.hostel_id, OLD.hostel_id))
  WHERE id = COALESCE(NEW.hostel_id, OLD.hostel_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER update_hostel_rating_on_review
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_hostel_rating();

-- 7. BOOKINGS TABLE
CREATE TYPE public.booking_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled', 'completed');

CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hostel_id UUID NOT NULL REFERENCES public.hostels(id) ON DELETE CASCADE,
  room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  status booking_status NOT NULL DEFAULT 'pending',
  move_in_date DATE,
  message TEXT,
  full_name TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookings"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.hostels WHERE id = hostel_id AND owner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Authenticated users can create bookings"
  ON public.bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners and admins can update bookings"
  ON public.bookings FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.hostels WHERE id = hostel_id AND owner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE INDEX idx_bookings_user ON public.bookings(user_id);
CREATE INDEX idx_bookings_hostel ON public.bookings(hostel_id);
CREATE INDEX idx_bookings_status ON public.bookings(status);

-- 8. HOSTEL IMAGES TABLE
CREATE TABLE public.hostel_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hostel_id UUID NOT NULL REFERENCES public.hostels(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.hostel_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view hostel images"
  ON public.hostel_images FOR SELECT USING (true);

CREATE POLICY "Owners can insert hostel images"
  ON public.hostel_images FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.hostels WHERE id = hostel_id AND owner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Owners can update hostel images"
  ON public.hostel_images FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.hostels WHERE id = hostel_id AND owner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Owners can delete hostel images"
  ON public.hostel_images FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.hostels WHERE id = hostel_id AND owner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE INDEX idx_images_hostel ON public.hostel_images(hostel_id);

-- 9. VERIFICATION DOCUMENTS TABLE
CREATE TABLE public.verification_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hostel_id UUID NOT NULL REFERENCES public.hostels(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  government_id_url TEXT,
  ownership_proof_url TEXT,
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.verification_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view own verification docs"
  ON public.verification_documents FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners can submit verification docs"
  ON public.verification_documents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Admins can update verification docs"
  ON public.verification_documents FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 10. USER PREFERENCES (for AI recommendations)
CREATE TABLE public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  budget_min INTEGER,
  budget_max INTEGER,
  preferred_city TEXT,
  preferred_location TEXT,
  preferred_sharing TEXT,
  preferred_gender TEXT,
  preferred_facilities TEXT[],
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON public.user_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON public.user_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON public.user_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- 11. SAVED HOSTELS (Wishlist)
CREATE TABLE public.saved_hostels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hostel_id UUID NOT NULL REFERENCES public.hostels(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, hostel_id)
);

ALTER TABLE public.saved_hostels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved hostels"
  ON public.saved_hostels FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert saved hostels"
  ON public.saved_hostels FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete saved hostels"
  ON public.saved_hostels FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_saved_user ON public.saved_hostels(user_id);

-- 12. SEARCH HISTORY (for recommendations)
CREATE TABLE public.search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  search_query TEXT,
  city TEXT,
  filters JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own search history"
  ON public.search_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert search history"
  ON public.search_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_search_user ON public.search_history(user_id);

-- 13. Updated at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_hostels_updated_at BEFORE UPDATE ON public.hostels FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_preferences_updated_at BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 14. AUTO-CREATE PROFILE + DEFAULT ROLE ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 15. STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public) VALUES ('hostel-images', 'hostel-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('verification-docs', 'verification-docs', false);

CREATE POLICY "Hostel images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'hostel-images');

CREATE POLICY "Authenticated users can upload hostel images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'hostel-images');

CREATE POLICY "Owners can upload verification docs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'verification-docs');

CREATE POLICY "Owners and admins can view verification docs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'verification-docs'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR public.has_role(auth.uid(), 'admin')
    )
  );
