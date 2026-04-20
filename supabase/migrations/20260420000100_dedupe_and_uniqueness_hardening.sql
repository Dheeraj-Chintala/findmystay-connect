-- Deduplicate existing data, then enforce uniqueness to prevent future duplicates.

-- ---------------------------------------------------------------------------
-- Referrals: one base code row per (referrer, code), one redemption per referred user
-- ---------------------------------------------------------------------------
with ranked_referral_codes as (
  select
    id,
    row_number() over (
      partition by referrer_user_id, referral_code
      order by created_at asc, id asc
    ) as rn
  from public.referrals
  where referred_user_id is null
)
delete from public.referrals r
using ranked_referral_codes d
where r.id = d.id and d.rn > 1;

with ranked_referral_redemptions as (
  select
    id,
    row_number() over (
      partition by referred_user_id
      order by created_at asc, id asc
    ) as rn
  from public.referrals
  where referred_user_id is not null
)
delete from public.referrals r
using ranked_referral_redemptions d
where r.id = d.id and d.rn > 1;

create unique index if not exists referrals_unique_code_per_referrer_idx
  on public.referrals (referrer_user_id, referral_code)
  where referred_user_id is null;

create unique index if not exists referrals_unique_redeemed_user_idx
  on public.referrals (referred_user_id)
  where referred_user_id is not null;

-- ---------------------------------------------------------------------------
-- Verification documents: one row per (hostel, owner)
-- ---------------------------------------------------------------------------
with ranked_verification_docs as (
  select
    id,
    row_number() over (
      partition by hostel_id, owner_id
      order by created_at desc, id desc
    ) as rn
  from public.verification_documents
)
delete from public.verification_documents v
using ranked_verification_docs d
where v.id = d.id and d.rn > 1;

create unique index if not exists verification_documents_hostel_owner_idx
  on public.verification_documents (hostel_id, owner_id);

-- ---------------------------------------------------------------------------
-- Media verification requests: single active request per (hostel, type)
-- ---------------------------------------------------------------------------
with ranked_open_mvr as (
  select
    id,
    row_number() over (
      partition by hostel_id, verification_type
      order by created_at desc, id desc
    ) as rn
  from public.media_verification_requests
  where status in ('pending', 'scheduled', 'under_review', 'ai_check', 'admin_review')
)
delete from public.media_verification_requests m
using ranked_open_mvr d
where m.id = d.id and d.rn > 1;

create unique index if not exists media_verification_requests_open_unique_idx
  on public.media_verification_requests (hostel_id, verification_type)
  where status in ('pending', 'scheduled', 'under_review', 'ai_check', 'admin_review');

-- ---------------------------------------------------------------------------
-- Reviews: one review per user per hostel
-- ---------------------------------------------------------------------------
with ranked_reviews as (
  select
    id,
    row_number() over (
      partition by user_id, hostel_id
      order by updated_at desc, created_at desc, id desc
    ) as rn
  from public.reviews
)
delete from public.reviews r
using ranked_reviews d
where r.id = d.id and d.rn > 1;

create unique index if not exists reviews_user_hostel_unique_idx
  on public.reviews (user_id, hostel_id);

-- ---------------------------------------------------------------------------
-- Bookings: prevent duplicate pending requests for same user/hostel/room/date
-- ---------------------------------------------------------------------------
with ranked_pending_bookings as (
  select
    id,
    row_number() over (
      partition by
        user_id,
        hostel_id,
        coalesce(room_id, '00000000-0000-0000-0000-000000000000'::uuid),
        coalesce(move_in_date, '1900-01-01'::date)
      order by created_at desc, id desc
    ) as rn
  from public.bookings
  where status = 'pending'
)
delete from public.bookings b
using ranked_pending_bookings d
where b.id = d.id and d.rn > 1;

create unique index if not exists bookings_pending_unique_request_idx
  on public.bookings (
    user_id,
    hostel_id,
    coalesce(room_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(move_in_date, '1900-01-01'::date)
  )
  where status = 'pending';
