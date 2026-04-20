import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const REFEREE_POINTS = 50;
const REFERRER_POINTS = 50;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const raw = (body.referral_code ?? body.coupon ?? "") as string;
    const referralCode = String(raw).trim();
    if (!referralCode) {
      return new Response(JSON.stringify({ error: "referral_code required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { data: codeRow, error: codeErr } = await admin
      .from("referrals")
      .select("referrer_user_id, referral_code")
      .eq("referral_code", referralCode)
      .is("referred_user_id", null)
      .limit(1)
      .maybeSingle();

    if (codeErr || !codeRow?.referrer_user_id) {
      return new Response(JSON.stringify({ error: "Invalid referral code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const referrerId = codeRow.referrer_user_id as string;
    if (referrerId === user.id) {
      return new Response(JSON.stringify({ error: "Cannot use your own referral code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: insertErr } = await admin.from("referrals").insert({
      referrer_user_id: referrerId,
      referred_user_id: user.id,
      referral_code: referralCode,
      reward_points: REFEREE_POINTS,
      status: "completed",
    });

    if (insertErr) {
      // Unique index on referred_user_id ensures retries/concurrent calls are idempotent.
      if (insertErr.code === "23505") {
        return new Response(
          JSON.stringify({ success: true, already_redeemed: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      console.error(insertErr);
      return new Response(JSON.stringify({ error: "Failed to record referral" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    async function addPoints(uid: string, pts: number) {
      const { data: w } = await admin.from("user_wallet").select("reward_points").eq("user_id", uid).maybeSingle();
      const next = (w?.reward_points ?? 0) + pts;
      if (w) {
        const { error: updateErr } = await admin
          .from("user_wallet")
          .update({
            reward_points: next,
            cash_value: next / 10,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", uid);
        if (updateErr) {
          console.error("Failed to update wallet for", uid, updateErr);
          throw new Error(`Wallet update failed: ${updateErr.message}`);
        }
      } else {
        const { error: insertErr } = await admin.from("user_wallet").insert({
          user_id: uid,
          reward_points: pts,
          cash_value: pts / 10,
        });
        if (insertErr) {
          console.error("Failed to insert wallet for", uid, insertErr);
          throw new Error(`Wallet insert failed: ${insertErr.message}`);
        }
      }
    }

    await addPoints(user.id, REFEREE_POINTS);
    await addPoints(referrerId, REFERRER_POINTS);

    return new Response(
      JSON.stringify({
        success: true,
        referee_points: REFEREE_POINTS,
        referrer_points: REFERRER_POINTS,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
