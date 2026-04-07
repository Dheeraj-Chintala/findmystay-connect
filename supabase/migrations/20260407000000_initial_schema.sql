-- =============================================================================
-- FindMyStay Connect — Initial Schema Migration
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ---------------------------------------------------------------------------
create extension if not exists "uuid-ossp" with schema extensions;

-- ---------------------------------------------------------------------------
-- 2. CUSTOM ENUMS
-- ---------------------------------------------------------------------------
create type public.app_role as enum ('admin', 'owner', 'user', 'owner_pending');

create type public.booking_status as enum (
  'pending', 'approved', 'rejected', 'cancelled', 'completed', 'checked_in'
);

create type public.laundry_order_status as enum (
  'order_placed', 'pickup_scheduled', 'in_progress',
  'out_for_delivery', 'delivered', 'cancelled'
);

create type public.media_verification_status as enum (
  'pending', 'scheduled', 'under_review', 'platform_verified',
  'owner_verified', 'ai_check', 'admin_review', 'rejected'
);

create type public.media_verification_type as enum ('pr_team', 'self_capture');

create type public.verification_status as enum (
  'pending', 'under_review', 'verified', 'rejected'
);

-- ---------------------------------------------------------------------------
-- 3. TABLES  (ordered by FK dependency tiers)
-- ---------------------------------------------------------------------------

-- ── Tier 1: no FK to other app tables ──────────────────────────────────────

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text,
  phone text,
  avatar_url text,
  account_status text not null default 'active',
  hostel_name text,
  property_location text,
  budget_min numeric,
  budget_max numeric,
  occupation text,
  preferred_location text,
  onboarding_complete boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index profiles_user_id_idx on public.profiles (user_id);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null default 'user'
);

create unique index user_roles_user_id_role_idx on public.user_roles (user_id, role);

create table public.user_wallet (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reward_points numeric not null default 0,
  cash_value numeric not null default 0,
  updated_at timestamptz not null default now()
);

create unique index user_wallet_user_id_idx on public.user_wallet (user_id);

create table public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  budget_min numeric,
  budget_max numeric,
  preferred_city text,
  preferred_facilities text[],
  preferred_gender text,
  preferred_sharing text,
  preferred_location text,
  updated_at timestamptz not null default now()
);

create unique index user_preferences_user_id_idx on public.user_preferences (user_id);

create table public.otp_codes (
  id uuid primary key default gen_random_uuid(),
  contact text not null,
  otp_code text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create index otp_codes_contact_expires_idx on public.otp_codes (contact, expires_at);

create table public.laundry_services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric not null default 0,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.search_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  search_query text,
  city text,
  filters jsonb,
  created_at timestamptz not null default now()
);

create index search_history_user_id_idx on public.search_history (user_id);

-- ── Tier 2: FK to auth.users or tier-1 ────────────────────────────────────

create table public.hostels (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  hostel_name text not null,
  city text not null,
  location text not null,
  description text,
  latitude numeric,
  longitude numeric,
  gender text not null default 'any',
  property_type text not null default 'hostel',
  price_min numeric not null default 0,
  price_max numeric not null default 0,
  rating numeric default 0,
  review_count integer default 0,
  media_verification_badge text,
  verified_status public.verification_status not null default 'pending',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index hostels_owner_id_idx on public.hostels (owner_id);
create index hostels_city_idx on public.hostels (city);
create index hostels_verified_status_idx on public.hostels (verified_status);
create index hostels_is_active_idx on public.hostels (is_active);

create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid not null references auth.users(id) on delete cascade,
  referred_user_id uuid references auth.users(id) on delete set null,
  referral_code text not null,
  reward_points numeric not null default 0,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create index referrals_referrer_idx on public.referrals (referrer_user_id);
create index referrals_code_idx on public.referrals (referral_code);

create table public.lifestyle_clicks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  service_name text not null,
  redirect_url text not null,
  points_awarded numeric not null default 0,
  created_at timestamptz not null default now()
);

create index lifestyle_clicks_user_id_idx on public.lifestyle_clicks (user_id);

-- ── Tier 3: FK to hostels ──────────────────────────────────────────────────

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  hostel_id uuid not null references public.hostels(id) on delete cascade,
  sharing_type text not null,
  price_per_month numeric not null,
  total_beds integer not null default 1,
  available_beds integer not null default 1,
  created_at timestamptz not null default now()
);

create index rooms_hostel_id_idx on public.rooms (hostel_id);

