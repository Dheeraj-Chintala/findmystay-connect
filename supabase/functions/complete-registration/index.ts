import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Client to identify user
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { selected_role, profile_data } = await req.json();

    if (!selected_role || !["user", "owner"].includes(selected_role)) {
      return new Response(
        JSON.stringify({ error: "Invalid role selection" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Admin client
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    /* -------------------- */
    /* UPDATE PROFILE DATA  */
    /* -------------------- */

    const profileUpdate: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (profile_data?.full_name) profileUpdate.full_name = profile_data.full_name;
    if (profile_data?.phone) profileUpdate.phone = profile_data.phone;
    if (profile_data?.hostel_name) profileUpdate.hostel_name = profile_data.hostel_name;
    if (profile_data?.property_location)
      profileUpdate.property_location = profile_data.property_location;

    if (selected_role === "owner") {
      profileUpdate.onboarding_complete = false;
    }

    const { error: profileError } = await adminClient
      .from("profiles")
      .update(profileUpdate)
      .eq("user_id", user.id);

    if (profileError) {
      return new Response(
        JSON.stringify({ error: "Failed to update profile" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    /* -------------------- */
    /* ASSIGN USER ROLE     */
    /* -------------------- */

    const roleToInsert =
      selected_role === "owner" ? "owner_pending" : "user";

    const { error: roleError } = await adminClient
      .from("user_roles")
      .upsert(
        {
          user_id: user.id,
          role: roleToInsert,
        },
        {
          onConflict: "user_id,role",
        }
      );

    if (roleError) {
      return new Response(
        JSON.stringify({ error: "Failed to assign role" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    /* -------------------- */
    /* CREATE WALLET (USER) */
    /* -------------------- */

    if (selected_role === "user") {
      const { error: walletError } = await adminClient
        .from("user_wallet")
        .upsert(
          {
            user_id: user.id,
            reward_points: 0,
            cash_value: 0,
          },
          { onConflict: "user_id" }
        );

      if (walletError) {
        console.error("Wallet upsert failed:", walletError);
        return new Response(
          JSON.stringify({ error: "Failed to create wallet" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        role: roleToInsert,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(err);

    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});