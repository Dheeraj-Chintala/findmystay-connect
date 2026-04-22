import { useState, useEffect } from "react";
import { Building2, Bed, Loader2, Plus, Trash2, Save, Edit2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { toast } from "sonner";
import MediaGalleryManager from "./MediaGalleryManager";

interface MediaItem {
  id: string;
  url: string;
  uploaded_by: string;
  display_order: number | null;
}

interface RoomTypeRow {
  id: string;
  type: string;
  price: number;
  total_beds: number;
  occupied_beds: number;
  available_beds: number;
}

interface HostelWithRooms {
  id: string;
  hostel_name: string;
  location: string;
  city: string;
  price_min: number;
  price_max: number;
  verified_status: string;
  is_active: boolean;
  room_types: RoomTypeRow[];
  images: MediaItem[];
  videos: MediaItem[];
}

const OwnerPropertyManager = () => {
  const { user } = useAuth();
  const [hostels, setHostels] = useState<HostelWithRooms[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [editRoom, setEditRoom] = useState<Record<string, any>>({});

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
        const [roomsRes, imagesRes, videosRes] = await Promise.all([
          supabase.from("room_types").select("*").eq("property_id", h.id).order("type"),
          supabase.from("hostel_images").select("*").eq("hostel_id", h.id).order("display_order"),
          (supabase.from("hostel_videos") as any).select("*").eq("hostel_id", h.id).order("display_order"),
        ]);
        const images = (imagesRes.data || []).map((img: any) => ({ id: img.id, url: img.image_url, uploaded_by: img.uploaded_by || "owner", display_order: img.display_order }));
        const videos = (videosRes.data || []).map((vid: any) => ({ id: vid.id, url: vid.video_url, uploaded_by: vid.uploaded_by || "owner", display_order: vid.display_order }));
        enriched.push({ ...h, room_types: roomsRes.data || [], images, videos });
      }
      setHostels(enriched);
    }
    setLoading(false);
  };

  const handleAddRoom = async (hostelId: string) => {
    setSaving(hostelId);
    try {
      await supabase.from("room_types").insert({
        property_id: hostelId,
        type: "single",
        price: 5000,
        total_beds: 1,
        occupied_beds: 0,
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
      await supabase.from("room_types").update(updates).eq("id", roomId);
      toast.success("Room updated");
      setEditRoom(prev => ({ ...prev, [roomId]: undefined }));
      fetchHostels();
    } catch (err: any) { toast.error(err.message); }
    setSaving(null);
  };

  const handleDeleteRoom = async (roomId: string) => {
    setSaving(roomId);
    try {
      await supabase.from("room_types").delete().eq("id", roomId);
      toast.success("Room removed");
      fetchHostels();
    } catch (err: any) { toast.error(err.message); }
    setSaving(null);
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
      <div className="text-center py-20 bg-card rounded-2xl border border-border/50">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-8 h-8 text-primary" />
        </div>
        <h3 className="font-heading font-bold text-xl mb-2">Add Your First Property</h3>
        <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
          Get started by adding your hostel or PG. Once submitted, our admin team will review and approve it.
          After approval, your property will be visible to thousands of users.
        </p>
        <p className="text-xs text-muted-foreground">
          Click the <strong>"+ Add Property"</strong> button in the top-right corner to begin.
        </p>
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
      {hostels.map((hostel, i) => {
        const totalBeds = hostel.room_types.reduce((sum, room) => sum + (room.total_beds || 0), 0);
        const availableBeds = hostel.room_types.reduce((sum, room) => sum + (room.available_beds || 0), 0);
        const occupiedBeds = hostel.room_types.reduce((sum, room) => sum + (room.occupied_beds || 0), 0);

        return (
          <motion.div
            key={hostel.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-card rounded-2xl border border-border/50 shadow-card overflow-hidden"
          >
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
                {hostel.verified_status === "pending" && (
                  <p className="text-amber-600 text-xs mt-1 font-medium">Awaiting admin approval.</p>
                )}
              </div>
              <div className="text-right shrink-0 flex flex-col items-end gap-2">
                <p className="font-heading font-bold text-sm text-primary">₹{hostel.price_min.toLocaleString()} - ₹{hostel.price_max.toLocaleString()}</p>
                <div className="text-muted-foreground text-xs text-right">
                  <p>{hostel.room_types.length} room types · {hostel.images.length} photos · {hostel.videos.length} videos</p>
                  <p>Total beds: {totalBeds} · Available: {availableBeds} · Occupied: {occupiedBeds}</p>
                </div>
              </div>
            </button>

            {expandedId === hostel.id && (
              <div className="px-5 pb-5 space-y-5 border-t border-border/50 pt-4">
                <MediaGalleryManager
                  hostelId={hostel.id}
                  images={hostel.images}
                  videos={hostel.videos}
                  onRefresh={fetchHostels}
                />

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-heading font-semibold text-xs flex items-center gap-1.5"><Bed className="w-3.5 h-3.5 text-primary" /> Room & Bed Management</h4>
                    <Button variant="outline" size="sm" className="gap-1 rounded-xl text-xs" onClick={() => handleAddRoom(hostel.id)} disabled={saving === hostel.id}>
                      <Plus className="w-3 h-3" /> Add Room
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <div className="grid grid-cols-12 gap-2 text-[10px] text-muted-foreground uppercase tracking-wide px-2">
                      <span className="col-span-2">Room Type</span>
                      <span className="col-span-2">Total Beds</span>
                      <span className="col-span-2">Occupied</span>
                      <span className="col-span-2">Available</span>
                      <span className="col-span-2">Price</span>
                      <span className="col-span-2 text-right">Actions</span>
                    </div>
                    {hostel.room_types.map((room) => (
                      <div key={room.id} className="grid grid-cols-12 gap-2 items-center p-3 bg-secondary/30 rounded-xl">
                        {editRoom[room.id] ? (
                          <>
                            <Select value={editRoom[room.id].type} onValueChange={v => setEditRoom(prev => ({ ...prev, [room.id]: { ...prev[room.id], type: v } }))}>
                              <SelectTrigger className="h-8 col-span-2 text-xs rounded-lg"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="single">Single</SelectItem>
                                <SelectItem value="double">Double</SelectItem>
                                <SelectItem value="triple">Triple</SelectItem>
                                <SelectItem value="4-sharing">4-sharing</SelectItem>
                                <SelectItem value="6-sharing">6-sharing</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input type="number" className="h-8 col-span-2 text-xs rounded-lg" value={editRoom[room.id].total_beds} onChange={e => setEditRoom(prev => ({ ...prev, [room.id]: { ...prev[room.id], total_beds: e.target.value } }))} />
                            <Input type="number" className="h-8 col-span-2 text-xs rounded-lg" value={editRoom[room.id].occupied_beds} onChange={e => setEditRoom(prev => ({ ...prev, [room.id]: { ...prev[room.id], occupied_beds: e.target.value } }))} />
                            <div className="col-span-2 text-xs text-muted-foreground px-2">
                              {Math.max(parseInt(editRoom[room.id].total_beds || "0", 10) - parseInt(editRoom[room.id].occupied_beds || "0", 10), 0)}
                            </div>
                            <Input type="number" className="h-8 col-span-2 text-xs rounded-lg" value={editRoom[room.id].price} onChange={e => setEditRoom(prev => ({ ...prev, [room.id]: { ...prev[room.id], price: e.target.value } }))} />
                            <Button size="sm" className="h-8 gap-1 rounded-lg text-xs col-span-1 justify-self-end" onClick={() => {
                              const total = parseInt(editRoom[room.id].total_beds, 10) || 0;
                              const occupied = parseInt(editRoom[room.id].occupied_beds, 10) || 0;
                              if (occupied < 0 || occupied > total || total <= 0) {
                                toast.error("Occupied beds must be between 0 and total beds.");
                                return;
                              }
                              handleUpdateRoom(room.id, {
                                type: editRoom[room.id].type,
                                price: parseInt(editRoom[room.id].price, 10),
                                total_beds: total,
                                occupied_beds: occupied,
                                available_beds: total - occupied,
                              });
                            }} disabled={saving === room.id}>
                              {saving === room.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs col-span-1" onClick={() => setEditRoom(prev => ({ ...prev, [room.id]: undefined }))}>
                              <X className="w-3 h-3" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Badge variant="secondary" className="capitalize text-xs col-span-2">{room.type}</Badge>
                            <span className="text-xs col-span-2">{room.total_beds}</span>
                            <span className="text-xs col-span-2">{room.occupied_beds}</span>
                            <span className="text-xs col-span-2">{room.available_beds}</span>
                            <span className="text-xs font-heading font-bold text-primary col-span-2">₹{room.price.toLocaleString()}/mo</span>
                            <div className="ml-auto flex gap-1 col-span-2 justify-end">
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setEditRoom(prev => ({ ...prev, [room.id]: { type: room.type, price: room.price.toString(), total_beds: room.total_beds.toString(), occupied_beds: room.occupied_beds.toString() } }))}>
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
                    {hostel.room_types.length === 0 && <p className="text-xs text-muted-foreground">No room types configured</p>}
                  </div>
                  {hostel.room_types.length > 0 && (
                    <div className="mt-3 rounded-xl border border-border/50 bg-card p-3">
                      <p className="text-xs font-medium mb-2">Room Availability Summary</p>
                      <div className="grid sm:grid-cols-3 gap-2 text-xs">
                        <div className="rounded-lg bg-secondary/50 p-2">
                          <p className="text-muted-foreground">Total Beds</p>
                          <p className="font-heading font-bold">{totalBeds}</p>
                        </div>
                        <div className="rounded-lg bg-accent/10 p-2">
                          <p className="text-muted-foreground">Available Beds</p>
                          <p className="font-heading font-bold text-accent">{availableBeds}</p>
                        </div>
                        <div className="rounded-lg bg-destructive/10 p-2">
                          <p className="text-muted-foreground">Occupied Beds</p>
                          <p className="font-heading font-bold text-destructive">{occupiedBeds}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

export default OwnerPropertyManager;