create table public.facilities (
  id uuid primary key default gen_random_uuid(),
  hostel_id uuid not null references public.hostels(id) on delete cascade unique,
  wifi boolean default false,
  ac boolean default false,
  food boolean default false,
  laundry boolean default false,
  parking boolean default false,
  gym boolean default false,
  pool boolean default false,
  cctv boolean default false,
  power_backup boolean default false,
  geyser boolean default false,
  washing_machine boolean default false,
  common_kitchen boolean default false,
  study_room boolean default false,
  housekeeping boolean default false
);

create table public.hostel_images (
  id uuid primary key default gen_random_uuid(),
  hostel_id uuid not null references public.hostels(id) on delete cascade,
  image_url text not null,
  image_category text not null default 'general',
  display_order integer default 0,
  uploaded_by uuid not null default auth.uid(),
  uploaded_at timestamptz not null default now()
);

create index hostel_images_hostel_id_idx on public.hostel_images (hostel_id);

create table public.hostel_videos (
  id uuid primary key default gen_random_uuid(),
  hostel_id uuid not null references public.hostels(id) on delete cascade,
  video_url text not null,
  display_order integer default 0,
  uploaded_by uuid not null default auth.uid(),
  created_at timestamptz not null default now()
);

create index hostel_videos_hostel_id_idx on public.hostel_videos (hostel_id);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  hostel_id uuid not null references public.hostels(id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  helpful_count integer default 0,
  is_verified boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index reviews_hostel_id_idx on public.reviews (hostel_id);
create index reviews_user_id_idx on public.reviews (user_id);

create table public.saved_hostels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  hostel_id uuid not null references public.hostels(id) on delete cascade,
  created_at timestamptz not null default now()
);

create unique index saved_hostels_user_hostel_idx on public.saved_hostels (user_id, hostel_id);

