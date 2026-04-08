import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/** Active membership at a hostel that has laundry in facilities. */
export function useLaundryEligible() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [eligible, setEligible] = useState(false);
  const [hostelId, setHostelId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setEligible(false);
      setHostelId(null);
      return;
    }

    let cancelled = false;
    (async () => {
      const { data: members } = await supabase
        .from("hostel_members")
        .select("hostel_id")
        .eq("user_id", user.id)
        .eq("status", "active");

      if (cancelled) return;
      if (!members?.length) {
        setEligible(false);
        setHostelId(null);
        setLoading(false);
        return;
      }

      const ids = [...new Set(members.map((m) => m.hostel_id))];
      const { data: facs } = await supabase.from("facilities").select("hostel_id, laundry").in("hostel_id", ids);

      if (cancelled) return;
      const row = facs?.find((f) => f.laundry === true);
      setEligible(!!row);
      setHostelId(row?.hostel_id ?? null);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  return { loading, eligible, hostelId };
}
