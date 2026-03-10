import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShirtIcon, CalendarIcon, Clock, Package, Star,
  Plus, Minus, Loader2, CheckCircle2, Truck, WashingMachine
} from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  order_placed: { label: "Order Placed", color: "bg-muted text-muted-foreground", icon: Package },
  pickup_scheduled: { label: "Pickup Scheduled", color: "bg-primary/10 text-primary", icon: CalendarIcon },
  in_progress: { label: "In Progress", color: "bg-accent/10 text-accent", icon: WashingMachine },
  out_for_delivery: { label: "Out for Delivery", color: "bg-warning/10 text-warning", icon: Truck },
  delivered: { label: "Delivered", color: "bg-success/10 text-success", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "bg-destructive/10 text-destructive", icon: Package },
};

const UserLaundry = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState("book");
  const [services, setServices] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [pickupDate, setPickupDate] = useState<Date>();
  const [pickupTime, setPickupTime] = useState("10:00");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [ratingOrder, setRatingOrder] = useState<string | null>(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState("");

  useEffect(() => {
    if (user) {
      fetchServices();
      fetchOrders();
      subscribeToOrders();
    }
  }, [user]);

  const fetchServices = async () => {
    const { data } = await supabase
      .from("laundry_services")
      .select("*")
      .eq("is_active", true)
      .order("name");
    setServices(data || []);
  };

  const fetchOrders = async () => {
    const { data } = await supabase
      .from("laundry_orders")
      .select("*, laundry_order_items(*, laundry_services(name)), laundry_ratings(*)")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    setOrders(data || []);
    setLoading(false);
  };

  const subscribeToOrders = () => {
    const channel = supabase
      .channel("laundry-orders-user")
      .on("postgres_changes", { event: "*", schema: "public", table: "laundry_orders", filter: `user_id=eq.${user!.id}` }, () => {
        fetchOrders();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  };

  const updateCart = (serviceId: string, delta: number) => {
    setCart(prev => {
      const current = prev[serviceId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const { [serviceId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [serviceId]: next };
    });
  };

  const cartTotal = Object.entries(cart).reduce((sum, [id, qty]) => {
    const svc = services.find(s => s.id === id);
    return sum + (svc?.price || 0) * qty;
  }, 0);

  const cartCount = Object.values(cart).reduce((s, q) => s + q, 0);

  const handleSubmitOrder = async () => {
    if (cartCount === 0) { toast.error("Add at least one service"); return; }
    if (!pickupDate) { toast.error("Select a pickup date"); return; }

    setSubmitting(true);
    try {
      const pickupDateTime = new Date(pickupDate);
      const [h, m] = pickupTime.split(":").map(Number);
      pickupDateTime.setHours(h, m, 0, 0);

      const { data: order, error } = await supabase
        .from("laundry_orders")
        .insert({
          user_id: user!.id,
          total_amount: cartTotal,
          pickup_time: pickupDateTime.toISOString(),
          notes: notes || null,
          status: "order_placed",
        })
        .select()
        .single();

      if (error) throw error;

      const items = Object.entries(cart).map(([serviceId, quantity]) => ({
        order_id: order.id,
        service_id: serviceId,
        quantity,
        price: (services.find(s => s.id === serviceId)?.price || 0) * quantity,
      }));

      const { error: itemsError } = await supabase.from("laundry_order_items").insert(items);
      if (itemsError) throw itemsError;

      toast.success("Laundry order placed!");
      setCart({});
      setPickupDate(undefined);
      setPickupTime("10:00");
      setNotes("");
      setTab("orders");
      fetchOrders();
    } catch (err: any) {
      toast.error(err.message || "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRate = async (orderId: string) => {
    try {
      const { error } = await supabase.from("laundry_ratings").insert({
        order_id: orderId,
        user_id: user!.id,
        rating: ratingValue,
        comment: ratingComment || null,
      });
      if (error) throw error;
      toast.success("Thanks for your rating!");
      setRatingOrder(null);
      setRatingValue(5);
      setRatingComment("");
      fetchOrders();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit rating");
    }
  };

  const activeOrders = orders.filter(o => !["delivered", "cancelled"].includes(o.status));
  const pastOrders = orders.filter(o => ["delivered", "cancelled"].includes(o.status));

  return (
    <div className="space-y-6">
      <div className="bg-gradient-hero rounded-2xl p-6 text-primary-foreground">
        <div className="flex items-center gap-2 mb-1">
          <ShirtIcon className="w-5 h-5" />
          <span className="text-sm opacity-80">Laundry Services</span>
        </div>
        <h2 className="font-heading font-bold text-2xl">Fresh & Clean</h2>
        <p className="text-sm opacity-70">Book, track, and rate laundry services</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="book">Book</TabsTrigger>
          <TabsTrigger value="orders">
            Active {activeOrders.length > 0 && <Badge className="ml-1 bg-primary text-primary-foreground text-[10px] px-1.5">{activeOrders.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Book Tab */}
        <TabsContent value="book" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-heading">Select Services</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {services.map(svc => (
                <div key={svc.id} className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/30">
                  <div>
                    <p className="font-semibold text-sm">{svc.name}</p>
                    <p className="text-xs text-muted-foreground">{svc.description}</p>
                    <p className="text-sm font-bold text-primary mt-1">₹{svc.price}<span className="text-xs font-normal text-muted-foreground">/item</span></p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="outline" className="h-7 w-7 rounded-lg" onClick={() => updateCart(svc.id, -1)} disabled={!cart[svc.id]}>
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-6 text-center text-sm font-semibold">{cart[svc.id] || 0}</span>
                    <Button size="icon" variant="outline" className="h-7 w-7 rounded-lg" onClick={() => updateCart(svc.id, 1)}>
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {cartCount > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-heading">Schedule Pickup</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Pickup Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-full justify-start text-left", !pickupDate && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {pickupDate ? format(pickupDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={pickupDate} onSelect={setPickupDate} disabled={(d) => d < new Date()} className="p-3 pointer-events-auto" />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label>Pickup Time</Label>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <Input type="time" value={pickupTime} onChange={e => setPickupTime(e.target.value)} />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Notes (optional)</Label>
                    <Textarea placeholder="Special instructions..." value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/20">
                    <span className="text-sm font-medium">{cartCount} items</span>
                    <span className="font-heading font-bold text-lg text-primary">₹{cartTotal}</span>
                  </div>
                  <Button onClick={handleSubmitOrder} disabled={submitting} className="w-full rounded-xl">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Package className="w-4 h-4 mr-2" />}
                    Place Order
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </TabsContent>

        {/* Active Orders Tab */}
        <TabsContent value="orders" className="space-y-4 mt-4">
          {loading ? (
            <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div>
          ) : activeOrders.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
              <Package className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">No active orders</p>
            </div>
          ) : (
            <AnimatePresence>
              {activeOrders.map(order => {
                const config = STATUS_CONFIG[order.status];
                const Icon = config?.icon || Package;
                return (
                  <motion.div key={order.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <Card>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">#{order.id.slice(0, 8)}</span>
                          <Badge className={cn("text-[10px]", config?.color)}><Icon className="w-3 h-3 mr-1" />{config?.label}</Badge>
                        </div>
                        {/* Order progress */}
                        <div className="flex gap-1">
                          {["order_placed", "pickup_scheduled", "in_progress", "out_for_delivery", "delivered"].map((s, i) => {
                            const statusOrder = ["order_placed", "pickup_scheduled", "in_progress", "out_for_delivery", "delivered"];
                            const currentIdx = statusOrder.indexOf(order.status);
                            return <div key={s} className={cn("h-1.5 flex-1 rounded-full", i <= currentIdx ? "bg-primary" : "bg-border")} />;
                          })}
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          {order.pickup_time && <p>Pickup: {format(new Date(order.pickup_time), "PPP p")}</p>}
                          <p>Items: {order.laundry_order_items?.map((i: any) => `${i.laundry_services?.name} ×${i.quantity}`).join(", ")}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-heading font-bold text-primary">₹{order.total_amount}</span>
                          <span className="text-[10px] text-muted-foreground">{format(new Date(order.created_at), "MMM d, yyyy")}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4 mt-4">
          {pastOrders.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
              <Clock className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">No past orders yet</p>
            </div>
          ) : (
            pastOrders.map(order => {
              const config = STATUS_CONFIG[order.status];
              const hasRating = order.laundry_ratings?.length > 0;
              return (
                <Card key={order.id}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">#{order.id.slice(0, 8)}</span>
                      <Badge className={cn("text-[10px]", config?.color)}>{config?.label}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <p>{order.laundry_order_items?.map((i: any) => `${i.laundry_services?.name} ×${i.quantity}`).join(", ")}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-heading font-bold text-primary">₹{order.total_amount}</span>
                      <span className="text-[10px] text-muted-foreground">{format(new Date(order.created_at), "MMM d, yyyy")}</span>
                    </div>
                    {order.status === "delivered" && !hasRating && (
                      ratingOrder === order.id ? (
                        <div className="space-y-2 p-3 bg-muted/30 rounded-xl">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(v => (
                              <button key={v} onClick={() => setRatingValue(v)}>
                                <Star className={cn("w-5 h-5", v <= ratingValue ? "fill-verified text-verified" : "text-border")} />
                              </button>
                            ))}
                          </div>
                          <Textarea placeholder="Comment (optional)..." value={ratingComment} onChange={e => setRatingComment(e.target.value)} rows={2} />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleRate(order.id)} className="rounded-lg">Submit</Button>
                            <Button size="sm" variant="ghost" onClick={() => setRatingOrder(null)}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" className="rounded-lg gap-1" onClick={() => setRatingOrder(order.id)}>
                          <Star className="w-3 h-3" /> Rate Service
                        </Button>
                      )
                    )}
                    {hasRating && (
                      <div className="flex items-center gap-1 text-xs">
                        {[1, 2, 3, 4, 5].map(v => (
                          <Star key={v} className={cn("w-3 h-3", v <= order.laundry_ratings[0].rating ? "fill-verified text-verified" : "text-border")} />
                        ))}
                        {order.laundry_ratings[0].comment && <span className="ml-2 text-muted-foreground">"{order.laundry_ratings[0].comment}"</span>}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserLaundry;
