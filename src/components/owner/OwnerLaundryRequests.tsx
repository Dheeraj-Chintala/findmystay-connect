import { useState, useEffect } from "react";
import { ShirtIcon, Loader2, Package, Clock, Truck, WashingMachine, CheckCircle2, CalendarIcon, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  order_placed: { label: "Order Placed", color: "bg-muted text-muted-foreground", icon: Package },
  pickup_scheduled: { label: "Pickup Scheduled", color: "bg-primary/10 text-primary", icon: CalendarIcon },
  in_progress: { label: "In Progress", color: "bg-accent/10 text-accent", icon: WashingMachine },
  out_for_delivery: { label: "Out for Delivery", color: "bg-warning/10 text-warning", icon: Truck },
  delivered: { label: "Delivered", color: "bg-success/10 text-success", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "bg-destructive/10 text-destructive", icon: Package },
};

const NEXT_STATUS: Record<string, string> = {
  order_placed: "pickup_scheduled",
  pickup_scheduled: "in_progress",
  in_progress: "out_for_delivery",
  out_for_delivery: "delivered",
};

interface LaundryOrder {
  id: string;
  user_id: string;
  hostel_id: string;
  total_amount: number;
  status: string;
  pickup_time: string | null;
  notes: string | null;
  created_at: string;
  laundry_order_items: { quantity: number; price: number; laundry_services: { name: string } | null }[];
  profiles: { full_name: string; email: string | null; phone: string | null } | null;
}

const OwnerLaundryRequests = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<LaundryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("active");

  useEffect(() => {
    if (user) {
      fetchOrders();
      const cleanup = subscribeToOrders();
      return cleanup;
    }
  }, [user]);

  const fetchOrders = async () => {
    const { data: hostels } = await supabase
      .from("hostels")
      .select("id")
      .eq("owner_id", user!.id);

    if (!hostels?.length) {
      setLoading(false);
      return;
    }

    const hostelIds = hostels.map(h => h.id);

    const { data } = await supabase
      .from("laundry_orders")
      .select("*, laundry_order_items(quantity, price, laundry_services(name)), profiles!laundry_orders_user_id_fkey(full_name, email, phone)")
      .in("hostel_id", hostelIds)
      .order("created_at", { ascending: false });

    setOrders((data || []) as any);
    setLoading(false);
  };

  const subscribeToOrders = () => {
    const channel = supabase
      .channel("owner-laundry-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "laundry_orders" }, () => {
        fetchOrders();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    setProcessing(orderId);
    try {
      const { error } = await supabase
        .from("laundry_orders")
        .update({ status: newStatus })
        .eq("id", orderId);
      if (error) throw error;
      toast.success(`Order status updated to ${STATUS_CONFIG[newStatus]?.label || newStatus}`);
      fetchOrders();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const activeStatuses = ["order_placed", "pickup_scheduled", "in_progress", "out_for_delivery"];
  const filteredOrders = filter === "active"
    ? orders.filter(o => activeStatuses.includes(o.status))
    : orders.filter(o => !activeStatuses.includes(o.status));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-xl mb-1 flex items-center gap-2">
            <ShirtIcon className="w-5 h-5 text-primary" /> Laundry Requests
          </h2>
          <p className="text-muted-foreground text-sm">Manage laundry orders from hostel members</p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[140px] rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border/50">
          <ShirtIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-heading font-semibold text-lg mb-1">No {filter} orders</h3>
          <p className="text-sm text-muted-foreground">
            {filter === "active" ? "No pending laundry orders at the moment." : "No completed orders yet."}
          </p>
        </div>
      ) : (
        <AnimatePresence>
          <div className="space-y-3">
            {filteredOrders.map((order, i) => {
              const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.order_placed;
              const Icon = config.icon;
              const nextStatus = NEXT_STATUS[order.status];
              const profile = order.profiles;

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Card>
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-heading font-semibold text-sm">{profile?.full_name || "Unknown User"}</p>
                            <p className="text-xs text-muted-foreground">{profile?.email || profile?.phone || "No contact"}</p>
                          </div>
                        </div>
                        <Badge className={cn("text-[10px]", config.color)}>
                          <Icon className="w-3 h-3 mr-1" />{config.label}
                        </Badge>
                      </div>

                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>Order #{order.id.slice(0, 8)} · {format(new Date(order.created_at), "MMM d, yyyy")}</p>
                        {order.pickup_time && <p>Pickup: {format(new Date(order.pickup_time), "PPP p")}</p>}
                        <p>Items: {order.laundry_order_items?.map(i => `${i.laundry_services?.name || "Service"} ×${i.quantity}`).join(", ")}</p>
                        {order.notes && <p className="italic">Notes: {order.notes}</p>}
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <span className="font-heading font-bold text-primary">₹{order.total_amount}</span>
                        {nextStatus && (
                          <Button
                            size="sm"
                            className="rounded-xl gap-1.5"
                            disabled={processing === order.id}
                            onClick={() => updateStatus(order.id, nextStatus)}
                          >
                            {processing === order.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <>{(() => { const NextIcon = STATUS_CONFIG[nextStatus]?.icon; return NextIcon ? <NextIcon className="w-3.5 h-3.5" /> : null; })()} Mark as {STATUS_CONFIG[nextStatus]?.label}</>
                            )}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default OwnerLaundryRequests;
