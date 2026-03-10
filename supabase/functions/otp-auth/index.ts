import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function normalizeContact(raw: string): string {
  const value = raw.trim();
  return value.includes("@") ? value.toLowerCase() : value.replace(/\s+/g, "");
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const { action, contact, otp, role, full_name } = await req.json();

    if (action === "send") {
      if (!contact || typeof contact !== "string") {
        return new Response(
          JSON.stringify({ error: "Contact (email) is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const normalizedContact = normalizeContact(contact);
      if (!isValidEmail(normalizedContact)) {
        return new Response(
          JSON.stringify({ error: "Please enter a valid email address." }),
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

      const testEmails = new Set([
        "rahul@studenttest.com",
        "ananya@worktest.com",
        "ramesh@hostelowner.com",
        "suresh@pgowner.com",
      ]);
      const finalOtp = testEmails.has(normalizedContact) ? "123456" : generatedOtp;

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

      const { error: authError } = await supabase.auth.signInWithOtp({
        email: normalizedContact,
        options: {
          shouldCreateUser: true,
          data: { full_name: full_name || "", role: role || "user" },
        },
      });

      if (authError) {
        await supabase
          .from("otp_codes")
          .delete()
          .eq("contact", normalizedContact)
          .eq("verified", false);

        return new Response(
          JSON.stringify({ error: authError.message || "Failed to send OTP email." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`OTP generated for ${normalizedContact}`);

      return new Response(
        JSON.stringify({ success: true, message: "OTP sent to your email" }),
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

      const normalizedContact = normalizeContact(contact);

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

      // Check if user exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(
        (u) => u.email === normalizedContact
      );

      let session = null;
      let isNewUser = false;

      if (existingUser) {
        // Generate a session for existing user
        const { data: tokenData, error: tokenError } =
          await supabase.auth.admin.generateLink({
            type: "magiclink",
            email: normalizedContact,
          });

        if (tokenError) {
          console.error("Token generation error:", tokenError);
          return new Response(
            JSON.stringify({ error: "Failed to create session" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Use the token hash to verify and create session
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
        // Create new user
        isNewUser = true;
        const tempPassword = crypto.randomUUID();
        const { data: newUser, error: createError } =
          await supabase.auth.admin.createUser({
            email: normalizedContact,
            password: tempPassword,
            email_confirm: true,
            user_metadata: {
              full_name: full_name || "",
            },
          });

        if (createError) {
          console.error("Create user error:", createError);
          return new Response(
            JSON.stringify({ error: "Failed to create account" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Role assignment is now handled by the complete-registration edge function
        // The handle_new_user trigger assigns a default 'user' role
        const { data: tokenData } = await supabase.auth.admin.generateLink({
          type: "magiclink",
          email: normalizedContact,
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
