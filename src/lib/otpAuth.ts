import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

/** Max age of auth.users.created_at to treat as "new account" for OTP registration flows. */
const NEW_USER_WINDOW_MS = 5 * 60 * 1000;

/**
 * Normalize user input to E.164 (+country + digits). Returns null if invalid.
 */
export function normalizeToE164(raw: string): string | null {
  const cleaned = raw.trim().replace(/[\s\-()]/g, "");
  if (!cleaned) return null;
  const withPlus = cleaned.startsWith("+") ? cleaned : `+${cleaned}`;
  if (!/^\+[1-9]\d{6,14}$/.test(withPlus)) return null;
  return withPlus;
}

/**
 * Build E.164 from a dial code (e.g. +91) and national digits only.
 */
export function composePhoneE164(dialCode: string, national: string): string | null {
  const digits = national.replace(/\D/g, "");
  if (!digits) return null;
  const dial = dialCode.trim().startsWith("+") ? dialCode.trim() : `+${dialCode.trim()}`;
  return normalizeToE164(`${dial}${digits}`);
}

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidEmailInput(raw: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.trim());
}

/**
 * True if this user record was created recently (email or phone OTP — Supabase-native flow).
 */
export function isRecentlyCreatedUser(user: User): boolean {
  if (!user.created_at) return false;
  return Date.now() - new Date(user.created_at).getTime() < NEW_USER_WINDOW_MS;
}

/**
 * Native Supabase phone OTP: SMS is sent by Auth (configure Phone provider in Dashboard).
 */
export async function sendPhoneOtp(
  phoneE164: string,
  options: { shouldCreateUser: boolean; full_name?: string }
): Promise<{ error: Error | null }> {
  const { error } = await supabase.auth.signInWithOtp({
    phone: phoneE164,
    options: {
      shouldCreateUser: options.shouldCreateUser,
      data: options.full_name ? { full_name: options.full_name } : {},
    },
  });
  if (error) {
    return { error: new Error(error.message || "Failed to send OTP") };
  }
  return { error: null };
}

export type PhoneOtpVerifyData = {
  session: Session | null;
  user: User | null;
};

export async function verifyPhoneOtp(
  phoneE164: string,
  token: string
): Promise<{ data: PhoneOtpVerifyData; error: Error | null }> {
  const { data, error } = await supabase.auth.verifyOtp({
    phone: phoneE164,
    token: token.trim(),
    type: "sms",
  });

  if (error) {
    return {
      data: { session: null, user: null },
      error: new Error(error.message || "Verification failed"),
    };
  }

  const session = data.session ?? null;
  const user = data.user ?? null;
  if (!session || !user) {
    return {
      data: { session: null, user: null },
      error: new Error("Failed to create session"),
    };
  }

  return {
    data: { session, user },
    error: null,
  };
}

export async function sendEmailOtp(
  email: string,
  options: { full_name?: string; shouldCreateUser?: boolean }
) {
  return supabase.auth.signInWithOtp({
    email: normalizeEmail(email),
    options: {
      shouldCreateUser: options.shouldCreateUser ?? true,
      data: options.full_name ? { full_name: options.full_name } : {},
    },
  });
}

export async function verifyEmailOtp(email: string, token: string) {
  return supabase.auth.verifyOtp({
    email: normalizeEmail(email),
    token: token.trim(),
    type: "email",
  });
}

/**
 * After OTP sign-in, block suspended/blocked accounts.
 */

export async function checkAccountStatusOrSignOut(): Promise<
  { ok: true } | { ok: false; message: string }
> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: true };

  const { data: profile } = await supabase
    .from("profiles")
    .select("account_status")
    .eq("user_id", user.id)
    .maybeSingle();

  const status = profile?.account_status;
  if (status === "blocked") {
    await supabase.auth.signOut();
    return { ok: false, message: "Your account has been blocked. Please contact support." };
  }
  if (status === "suspended") {
    await supabase.auth.signOut();
    return { ok: false, message: "Your account has been suspended. Please contact support." };
  }
  return { ok: true };
}
