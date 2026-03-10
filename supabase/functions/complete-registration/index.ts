import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // Verify JWT from Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired session" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { selected_role, profile_data } = await req.json();

    if (!selected_role || !["user", "owner_pending"].includes(selected_role)) {
      return new Response(
        JSON.stringify({ error: "Invalid role selection" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update the user's role
    if (selected_role === "owner_pending") {
      // Remove default 'user' role assigned by trigger
      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", user.id)
        .eq("role", "user");

      // Insert owner_pending role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ user_id: user.id, role: selected_role });

      if (roleError) {
        console.error("Role insert error:", roleError);
        return new Response(
          JSON.stringify({ error: "Failed to set role" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    // If selected_role === "user", keep the default role from trigger

    // Update profile with provided data
    if (profile_data && typeof profile_data === "object") {
      const updateData: Record<string, unknown> = {
        onboarding_complete: true,
      };

      if (profile_data.full_name) updateData.full_name = profile_data.full_name;
      if (profile_data.occupation) updateData.occupation = profile_data.occupation;
      if (profile_data.preferred_location) updateData.preferred_location = profile_data.preferred_location;
      if (profile_data.budget_min !== undefined) updateData.budget_min = profile_data.budget_min;
      if (profile_data.budget_max !== undefined) updateData.budget_max = profile_data.budget_max;
      if (profile_data.hostel_name) updateData.hostel_name = profile_data.hostel_name;
      if (profile_data.property_location) updateData.property_location = profile_data.property_location;
      if (profile_data.phone) updateData.phone = profile_data.phone;

      const { error: profileError } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("user_id", user.id);

      if (profileError) {
        console.error("Profile update error:", profileError);
        return new Response(
          JSON.stringify({ error: "Failed to update profile" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const redirectPath = selected_role === "owner_pending"
      ? "/owner-verification-pending"
      : "/dashboard";

    return new Response(
      JSON.stringify({
        success: true,
        role: selected_role,
        redirect: redirectPath,
        message: selected_role === "owner_pending"
          ? "Registration complete! Your owner account is pending verification."
          : "Registration complete! Welcome to StayNest!",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Complete registration error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
