import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const testUsers = [
  {
    email: "owner@testapp.com",
    full_name: "Owner User",
    phone: "+919876543210",
    role: "owner" as const,
    city: "Hyderabad",
  },
  {
    email: "tenant@testapp.com",
    full_name: "Tenant User",
    phone: "+919876543211",
    role: "user" as const,
    city: "Hyderabad",
  },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const results: { email: string; status: string; error?: string }[] = [];

  for (const user of testUsers) {
    try {
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existing = existingUsers?.users?.find((u) => u.email === user.email);

      let userId: string;

      if (existing) {
        userId = existing.id;
        results.push({ email: user.email, status: "already_exists" });
      } else {
        const { data: newUser, error } = await supabase.auth.admin.createUser({
          email: user.email,
          password: "Test@123",
          email_confirm: true,
          user_metadata: { full_name: user.full_name },
        });

        if (error || !newUser.user) {
          results.push({ email: user.email, status: "error", error: error?.message });
          continue;
        }
        userId = newUser.user.id;
        results.push({ email: user.email, status: "created" });
      }

      // Upsert profile
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existingProfile) {
        await supabase
          .from("profiles")
          .update({ phone: user.phone, full_name: user.full_name, email: user.email, account_status: "active" })
          .eq("user_id", userId);
      } else {
        await supabase.from("profiles").insert({
          user_id: userId,
          full_name: user.full_name,
          email: user.email,
          phone: user.phone,
          account_status: "active",
        });
      }

      // Set role
      const dbRole = user.role; // 'owner' or 'user'
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .eq("role", dbRole)
        .maybeSingle();

      if (!existingRole) {
        // Remove default 'user' role if setting to owner
        if (dbRole === "owner") {
          await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "user");
        }
        await supabase.from("user_roles").insert({ user_id: userId, role: dbRole });
      }
    } catch (e) {
      results.push({ email: user.email, status: "error", error: String(e) });
    }
  }

  return new Response(JSON.stringify({ success: true, results }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
