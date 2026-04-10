import { useState, useEffect } from "react";
import { Building2, Loader2, Calendar, MapPin, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface Membership {
  id: string;
  hostel_id: string;
  joined_at: string;
  status: string;
  hostel_name: string;
  hostel_location: string;
  hostel_city: string;
}

const UserHostelStatus = () => {
  const { user } = useAuth();
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data, error } = await supabase
        .from("hostel_members")
        .select("*")
        .eq("user_id", user.id)
        .order("joined_at", { ascending: false });
      if (error) { toast.error(error.message); setLoading(false); return; }

      if (!data?.length) {
        setLoading(false);
        return;
      }

      const hostelIds = [...new Set(data.map((m) => m.hostel_id))];
      const { data: hostels, error: hostelsError } = await supabase
        .from("hostels")
        .select("id, hostel_name, location, city")
        .in("id", hostelIds);
      if (hostelsError) { toast.error(hostelsError.message); setLoading(false); return; }

      const hostelMap = new Map((hostels || []).map(h => [h.id, h]));

      setMemberships(
        data.map((m) => {
          const hostel = hostelMap.get(m.hostel_id);
          return {
            id: m.id,
            hostel_id: m.hostel_id,
            joined_at: m.joined_at,
            status: m.status,
            hostel_name: hostel?.hostel_name || "Unknown",
            hostel_location: hostel?.location || "",
            hostel_city: hostel?.city || "",
          };
        })
      );
      setLoading(false);
    };
    fetch();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const activeMemberships = memberships.filter(m => m.status === "active");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-heading font-bold flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          My Hostel
        </h2>
        <p className="text-sm text-muted-foreground">Your current hostel memberships</p>
      </div>

      {memberships.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border/50">
          <Building2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-heading font-semibold text-lg mb-1">No Hostel Membership</h3>
          <p className="text-sm text-muted-foreground mb-6">You'll be added as a member when your booking is confirmed and you check in.</p>
          <Link to="/listings">
            <Button variant="outline" className="rounded-xl">Browse Hostels</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {activeMemberships.map((membership) => (
            <div key={membership.id} className="bg-card rounded-2xl border border-border/50 shadow-card p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-lg">{membership.hostel_name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {membership.hostel_location}, {membership.hostel_city}
                    </p>
                  </div>
                </div>
                <Badge className="bg-accent/10 text-accent gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Active Member
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                Member since {new Date(membership.joined_at).toLocaleDateString()}
              </div>
            </div>
          ))}

          {memberships.filter(m => m.status !== "active").map((membership) => (
            <div key={membership.id} className="bg-card rounded-2xl border border-border/50 p-6 opacity-60">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold">{membership.hostel_name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {membership.hostel_location}, {membership.hostel_city}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="capitalize">{membership.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserHostelStatus;
