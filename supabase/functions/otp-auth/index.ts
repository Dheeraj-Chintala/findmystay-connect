import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function normalizeContact(raw: string, contactType: string): string {
  const value = raw.trim();
  if (contactType === "email") return value.toLowerCase();
  // Phone: strip spaces, keep digits and + sign
  return value.replace(/[\s\-()]/g, "");
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone: string): boolean {
  // Allow +country code followed by 7-15 digits
  return /^\+?\d{7,15}$/.test(phone);
}

function detectContactType(contact: string): "email" | "phone" {
  return contact.includes("@") ? "email" : "phone";
}

// Test contacts that always get OTP 123456
const TEST_CONTACTS = new Set([
  "rahul@studenttest.com",
  "ananya@worktest.com",
  "ramesh@hostelowner.com",
  "suresh@pgowner.com",
  "owner@testapp.com",
  "tenant@testapp.com",
  "+911234567890",
  "+919876543210",
  "+919876543211",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const { action, contact, otp, role, full_name, contact_type: explicitType } = await req.json();

    if (action === "send") {
      if (!contact || typeof contact !== "string") {
        return new Response(
          JSON.stringify({ error: "Contact (email or mobile number) is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const contactType = explicitType || detectContactType(contact);
      const normalizedContact = normalizeContact(contact, contactType);

      // Validate based on type
      if (contactType === "email" && !isValidEmail(normalizedContact)) {
        return new Response(
          JSON.stringify({ error: "Please enter a valid email address." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (contactType === "phone" && !isValidPhone(normalizedContact)) {
        return new Response(
          JSON.stringify({ error: "Please enter a valid mobile number (e.g. +919876543210)." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Rate limiting: max 5 OTPs per contact in last 10 minutes
      const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from("otp_codes")
        .select("*", { count: "exact", head: true })
        .eq("contact", normalizedContact)
        .gte("created_at", tenMinAgo);

      if ((count ?? 0) >= 5) {
        return new Response(
          JSON.stringify({ error: "Too many OTP requests. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Keep only one active OTP per contact
      await supabase
        .from("otp_codes")
        .delete()
        .eq("contact", normalizedContact)
        .eq("verified", false);

      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      const generatedOtp = generateOTP();
      const finalOtp = TEST_CONTACTS.has(normalizedContact) ? "123456" : generatedOtp;

      const { error: otpInsertError } = await supabase.from("otp_codes").insert({
        contact: normalizedContact,
        otp_code: finalOtp,
        expires_at: expiresAt,
      });

      if (otpInsertError) {
        return new Response(
          JSON.stringify({ error: "Failed to generate OTP. Please try again." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // In production, send OTP via email/SMS service here
      // For test contacts, OTP is always 123456

      const destination = contactType === "email" ? "email" : "mobile number";
      console.log(`OTP generated for ${normalizedContact} (${contactType})`);

      return new Response(
        JSON.stringify({
          success: true,
          message: `OTP sent to your ${destination}`,
          contact_type: contactType,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "verify") {
      if (!contact || !otp || typeof contact !== "string" || typeof otp !== "string") {
        return new Response(
          JSON.stringify({ error: "Contact and OTP are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const contactType = explicitType || detectContactType(contact);
      const normalizedContact = normalizeContact(contact, contactType);

      // Find the latest unverified OTP for this contact
      const { data: otpRecord, error: fetchError } = await supabase
        .from("otp_codes")
        .select("*")
        .eq("contact", normalizedContact)
        .eq("verified", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError || !otpRecord) {
        return new Response(
          JSON.stringify({ error: "No OTP found. Please request a new one." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check expiration
      if (new Date(otpRecord.expires_at) < new Date()) {
        await supabase.from("otp_codes").delete().eq("id", otpRecord.id);
        return new Response(
          JSON.stringify({ error: "OTP has expired. Please request a new one." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check max attempts (5)
      if (otpRecord.attempts >= 5) {
        return new Response(
          JSON.stringify({ error: "Too many attempts. Please request a new OTP." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify OTP
      if (otpRecord.otp_code !== otp.trim()) {
        const nextAttempts = otpRecord.attempts + 1;
        await supabase
          .from("otp_codes")
          .update({ attempts: nextAttempts })
          .eq("id", otpRecord.id);

        return new Response(
          JSON.stringify({
            error:
              nextAttempts >= 5
                ? "Too many attempts. Please request a new OTP."
                : "Invalid OTP. Please try again.",
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Mark as verified
      await supabase
        .from("otp_codes")
        .update({ verified: true })
        .eq("id", otpRecord.id);

      // For phone-based login, we need a synthetic email to create auth user
      // Use phone@staynest.local as placeholder
      const authEmail = contactType === "phone"
        ? `${normalizedContact.replace("+", "")}@phone.staynest.local`
        : normalizedContact;

      // Check if user exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(
        (u) => u.email === authEmail || u.phone === normalizedContact
      );

      let session = null;
      let isNewUser = false;

      if (existingUser) {
        // Check if user account is blocked
        const { data: profile } = await supabase
          .from("profiles")
          .select("account_status")
          .eq("user_id", existingUser.id)
          .maybeSingle();

        if (profile?.account_status === "blocked") {
          return new Response(
            JSON.stringify({ error: "Your account has been blocked. Please contact support." }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (profile?.account_status === "suspended") {
          return new Response(
            JSON.stringify({ error: "Your account has been suspended. Please contact support." }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: tokenData, error: tokenError } =
          await supabase.auth.admin.generateLink({
            type: "magiclink",
            email: authEmail,
          });

        if (tokenError) {
          console.error("Token generation error:", tokenError);
          return new Response(
            JSON.stringify({ error: "Failed to create session" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: verifyData, error: verifyError } =
          await supabase.auth.verifyOtp({
            token_hash: tokenData.properties?.hashed_token || "",
            type: "magiclink",
          });

        if (verifyError) {
          console.error("Verify error:", verifyError);
          return new Response(
            JSON.stringify({ error: "Failed to create session" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        session = verifyData.session;
      } else {
        isNewUser = true;
        const tempPassword = crypto.randomUUID();
        const userData: Record<string, string> = {
          full_name: full_name || "",
        };
        if (contactType === "phone") {
          userData.phone = normalizedContact;
        }

        const { data: newUser, error: createError } =
          await supabase.auth.admin.createUser({
            email: authEmail,
            password: tempPassword,
            email_confirm: true,
            user_metadata: userData,
          });

        if (createError) {
          console.error("Create user error:", createError);
          return new Response(
            JSON.stringify({ error: "Failed to create account" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // If phone login, store phone in profile
        if (contactType === "phone" && newUser?.user) {
          await supabase
            .from("profiles")
            .update({ phone: normalizedContact })
            .eq("user_id", newUser.user.id);
        }

        const { data: tokenData } = await supabase.auth.admin.generateLink({
          type: "magiclink",
          email: authEmail,
        });

        if (tokenData?.properties?.hashed_token) {
          const { data: verifyData } = await supabase.auth.verifyOtp({
            token_hash: tokenData.properties.hashed_token,
            type: "magiclink",
          });
          session = verifyData?.session;
        }
      }

      // Cleanup old OTPs for this contact
      await supabase
        .from("otp_codes")
        .delete()
        .eq("contact", normalizedContact)
        .eq("verified", true);

      return new Response(
        JSON.stringify({
          success: true,
          session,
          isNewUser,
          message: isNewUser
            ? "Account created successfully!"
            : "Welcome back!",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("OTP Auth error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