create table public.fraud_alerts (
  id uuid primary key default gen_random_uuid(),
  hostel_id uuid not null references public.hostels(id) on delete cascade,
  risk_score numeric not null default 0,
  flags jsonb not null default '[]'::jsonb,
  status text not null default 'pending',
  admin_notes text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index fraud_alerts_hostel_id_idx on public.fraud_alerts (hostel_id);

create table public.verification_documents (
  id uuid primary key default gen_random_uuid(),
  hostel_id uuid not null references public.hostels(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  government_id_url text,
  ownership_proof_url text,
  admin_notes text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index verification_documents_hostel_id_idx on public.verification_documents (hostel_id);
create index verification_documents_owner_id_idx on public.verification_documents (owner_id);

create table public.media_verification_requests (
  id uuid primary key default gen_random_uuid(),
  hostel_id uuid not null references public.hostels(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  verification_type public.media_verification_type not null,
  status public.media_verification_status not null default 'pending',
  areas_to_capture text[],
  assigned_pr_member text,
  requested_date timestamptz,
  risk_score numeric,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index mvr_hostel_id_idx on public.media_verification_requests (hostel_id);
create index mvr_owner_id_idx on public.media_verification_requests (owner_id);

create table public.laundry_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  hostel_id uuid references public.hostels(id) on delete set null,
  status public.laundry_order_status not null default 'order_placed',
  total_amount numeric not null default 0,
  pickup_time timestamptz,
  delivery_time timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index laundry_orders_user_id_idx on public.laundry_orders (user_id);
create index laundry_orders_hostel_id_idx on public.laundry_orders (hostel_id);

-- ── Tier 4: FK to tier-3 tables ────────────────────────────────────────────

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  hostel_id uuid not null references public.hostels(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  status public.booking_status not null default 'pending',
  full_name text,
  email text,
  phone text,
  move_in_date date,
  message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index bookings_user_id_idx on public.bookings (user_id);
create index bookings_hostel_id_idx on public.bookings (hostel_id);
create index bookings_room_id_idx on public.bookings (room_id);
create index bookings_status_idx on public.bookings (status);

create table public.hostel_members (
  id uuid primary key default gen_random_uuid(),
  hostel_id uuid not null references public.hostels(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete set null,
  status text not null default 'active',
  joined_at timestamptz not null default now()
);

create unique index hostel_members_hostel_user_idx on public.hostel_members (hostel_id, user_id);
create index hostel_members_user_id_idx on public.hostel_members (user_id);

create table public.verification_media (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.media_verification_requests(id) on delete cascade,
  uploader_id uuid not null references auth.users(id) on delete cascade,
  media_url text not null,
  media_type text not null default 'image',
  capture_step text,
  capture_timestamp timestamptz,
  gps_latitude numeric,
  gps_longitude numeric,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index verification_media_request_id_idx on public.verification_media (request_id);

create table public.laundry_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.laundry_orders(id) on delete cascade,
  service_id uuid not null references public.laundry_services(id) on delete cascade,
  quantity integer not null default 1,
  price numeric not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

create index laundry_order_items_order_id_idx on public.laundry_order_items (order_id);
create index laundry_order_items_service_id_idx on public.laundry_order_items (service_id);

create table public.laundry_ratings (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.laundry_orders(id) on delete cascade unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz not null default now()
);

create index laundry_ratings_order_id_idx on public.laundry_ratings (order_id);

-- ---------------------------------------------------------------------------
-- 4. FUNCTIONS
-- ---------------------------------------------------------------------------

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  );
$$;

create or replace function public.assign_owner_role(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_roles (user_id, role)
  values (p_user_id, 'owner')
  on conflict (user_id, role) do nothing;
end;
$$;

create or replace function public.cleanup_expired_otps()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.otp_codes where expires_at < now();
$$;

-- Auth trigger: auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, full_name, email, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    new.phone
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auto-update updated_at columns
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.profiles
  for each row execute function public.update_updated_at();
create trigger set_updated_at before update on public.hostels
  for each row execute function public.update_updated_at();
create trigger set_updated_at before update on public.bookings
  for each row execute function public.update_updated_at();
create trigger set_updated_at before update on public.reviews
  for each row execute function public.update_updated_at();
create trigger set_updated_at before update on public.fraud_alerts
  for each row execute function public.update_updated_at();
create trigger set_updated_at before update on public.media_verification_requests
  for each row execute function public.update_updated_at();
create trigger set_updated_at before update on public.laundry_orders
  for each row execute function public.update_updated_at();
create trigger set_updated_at before update on public.laundry_services
  for each row execute function public.update_updated_at();

-- ---------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------

-- Enable RLS on every table
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.user_wallet enable row level security;
alter table public.user_preferences enable row level security;
alter table public.otp_codes enable row level security;
alter table public.laundry_services enable row level security;
alter table public.search_history enable row level security;
alter table public.hostels enable row level security;
alter table public.referrals enable row level security;
alter table public.lifestyle_clicks enable row level security;
alter table public.rooms enable row level security;
alter table public.facilities enable row level security;
alter table public.hostel_images enable row level security;
alter table public.hostel_videos enable row level security;
alter table public.reviews enable row level security;
alter table public.saved_hostels enable row level security;
alter table public.fraud_alerts enable row level security;
alter table public.verification_documents enable row level security;
alter table public.media_verification_requests enable row level security;
alter table public.laundry_orders enable row level security;
alter table public.bookings enable row level security;
alter table public.hostel_members enable row level security;
alter table public.verification_media enable row level security;
alter table public.laundry_order_items enable row level security;
alter table public.laundry_ratings enable row level security;

-- ── profiles ───────────────────────────────────────────────────────────────
create policy "Users read own profile"
  on public.profiles for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users update own profile"
  on public.profiles for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Admin reads all profiles"
  on public.profiles for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Service role manages profiles"
  on public.profiles for all
  to service_role
  using (true)
  with check (true);

-- ── user_roles ─────────────────────────────────────────────────────────────
create policy "Users read own roles"
  on public.user_roles for select
  to authenticated
  using (user_id = auth.uid());

create policy "Admin manages all roles"
  on public.user_roles for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Service role manages roles"
  on public.user_roles for all
  to service_role
  using (true)
  with check (true);

-- ── user_wallet ────────────────────────────────────────────────────────────
create policy "Users read own wallet"
  on public.user_wallet for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users update own wallet"
  on public.user_wallet for update
  to authenticated
  using (user_id = auth.uid());

create policy "Service role manages wallets"
  on public.user_wallet for all
  to service_role
  using (true)
  with check (true);

-- ── user_preferences ───────────────────────────────────────────────────────
create policy "Users manage own preferences"
  on public.user_preferences for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ── otp_codes ──────────────────────────────────────────────────────────────
create policy "Service role manages OTPs"
  on public.otp_codes for all
  to service_role
  using (true)
  with check (true);

-- ── laundry_services (public read) ─────────────────────────────────────────
create policy "Anyone can read active laundry services"
  on public.laundry_services for select
  to anon, authenticated
  using (is_active = true);

create policy "Admin manages laundry services"
  on public.laundry_services for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ── search_history ─────────────────────────────────────────────────────────
create policy "Users manage own search history"
  on public.search_history for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ── hostels (public read, owner write) ─────────────────────────────────────
create policy "Anyone can read active hostels"
  on public.hostels for select
  to anon, authenticated
  using (true);

create policy "Owners insert own hostels"
  on public.hostels for insert
  to authenticated
  with check (owner_id = auth.uid() and public.has_role(auth.uid(), 'owner'));

create policy "Owners update own hostels"
  on public.hostels for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "Owners delete own hostels"
  on public.hostels for delete
  to authenticated
  using (owner_id = auth.uid());

create policy "Admin manages all hostels"
  on public.hostels for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ── referrals ──────────────────────────────────────────────────────────────
create policy "Users read own referrals"
  on public.referrals for select
  to authenticated
  using (referrer_user_id = auth.uid() or referred_user_id = auth.uid());

create policy "Users insert referrals"
  on public.referrals for insert
  to authenticated
  with check (referrer_user_id = auth.uid());

-- ── lifestyle_clicks ───────────────────────────────────────────────────────
create policy "Users manage own clicks"
  on public.lifestyle_clicks for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ── rooms (public read, owner write) ───────────────────────────────────────
create policy "Anyone can read rooms"
  on public.rooms for select
  to anon, authenticated
  using (true);

create policy "Owners manage rooms for own hostels"
  on public.rooms for all
  to authenticated
  using (
    exists (
      select 1 from public.hostels
      where hostels.id = rooms.hostel_id and hostels.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.hostels
      where hostels.id = rooms.hostel_id and hostels.owner_id = auth.uid()
    )
  );

-- ── facilities (public read, owner write) ──────────────────────────────────
create policy "Anyone can read facilities"
  on public.facilities for select
  to anon, authenticated
  using (true);

create policy "Owners manage facilities for own hostels"
  on public.facilities for all
  to authenticated
  using (
    exists (
      select 1 from public.hostels
      where hostels.id = facilities.hostel_id and hostels.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.hostels
      where hostels.id = facilities.hostel_id and hostels.owner_id = auth.uid()
    )
  );

-- ── hostel_images (public read, owner write) ───────────────────────────────
create policy "Anyone can read hostel images"
  on public.hostel_images for select
  to anon, authenticated
  using (true);

create policy "Owners manage images for own hostels"
  on public.hostel_images for all
  to authenticated
  using (
    exists (
      select 1 from public.hostels
      where hostels.id = hostel_images.hostel_id and hostels.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.hostels
      where hostels.id = hostel_images.hostel_id and hostels.owner_id = auth.uid()
    )
  );

-- ── hostel_videos (public read, owner write) ───────────────────────────────
create policy "Anyone can read hostel videos"
  on public.hostel_videos for select
  to anon, authenticated
  using (true);

create policy "Owners manage videos for own hostels"
  on public.hostel_videos for all
  to authenticated
  using (
    exists (
      select 1 from public.hostels
      where hostels.id = hostel_videos.hostel_id and hostels.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.hostels
      where hostels.id = hostel_videos.hostel_id and hostels.owner_id = auth.uid()
    )
  );

-- ── reviews ────────────────────────────────────────────────────────────────
create policy "Anyone can read reviews"
  on public.reviews for select
  to anon, authenticated
  using (true);

create policy "Users insert own reviews"
  on public.reviews for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users update own reviews"
  on public.reviews for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users delete own reviews"
  on public.reviews for delete
  to authenticated
  using (user_id = auth.uid());

create policy "Admin manages all reviews"
  on public.reviews for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ── saved_hostels ──────────────────────────────────────────────────────────
create policy "Users manage own saved hostels"
  on public.saved_hostels for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ── fraud_alerts ───────────────────────────────────────────────────────────
create policy "Admin manages fraud alerts"
  on public.fraud_alerts for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Owners read fraud alerts for own hostels"
  on public.fraud_alerts for select
  to authenticated
  using (
    exists (
      select 1 from public.hostels
      where hostels.id = fraud_alerts.hostel_id and hostels.owner_id = auth.uid()
    )
  );

-- ── verification_documents ─────────────────────────────────────────────────
create policy "Owners manage own verification docs"
  on public.verification_documents for all
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "Admin manages all verification docs"
  on public.verification_documents for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ── media_verification_requests ────────────────────────────────────────────
create policy "Owners manage own media requests"
  on public.media_verification_requests for all
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "Admin manages all media requests"
  on public.media_verification_requests for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ── laundry_orders ─────────────────────────────────────────────────────────
create policy "Users manage own laundry orders"
  on public.laundry_orders for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Admin manages all laundry orders"
  on public.laundry_orders for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ── bookings ───────────────────────────────────────────────────────────────
create policy "Users read own bookings"
  on public.bookings for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users insert own bookings"
  on public.bookings for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Owners read bookings for own hostels"
  on public.bookings for select
  to authenticated
  using (
    exists (
      select 1 from public.hostels
      where hostels.id = bookings.hostel_id and hostels.owner_id = auth.uid()
    )
  );

create policy "Owners update bookings for own hostels"
  on public.bookings for update
  to authenticated
  using (
    exists (
      select 1 from public.hostels
      where hostels.id = bookings.hostel_id and hostels.owner_id = auth.uid()
    )
  );

create policy "Admin manages all bookings"
  on public.bookings for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ── hostel_members ─────────────────────────────────────────────────────────
create policy "Users read own memberships"
  on public.hostel_members for select
  to authenticated
  using (user_id = auth.uid());

create policy "Owners manage members for own hostels"
  on public.hostel_members for all
  to authenticated
  using (
    exists (
      select 1 from public.hostels
      where hostels.id = hostel_members.hostel_id and hostels.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.hostels
      where hostels.id = hostel_members.hostel_id and hostels.owner_id = auth.uid()
    )
  );

create policy "Admin manages all members"
  on public.hostel_members for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ── verification_media ─────────────────────────────────────────────────────
create policy "Uploaders manage own verification media"
  on public.verification_media for all
  to authenticated
  using (uploader_id = auth.uid())
  with check (uploader_id = auth.uid());

create policy "Admin manages all verification media"
  on public.verification_media for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ── laundry_order_items ────────────────────────────────────────────────────
create policy "Users manage own order items"
  on public.laundry_order_items for all
  to authenticated
  using (
    exists (
      select 1 from public.laundry_orders
      where laundry_orders.id = laundry_order_items.order_id
        and laundry_orders.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.laundry_orders
      where laundry_orders.id = laundry_order_items.order_id
        and laundry_orders.user_id = auth.uid()
    )
  );

create policy "Admin manages all order items"
  on public.laundry_order_items for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ── laundry_ratings ────────────────────────────────────────────────────────
create policy "Users manage own ratings"
  on public.laundry_ratings for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Admin manages all ratings"
  on public.laundry_ratings for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------------------
-- 6. STORAGE BUCKETS & POLICIES
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('hostel-images', 'hostel-images', true, 5242880, array['image/jpeg','image/png','image/webp','image/gif']),
  ('hostel-videos', 'hostel-videos', true, 52428800, array['video/mp4','video/webm','video/quicktime']),
  ('verification-docs', 'verification-docs', false, 10485760, array['image/jpeg','image/png','application/pdf']),
  ('verification-media', 'verification-media', false, 10485760, array['image/jpeg','image/png','video/mp4'])
on conflict (id) do nothing;

-- hostel-images: public read, authenticated owners upload
create policy "Public read hostel images"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'hostel-images');

create policy "Authenticated upload hostel images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'hostel-images');

create policy "Owners delete own hostel images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'hostel-images' and (storage.foldername(name))[1] = auth.uid()::text);

-- hostel-videos: public read, authenticated owners upload
create policy "Public read hostel videos"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'hostel-videos');

create policy "Authenticated upload hostel videos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'hostel-videos');

create policy "Owners delete own hostel videos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'hostel-videos' and (storage.foldername(name))[1] = auth.uid()::text);

-- verification-docs: owners upload, admins + owners read
create policy "Owners upload verification docs"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'verification-docs');

create policy "Owners and admins read verification docs"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'verification-docs'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.has_role(auth.uid(), 'admin')
    )
  );

-- verification-media: owners/PR upload, admins + uploaders read
create policy "Authenticated upload verification media"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'verification-media');

create policy "Uploaders and admins read verification media"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'verification-media'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.has_role(auth.uid(), 'admin')
    )
  );

-- ---------------------------------------------------------------------------
-- 7. GRANT PERMISSIONS
-- ---------------------------------------------------------------------------

grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant execute on all functions in schema public to anon, authenticated, service_role;
