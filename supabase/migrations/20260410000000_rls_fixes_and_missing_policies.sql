-- Phase 1 + 2 + 3 consolidated migration
-- Security fixes, missing RLS policies, schema additions for deployment readiness

-- ── 1. SECURITY: Remove user_wallet self-update policy ───────────────────────
-- Wallet mutations must only happen via service_role in edge functions.
DROP POLICY IF EXISTS "Users update own wallet" ON public.user_wallet;

-- ── 2. fraud_alerts: user INSERT + SELECT policies ───────────────────────────
-- Users need to submit fraud complaints and read their own reports.
CREATE POLICY "Users insert own fraud alerts"
  ON public.fraud_alerts FOR INSERT
  TO authenticated
  WITH CHECK (reported_by = auth.uid());

CREATE POLICY "Users read own fraud alerts"
  ON public.fraud_alerts FOR SELECT
  TO authenticated
  USING (reported_by = auth.uid());

-- ── 3. fraud_alerts.reported_by: add FK constraint ───────────────────────────
ALTER TABLE public.fraud_alerts
  ADD CONSTRAINT fraud_alerts_reported_by_fkey
  FOREIGN KEY (reported_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- ── 4. laundry_services: owner read policy for hostel-scoped services ────────
CREATE POLICY "Owners read laundry services for own hostels"
  ON public.laundry_services FOR SELECT
  TO authenticated
  USING (
    hostel_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.hostels
      WHERE hostels.id = laundry_services.hostel_id
        AND hostels.owner_id = auth.uid()
    )
  );

-- Owners can manage (insert/update/delete) laundry services for their own hostels
CREATE POLICY "Owners manage laundry services for own hostels"
  ON public.laundry_services FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.hostels
      WHERE hostels.id = laundry_services.hostel_id
        AND hostels.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.hostels
      WHERE hostels.id = laundry_services.hostel_id
        AND hostels.owner_id = auth.uid()
    )
  );

-- Owners can also read orders for their hostels
CREATE POLICY "Owners read laundry orders for own hostels"
  ON public.laundry_orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.hostels
      WHERE hostels.id = laundry_orders.hostel_id
        AND hostels.owner_id = auth.uid()
    )
  );

-- Owners can update order status for their hostels
CREATE POLICY "Owners update laundry orders for own hostels"
  ON public.laundry_orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.hostels
      WHERE hostels.id = laundry_orders.hostel_id
        AND hostels.owner_id = auth.uid()
    )
  );

-- ── 5. hostels: add admin_notes column for rejection reasons ─────────────────
ALTER TABLE public.hostels
  ADD COLUMN IF NOT EXISTS admin_notes text;

COMMENT ON COLUMN public.hostels.admin_notes IS 'Admin notes for approval/rejection decisions';

-- ── 6. reviews: add owner_reply columns ──────────────────────────────────────
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS owner_reply text,
  ADD COLUMN IF NOT EXISTS owner_reply_at timestamptz;

COMMENT ON COLUMN public.reviews.owner_reply IS 'Reply from hostel owner';
COMMENT ON COLUMN public.reviews.owner_reply_at IS 'Timestamp of owner reply';

-- ── 7. withdrawal_requests table for ReferAndEarn ────────────────────────────
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  payment_method text NOT NULL,
  payment_details jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS withdrawal_requests_user_id_idx ON public.withdrawal_requests (user_id);

ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own withdrawal requests"
  ON public.withdrawal_requests FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users insert own withdrawal requests"
  ON public.withdrawal_requests FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin manages all withdrawal requests"
  ON public.withdrawal_requests FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role manages withdrawal requests"
  ON public.withdrawal_requests FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.withdrawal_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Grant access
GRANT ALL ON public.withdrawal_requests TO anon, authenticated, service_role;
