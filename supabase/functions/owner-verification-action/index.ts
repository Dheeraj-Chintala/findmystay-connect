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
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
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

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: isAdmin } = await adminClient.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { target_user_id, action } = await req.json();

    if (!target_user_id || !["approve", "reject"].includes(action)) {
      return new Response(
        JSON.stringify({ error: "Invalid request: target_user_id and action (approve|reject) required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: pendingRole } = await adminClient
      .from("user_roles")
      .select("id")
      .eq("user_id", target_user_id)
      .eq("role", "owner_pending")
      .maybeSingle();

    if (!pendingRole) {
      return new Response(
        JSON.stringify({ error: "No pending owner request found for this user" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "approve") {
      const { error: updateError } = await adminClient
        .from("user_roles")
        .update({ role: "owner" })
        .eq("id", pendingRole.id);

      if (updateError) {
        console.error("Role update error:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to approve owner" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error: approveProfileErr } = await adminClient
        .from("profiles")
        .update({ onboarding_complete: true, updated_at: new Date().toISOString() })
        .eq("user_id", target_user_id);

      if (approveProfileErr) {
        console.error("Profile update after approve failed:", approveProfileErr);
      }

      return new Response(
        JSON.stringify({ success: true, action: "approved" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "reject") {
      const { error: deleteError } = await adminClient
        .from("user_roles")
        .delete()
        .eq("id", pendingRole.id);

      if (deleteError) {
        console.error("Role delete error:", deleteError);
        return new Response(
          JSON.stringify({ error: "Failed to reject owner" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error: rejectProfileErr } = await adminClient
        .from("profiles")
        .update({ account_status: "rejected", updated_at: new Date().toISOString() })
        .eq("user_id", target_user_id);

      if (rejectProfileErr) {
        console.error("Profile update after reject failed:", rejectProfileErr);
      }

      return new Response(
        JSON.stringify({ success: true, action: "rejected" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
