import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Package, Loader2, ShirtIcon, IndianRupee, TrendingUp,
  CheckCircle2, Truck, WashingMachine, CalendarIcon, Plus, Pencil, Trash2
} from "lucide-react";

const STATUS_OPTIONS = [
  { value: "order_placed", label: "Order Placed" },
  { value: "pickup_scheduled", label: "Pickup Scheduled" },
  { value: "in_progress", label: "In Progress" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const STATUS_COLORS: Record<string, string> = {
  order_placed: "bg-muted text-muted-foreground",
  pickup_scheduled: "bg-primary/10 text-primary",
  in_progress: "bg-accent/10 text-accent",
  out_for_delivery: "bg-warning/10 text-warning",
  delivered: "bg-success/10 text-success",
  cancelled: "bg-destructive/10 text-destructive",
};

const AdminLaundry = () => {
  const [tab, setTab] = useState("orders");
  const [orders, setOrders] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState<any>(null);
  const [newService, setNewService] = useState({ name: "", description: "", price: "" });
  const [showAddService, setShowAddService] = useState(false);

  useEffect(() => {
    fetchOrders();
    fetchServices();
    const channel = supabase
      .channel("admin-laundry")
      .on("postgres_changes", { event: "*", schema: "public", table: "laundry_orders" }, () => fetchOrders())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchOrders = async () => {
    const { data } = await supabase
      .from("laundry_orders")
      .select("*, laundry_order_items(*, laundry_services(name)), laundry_ratings(*), profiles!laundry_orders_user_id_fkey(full_name, email, phone)")
      .order("created_at", { ascending: false });
    setOrders(data || []);
    setLoading(false);
  };

  const fetchServices = async () => {
    const { data } = await supabase.from("laundry_services").select("*").order("name");
    setServices(data || []);
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    const updateData: any = { status };
    if (status === "delivered") updateData.delivery_time = new Date().toISOString();

    const { error } = await supabase.from("laundry_orders").update(updateData).eq("id", orderId);
    if (error) { toast.error("Failed to update status"); return; }
    toast.success(`Status updated to ${STATUS_OPTIONS.find(s => s.value === status)?.label}`);
    fetchOrders();
  };

  const handleAddService = async () => {
    if (!newService.name || !newService.price) { toast.error("Name and price are required"); return; }
    const { error } = await supabase.from("laundry_services").insert({
      name: newService.name,
      description: newService.description || null,
      price: parseFloat(newService.price),
    });
    if (error) { toast.error("Failed to add service"); return; }
    toast.success("Service added!");
    setNewService({ name: "", description: "", price: "" });
    setShowAddService(false);
    fetchServices();
  };

  const handleUpdateService = async (service: any) => {
    const { error } = await supabase.from("laundry_services").update({
      name: service.name,
      description: service.description,
      price: service.price,
      is_active: service.is_active,
    }).eq("id", service.id);
    if (error) { toast.error("Failed to update"); return; }
    toast.success("Service updated!");
    setEditingService(null);
    fetchServices();
  };

  const handleDeleteService = async (id: string) => {
    const { error } = await supabase.from("laundry_services").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Service deleted");
    fetchServices();
  };

  // Analytics
  const totalRevenue = orders.filter(o => o.status === "delivered").reduce((s, o) => s + Number(o.total_amount), 0);
  const pendingOrders = orders.filter(o => !["delivered", "cancelled"].includes(o.status)).length;
  const deliveredCount = orders.filter(o => o.status === "delivered").length;
  const avgRating = (() => {
    const ratings = orders.flatMap(o => o.laundry_ratings || []).map(r => r.rating);
    return ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : "N/A";
  })();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShirtIcon className="w-6 h-6 text-primary" />
        <div>
          <h2 className="font-heading font-bold text-xl">Laundry Management</h2>
          <p className="text-sm text-muted-foreground">Manage orders, pricing, and analytics</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Revenue", value: `₹${totalRevenue.toLocaleString()}`, icon: IndianRupee, color: "text-accent" },
          { label: "Pending", value: pendingOrders, icon: Package, color: "text-primary" },
          { label: "Delivered", value: deliveredCount, icon: CheckCircle2, color: "text-success" },
          { label: "Avg Rating", value: avgRating, icon: TrendingUp, color: "text-verified" },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="p-4 text-center">
              <stat.icon className={cn("w-5 h-5 mx-auto mb-2", stat.color)} />
              <p className="font-heading font-extrabold text-xl">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="pricing">Pricing & Services</TabsTrigger>
        </TabsList>

        {/* Orders */}
        <TabsContent value="orders" className="space-y-3 mt-4">
          {loading ? (
            <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
              <Package className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">No laundry orders yet</p>
            </div>
          ) : (
            orders.map(order => (
              <Card key={order.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-sm">{order.profiles?.full_name || "Unknown User"}</p>
                      <p className="text-xs text-muted-foreground">{order.profiles?.email} · {order.profiles?.phone}</p>
                      <p className="text-xs text-muted-foreground mt-1">#{order.id.slice(0, 8)} · {format(new Date(order.created_at), "MMM d, yyyy h:mm a")}</p>
                    </div>
                    <Badge className={cn("text-[10px]", STATUS_COLORS[order.status])}>
                      {STATUS_OPTIONS.find(s => s.value === order.status)?.label}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <p>Items: {order.laundry_order_items?.map((i: any) => `${i.laundry_services?.name} ×${i.quantity}`).join(", ")}</p>
                    {order.pickup_time && <p>Pickup: {format(new Date(order.pickup_time), "PPP p")}</p>}
                    {order.notes && <p>Notes: {order.notes}</p>}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-heading font-bold text-primary">₹{order.total_amount}</span>
                    {!["delivered", "cancelled"].includes(order.status) && (
                      <Select value={order.status} onValueChange={(v) => updateOrderStatus(order.id, v)}>
                        <SelectTrigger className="w-44 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map(s => (
                            <SelectItem key={s.value} value={s.value} className="text-xs">{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Pricing */}
        <TabsContent value="pricing" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button size="sm" className="rounded-lg gap-1" onClick={() => setShowAddService(!showAddService)}>
              <Plus className="w-3 h-3" /> Add Service
            </Button>
          </div>

          {showAddService && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Name</Label>
                    <Input placeholder="Service name" value={newService.name} onChange={e => setNewService(p => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Description</Label>
                    <Input placeholder="Short description" value={newService.description} onChange={e => setNewService(p => ({ ...p, description: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Price (₹)</Label>
                    <Input type="number" placeholder="0" value={newService.price} onChange={e => setNewService(p => ({ ...p, price: e.target.value }))} />
                  </div>
                </div>
                <Button size="sm" onClick={handleAddService} className="rounded-lg">Save</Button>
              </CardContent>
            </Card>
          )}

          {services.map(svc => (
            <Card key={svc.id}>
              <CardContent className="p-4">
                {editingService?.id === svc.id ? (
                  <div className="space-y-3">
                    <div className="grid sm:grid-cols-3 gap-3">
                      <Input value={editingService.name} onChange={e => setEditingService((p: any) => ({ ...p, name: e.target.value }))} />
                      <Input value={editingService.description || ""} onChange={e => setEditingService((p: any) => ({ ...p, description: e.target.value }))} />
                      <Input type="number" value={editingService.price} onChange={e => setEditingService((p: any) => ({ ...p, price: parseFloat(e.target.value) }))} />
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch checked={editingService.is_active} onCheckedChange={v => setEditingService((p: any) => ({ ...p, is_active: v }))} />
                      <span className="text-xs text-muted-foreground">{editingService.is_active ? "Active" : "Inactive"}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleUpdateService(editingService)} className="rounded-lg">Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingService(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{svc.name}</p>
                        {!svc.is_active && <Badge variant="outline" className="text-[9px]">Inactive</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">{svc.description}</p>
                      <p className="text-sm font-bold text-primary mt-1">₹{svc.price}/item</p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingService({ ...svc })}>
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDeleteService(svc.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminLaundry;
