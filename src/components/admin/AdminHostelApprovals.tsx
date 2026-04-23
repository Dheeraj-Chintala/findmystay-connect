import { useState, useEffect } from "react";
import { Clock, CheckCircle2, XCircle, Loader2, MapPin, IndianRupee, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface PendingHostel {
  id: string;
  hostel_name: string;
  location: string;
  city: string;
  price_min: number;
  price_max: number;
  property_type: string;
  gender: string;
  verified_status: string;
  created_at: string;
  owner_id: string;
  description: string | null;
  profiles: { full_name: string; email: string | null } | null;
  hostel_images: { image_url: string; display_order: number | null }[];
  facilities: { wifi: boolean; ac: boolean; food: boolean; laundry: boolean; gym: boolean; parking: boolean } | null;
}

type PendingHostelQueryRow = Omit<PendingHostel, "profiles">;

const AdminHostelApprovals = () => {
  const [hostels, setHostels] = useState<PendingHostel[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    const { data, error } = await supabase
      .from("hostels")
      .select(`
        id, hostel_name, location, city, price_min, price_max, property_type, gender,
        verified_status, created_at, owner_id, description,
        hostel_images(image_url, display_order),
        facilities(wifi, ac, food, laundry, gym, parking)
      `)
      .in("verified_status", ["pending", "under_review"])
      .order("created_at", { ascending: false });

    if (error) { toast.error(error.message); setLoading(false); return; }
    
    if (data) {
      const ownerIds = [...new Set((data as PendingHostelQueryRow[]).map((h) => h.owner_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", ownerIds);
      if (profilesError) { toast.error(profilesError.message); setLoading(false); return; }
      
      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
      
      setHostels((data as PendingHostelQueryRow[]).map((h) => ({
        ...h,
        profiles: profileMap.get(h.owner_id) || null,
      })));
    }
    setLoading(false);
  };

  const handleApprove = async (hostel: PendingHostel) => {
    setProcessing(hostel.id);
    try {
      const { error } = await supabase
        .from("hostels")
        .update({ verified_status: "verified", is_active: true })
        .eq("id", hostel.id);
      if (error) throw error;

      // Grant owner role if not already
      await supabase.from("user_roles").upsert(
        { user_id: hostel.owner_id, role: "owner" },
        { onConflict: "user_id,role" }
      );

      toast.success(`${hostel.hostel_name} approved and now visible to users!`);
      fetchPending();
    } catch (err: any) {
      toast.error(err.message);
    }
    setProcessing(null);
  };

  const handleReject = async (hostel: PendingHostel) => {
    if (!adminNotes[hostel.id]?.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    setProcessing(hostel.id);
    try {
      const { error } = await supabase
        .from("hostels")
        .update({ verified_status: "rejected", admin_notes: adminNotes[hostel.id].trim() })
        .eq("id", hostel.id);
      if (error) throw error;
      toast.success(`${hostel.hostel_name} rejected.`);
      fetchPending();
    } catch (err: any) {
      toast.error(err.message);
    }
    setProcessing(null);
  };

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  const facilityList = (f: PendingHostel["facilities"]) => {
    if (!f) return [];
    return Object.entries(f).filter(([, v]) => v).map(([k]) => k);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-semibold text-lg flex items-center gap-2">
          <Clock className="w-5 h-5 text-verified" /> Pending Property Approvals
        </h2>
        <Badge variant="secondary" className="font-mono">{hostels.length}</Badge>
      </div>

      {hostels.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border/50">
          <CheckCircle2 className="w-12 h-12 text-accent mx-auto mb-4" />
          <p className="text-muted-foreground">All caught up! No pending approvals.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {hostels.map((hostel, i) => {
            const images = [...(hostel.hostel_images || [])].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
            const amenities = facilityList(hostel.facilities);

            return (
              <motion.div key={hostel.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-card rounded-2xl border border-border/50 shadow-card p-6">
                <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                  {/* Image preview */}
                  <div className="lg:w-40 shrink-0">
                    {images.length > 0 ? (
                      <img src={images[0].image_url} alt={hostel.hostel_name} className="w-full h-28 object-cover rounded-xl" />
                    ) : (
                      <div className="w-full h-28 bg-secondary/50 rounded-xl flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground text-center mt-1">{images.length} photo(s)</p>
                  </div>

                  {/* Details */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="font-heading font-semibold text-lg">{hostel.hostel_name}</h3>
                      <Badge variant="secondary" className="capitalize text-xs">{hostel.property_type}</Badge>
                      <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                        {hostel.verified_status === "under_review" ? "Under Review" : "Pending"}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm mb-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {hostel.location}, {hostel.city}
                    </p>
                    <p className="text-sm font-heading font-bold text-primary flex items-center gap-1 mb-1">
                      <IndianRupee className="w-3.5 h-3.5" /> {hostel.price_min.toLocaleString()} - {hostel.price_max.toLocaleString()}/mo
                    </p>
                    <p className="text-muted-foreground text-xs">
                      By: <strong>{hostel.profiles?.full_name || "Unknown"}</strong>
                      {hostel.profiles?.email && <> · {hostel.profiles.email}</>}
                    </p>
                    <p className="text-muted-foreground text-xs mt-1">Submitted: {new Date(hostel.created_at).toLocaleDateString()}</p>
                    <p className="text-muted-foreground text-xs capitalize">Gender: {hostel.gender}</p>

                    {amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {amenities.map(a => (
                          <Badge key={a} variant="secondary" className="text-[10px] capitalize">{a}</Badge>
                        ))}
                      </div>
                    )}

                    {hostel.description && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{hostel.description}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="lg:w-72 space-y-3">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Admin Notes</Label>
                      <Textarea
                        placeholder="Notes (required for rejection)..."
                        value={adminNotes[hostel.id] || ""}
                        onChange={e => setAdminNotes({ ...adminNotes, [hostel.id]: e.target.value })}
                        className="rounded-xl min-h-[80px] resize-none text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="accent" size="sm" className="gap-1.5 rounded-xl flex-1" onClick={() => handleApprove(hostel)} disabled={!!processing}>
                        {processing === hostel.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Approve
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1.5 rounded-xl flex-1 text-destructive hover:text-destructive" onClick={() => handleReject(hostel)} disabled={!!processing}>
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminHostelApprovals;
