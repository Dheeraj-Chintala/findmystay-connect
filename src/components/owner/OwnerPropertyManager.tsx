import { useState, useEffect } from "react";
import { Building2, Image, IndianRupee, Bed, Upload, Loader2, X, Plus, Trash2, Save, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface HostelWithRooms {
  id: string;
  hostel_name: string;
  location: string;
  city: string;
  price_min: number;
  price_max: number;
  verified_status: string;
  is_active: boolean;
  rooms: { id: string; sharing_type: string; price_per_month: number; total_beds: number; available_beds: number }[];
  images: { id: string; image_url: string; display_order: number | null }[];
}

const OwnerPropertyManager = () => {
  const { user } = useAuth();
  const [hostels, setHostels] = useState<HostelWithRooms[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [editRoom, setEditRoom] = useState<Record<string, any>>({});
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchHostels();
  }, [user]);

  const fetchHostels = async () => {
    const { data } = await supabase
      .from("hostels")
      .select("id, hostel_name, location, city, price_min, price_max, verified_status, is_active")
      .eq("owner_id", user!.id)
      .order("created_at", { ascending: false });

    if (data) {
      const enriched: HostelWithRooms[] = [];
      for (const h of data) {
        const [roomsRes, imagesRes] = await Promise.all([
          supabase.from("rooms").select("*").eq("hostel_id", h.id).order("sharing_type"),
          supabase.from("hostel_images").select("*").eq("hostel_id", h.id).order("display_order"),
        ]);
        enriched.push({ ...h, rooms: roomsRes.data || [], images: imagesRes.data || [] });
      }
      setHostels(enriched);
    }
    setLoading(false);
  };

  const handleAddRoom = async (hostelId: string) => {
    setSaving(hostelId);
    try {
      await supabase.from("rooms").insert({
        hostel_id: hostelId,
        sharing_type: "single",
        price_per_month: 5000,
        total_beds: 1,
        available_beds: 1,
      });
      toast.success("Room added");
      fetchHostels();
    } catch (err: any) { toast.error(err.message); }
    setSaving(null);
  };

  const handleUpdateRoom = async (roomId: string, updates: any) => {
    setSaving(roomId);
    try {
      await supabase.from("rooms").update(updates).eq("id", roomId);
      toast.success("Room updated");
      setEditRoom(prev => ({ ...prev, [roomId]: undefined }));
      fetchHostels();
    } catch (err: any) { toast.error(err.message); }
    setSaving(null);
  };

  const handleDeleteRoom = async (roomId: string) => {
    setSaving(roomId);
    try {
      await supabase.from("rooms").delete().eq("id", roomId);
      toast.success("Room removed");
      fetchHostels();
    } catch (err: any) { toast.error(err.message); }
    setSaving(null);
  };

  const handleUploadPhoto = async (hostelId: string, files: FileList) => {
    setUploading(hostelId);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const filePath = `${hostelId}/${Date.now()}-${i}.${file.name.split('.').pop()}`;
        const { error: uploadErr } = await supabase.storage.from("hostel-images").upload(filePath, file);
        if (!uploadErr) {
          const { data: publicUrl } = supabase.storage.from("hostel-images").getPublicUrl(filePath);
          await supabase.from("hostel_images").insert({ hostel_id: hostelId, image_url: publicUrl.publicUrl, display_order: i });
        }
      }
      toast.success("Photos uploaded");
      fetchHostels();
    } catch (err: any) { toast.error(err.message); }
    setUploading(null);
  };

  const handleDeletePhoto = async (imageId: string) => {
    await supabase.from("hostel_images").delete().eq("id", imageId);
    toast.success("Photo removed");
    fetchHostels();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (hostels.length === 0) {
    return (
      <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
        <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">No properties yet. Add your first listing!</p>
      </div>
    );
  }

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      verified: "bg-accent/10 text-accent",
      pending: "bg-muted text-muted-foreground",
      under_review: "bg-verified/10 text-verified",
      rejected: "bg-destructive/10 text-destructive",
    };
    return <Badge className={styles[status] || styles.pending}>{status.replace(/_/g, " ")}</Badge>;
  };

  return (
    <div className="space-y-4">
      {hostels.map((hostel, i) => (
        <motion.div
          key={hostel.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          className="bg-card rounded-2xl border border-border/50 shadow-card overflow-hidden"
        >
          {/* Header */}
          <button
            className="w-full p-5 flex items-center gap-4 text-left hover:bg-secondary/30 transition-colors"
            onClick={() => setExpandedId(expandedId === hostel.id ? null : hostel.id)}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="font-heading font-semibold text-sm">{hostel.hostel_name}</h3>
                {statusBadge(hostel.verified_status)}
              </div>
              <p className="text-muted-foreground text-xs">{hostel.location}, {hostel.city}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-heading font-bold text-sm text-primary">₹{hostel.price_min.toLocaleString()} - ₹{hostel.price_max.toLocaleString()}</p>
              <p className="text-muted-foreground text-xs">{hostel.rooms.length} room types · {hostel.images.length} photos</p>
            </div>
          </button>

          {/* Expanded */}
          {expandedId === hostel.id && (
            <div className="px-5 pb-5 space-y-5 border-t border-border/50 pt-4">
              {/* Photos */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-heading font-semibold text-xs flex items-center gap-1.5"><Image className="w-3.5 h-3.5 text-primary" /> Photos</h4>
                  <label className="cursor-pointer">
                    <Button variant="outline" size="sm" className="gap-1 rounded-xl text-xs" asChild>
                      <span>{uploading === hostel.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />} Upload</span>
                    </Button>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={e => e.target.files && handleUploadPhoto(hostel.id, e.target.files)} />
                  </label>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {hostel.images.map(img => (
                    <div key={img.id} className="relative shrink-0 w-24 h-20 rounded-xl overflow-hidden border border-border group">
                      <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => handleDeletePhoto(img.id)}
                        className="absolute top-1 right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3 text-destructive-foreground" />
                      </button>
                    </div>
                  ))}
                  {hostel.images.length === 0 && <p className="text-xs text-muted-foreground">No photos uploaded</p>}
                </div>
              </div>

              {/* Rooms */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-heading font-semibold text-xs flex items-center gap-1.5"><Bed className="w-3.5 h-3.5 text-primary" /> Rooms & Pricing</h4>
                  <Button variant="outline" size="sm" className="gap-1 rounded-xl text-xs" onClick={() => handleAddRoom(hostel.id)} disabled={saving === hostel.id}>
                    <Plus className="w-3 h-3" /> Add Room
                  </Button>
                </div>
                <div className="space-y-2">
                  {hostel.rooms.map(room => (
                    <div key={room.id} className="flex items-center gap-2 p-3 bg-secondary/30 rounded-xl">
                      {editRoom[room.id] ? (
                        <>
                          <Select value={editRoom[room.id].sharing_type} onValueChange={v => setEditRoom(prev => ({ ...prev, [room.id]: { ...prev[room.id], sharing_type: v } }))}>
                            <SelectTrigger className="h-8 w-24 text-xs rounded-lg"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="single">Single</SelectItem>
                              <SelectItem value="double">Double</SelectItem>
                              <SelectItem value="triple">Triple</SelectItem>
                              <SelectItem value="quad">Quad</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input type="number" className="h-8 w-20 text-xs rounded-lg" value={editRoom[room.id].price_per_month} onChange={e => setEditRoom(prev => ({ ...prev, [room.id]: { ...prev[room.id], price_per_month: e.target.value } }))} />
                          <Input type="number" className="h-8 w-14 text-xs rounded-lg" value={editRoom[room.id].available_beds} onChange={e => setEditRoom(prev => ({ ...prev, [room.id]: { ...prev[room.id], available_beds: e.target.value } }))} />
                          <Button size="sm" className="h-8 gap-1 rounded-lg text-xs" onClick={() => handleUpdateRoom(room.id, { sharing_type: editRoom[room.id].sharing_type, price_per_month: parseInt(editRoom[room.id].price_per_month), available_beds: parseInt(editRoom[room.id].available_beds) })} disabled={saving === room.id}>
                            {saving === room.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs" onClick={() => setEditRoom(prev => ({ ...prev, [room.id]: undefined }))}>
                            <X className="w-3 h-3" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Badge variant="secondary" className="capitalize text-xs">{room.sharing_type}</Badge>
                          <span className="text-xs font-heading font-bold text-primary">₹{room.price_per_month.toLocaleString()}/mo</span>
                          <span className="text-xs text-muted-foreground">{room.available_beds}/{room.total_beds} beds</span>
                          <div className="ml-auto flex gap-1">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setEditRoom(prev => ({ ...prev, [room.id]: { sharing_type: room.sharing_type, price_per_month: room.price_per_month.toString(), available_beds: room.available_beds.toString() } }))}>
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDeleteRoom(room.id)} disabled={saving === room.id}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                  {hostel.rooms.length === 0 && <p className="text-xs text-muted-foreground">No rooms configured</p>}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
};

export default OwnerPropertyManager;
