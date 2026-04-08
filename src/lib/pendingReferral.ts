import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const PENDING_REFERRAL_STORAGE_KEY = "staynest_pending_referral";

/** Persist ?ref= or ?coupon= for use after OTP completes. */
export function stashReferralCodeFromUrl(ref: string | null, coupon: string | null) {
  const code = (coupon || ref || "").trim();
  if (code) {
    sessionStorage.setItem(PENDING_REFERRAL_STORAGE_KEY, code);
  }
}

/** Call once after session exists; idempotent on server for already-redeemed users. */
export async function applyPendingReferralCode(): Promise<void> {
  const code = sessionStorage.getItem(PENDING_REFERRAL_STORAGE_KEY)?.trim();
  if (!code) return;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) return;

  const { data, error } = await supabase.functions.invoke("apply-referral-code", {
    body: { referral_code: code },
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (error) {
    console.warn("apply-referral-code", error);
    return;
  }

  sessionStorage.removeItem(PENDING_REFERRAL_STORAGE_KEY);

  if ((data as { already_redeemed?: boolean })?.already_redeemed) return;
  if ((data as { success?: boolean })?.success) {
    toast.success("Referral bonus applied! +50 points.");
  }
}
