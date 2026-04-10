import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  WashingMachine, Plus, Pencil, Trash2, Loader2, IndianRupee,
} from "lucide-react";

interface Hostel {
  id: string;
  hostel_name: string;
}

interface LaundryService {
  id: string;
  name: string;
  description: string | null;
  price: number;
  is_active: boolean;
  hostel_id: string | null;
  created_at: string;
}

const OwnerLaundryServices = () => {
  const { user } = useAuth();
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [services, setServices] = useState<LaundryService[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState<LaundryService | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newService, setNewService] = useState({ name: "", description: "", price: "", hostelId: "" });

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    const { data: ownerHostels, error: hErr } = await supabase
      .from("hostels")
      .select("id, hostel_name")
      .eq("owner_id", user!.id);

    if (hErr) { toast.error(hErr.message); setLoading(false); return; }
    if (!ownerHostels?.length) { setHostels([]); setServices([]); setLoading(false); return; }

    setHostels(ownerHostels);

    const hostelIds = ownerHostels.map(h => h.id);
    const { data: svcData, error: sErr } = await supabase
      .from("laundry_services")
      .select("*")
      .in("hostel_id", hostelIds)
      .order("name");

    if (sErr) { toast.error(sErr.message); setLoading(false); return; }
    setServices(svcData || []);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newService.name.trim() || !newService.price || !newService.hostelId) {
      toast.error("Name, price, and hostel are required");
      return;
    }
    const { error } = await supabase.from("laundry_services").insert({
      name: newService.name.trim(),
      description: newService.description.trim() || null,
      price: parseFloat(newService.price),
      hostel_id: newService.hostelId,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Service added!");
    setNewService({ name: "", description: "", price: "", hostelId: hostels.length === 1 ? hostels[0].id : "" });
    setShowAdd(false);
    loadData();
  };

  const handleUpdate = async (svc: LaundryService) => {
    const { error } = await supabase
      .from("laundry_services")
      .update({ name: svc.name, description: svc.description, price: svc.price, is_active: svc.is_active })
      .eq("id", svc.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Service updated!");
    setEditingService(null);
    loadData();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("laundry_services").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Service deleted");
    loadData();
  };

  const hostelName = (id: string | null) => hostels.find(h => h.id === id)?.hostel_name || "Unknown";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (hostels.length === 0) {
    return (
      <div className="text-center py-16 bg-card rounded-2xl border border-border/50">
        <WashingMachine className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <h3 className="font-heading font-semibold text-lg mb-1">No Properties</h3>
        <p className="text-sm text-muted-foreground">Add a property first to manage laundry services.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-xl mb-1 flex items-center gap-2">
            <WashingMachine className="w-5 h-5 text-primary" /> Laundry Services
          </h2>
          <p className="text-muted-foreground text-sm">Manage services available to your hostel members</p>
        </div>
        <Button size="sm" className="rounded-xl gap-1.5" onClick={() => setShowAdd(!showAdd)}>
          <Plus className="w-3.5 h-3.5" /> Add Service
        </Button>
      </div>

      {showAdd && (
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Hostel *</Label>
                <Select value={newService.hostelId} onValueChange={v => setNewService(p => ({ ...p, hostelId: v }))}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select hostel" />
                  </SelectTrigger>
                  <SelectContent>
                    {hostels.map(h => (
                      <SelectItem key={h.id} value={h.id}>{h.hostel_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Service Name *</Label>
                <Input placeholder="e.g. Wash & Fold" className="rounded-xl" value={newService.name} onChange={e => setNewService(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Description</Label>
                <Input placeholder="Short description" className="rounded-xl" value={newService.description} onChange={e => setNewService(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Price per item (Rs) *</Label>
                <Input type="number" placeholder="0" className="rounded-xl" value={newService.price} onChange={e => setNewService(p => ({ ...p, price: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="rounded-xl" onClick={handleAdd}>Save Service</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {services.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border/50">
          <WashingMachine className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-heading font-semibold text-lg mb-1">No Services Yet</h3>
          <p className="text-sm text-muted-foreground">Add laundry services so your hostel members can book them.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {services.map((svc, i) => (
            <motion.div
              key={svc.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Card>
                <CardContent className="p-4">
                  {editingService?.id === svc.id ? (
                    <div className="space-y-3">
                      <div className="grid sm:grid-cols-3 gap-3">
                        <Input
                          value={editingService.name}
                          onChange={e => setEditingService(p => p ? { ...p, name: e.target.value } : p)}
                          className="rounded-xl"
                        />
                        <Input
                          value={editingService.description || ""}
                          onChange={e => setEditingService(p => p ? { ...p, description: e.target.value } : p)}
                          className="rounded-xl"
                        />
                        <Input
                          type="number"
                          value={editingService.price}
                          onChange={e => setEditingService(p => p ? { ...p, price: parseFloat(e.target.value) || 0 } : p)}
                          className="rounded-xl"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={editingService.is_active}
                          onCheckedChange={v => setEditingService(p => p ? { ...p, is_active: v } : p)}
                        />
                        <span className="text-xs text-muted-foreground">{editingService.is_active ? "Active" : "Inactive"}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="rounded-xl" onClick={() => handleUpdate(editingService)}>Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingService(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-heading font-semibold text-sm">{svc.name}</p>
                          {!svc.is_active && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Inactive</span>
                          )}
                        </div>
                        {svc.description && <p className="text-xs text-muted-foreground mt-0.5">{svc.description}</p>}
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-sm font-bold text-primary flex items-center gap-0.5">
                            <IndianRupee className="w-3.5 h-3.5" />{svc.price}/item
                          </span>
                          <span className="text-[10px] text-muted-foreground">{hostelName(svc.hostel_id)}</span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingService({ ...svc })}>
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(svc.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OwnerLaundryServices;
