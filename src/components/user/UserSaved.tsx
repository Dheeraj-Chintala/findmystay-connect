import { useState, useEffect } from "react";
import { Heart, MapPin, Star, Trash2, Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const UserSaved = () => {
  const { user } = useAuth();
  const [saved, setSaved] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchSaved();
  }, [user]);

  const fetchSaved = async () => {
    const { data, error } = await supabase
      .from("saved_hostels")
      .select("id, hostel_id, hostels(id, hostel_name, city, location, price_min, rating, review_count)")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    if (error) { toast.error(error.message); setLoading(false); return; }
    setSaved(data || []);
    setLoading(false);
  };

  const handleRemove = async (id: string) => {
    const { error } = await supabase.from("saved_hostels").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setSaved(saved.filter(s => s.id !== id));
    toast.success("Removed from saved");
  };

  if (loading) return (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading font-bold text-xl mb-1 flex items-center gap-2">
          <Heart className="w-5 h-5 text-destructive" /> Saved Hostels
        </h2>
        <p className="text-muted-foreground text-sm">{saved.length} hostels saved</p>
      </div>

      {saved.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border/50">
          <Heart className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">No saved hostels yet</p>
          <Link to="/listings">
            <Button variant="outline" size="sm" className="mt-3 rounded-xl">Browse Listings</Button>
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {saved.map((item) => {
            const hostel = item.hostels as any;
            if (!hostel) return null;
            return (
              <div key={item.id} className="bg-card rounded-2xl border border-border/50 shadow-card p-4">
                <div className="flex items-start justify-between mb-2">
                  <Link to={`/listing/${hostel.id}`} className="flex-1 min-w-0">
                    <h4 className="font-heading font-semibold text-sm truncate">{hostel.hostel_name}</h4>
                  </Link>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-destructive" onClick={() => handleRemove(item.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <p className="text-muted-foreground text-xs flex items-center gap-1 mb-3">
                  <MapPin className="w-3 h-3" /> {hostel.location}, {hostel.city}
                </p>
                <div className="flex items-center justify-between">
                  <span className="font-heading font-bold text-sm text-primary">₹{hostel.price_min?.toLocaleString()}<span className="text-xs font-normal text-muted-foreground">/mo</span></span>
                  <span className="flex items-center gap-1 text-xs">
                    <Star className="w-3 h-3 text-verified fill-verified" /> {hostel.rating || "New"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UserSaved;
