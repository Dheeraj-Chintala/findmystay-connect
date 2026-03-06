import { useState, useEffect } from "react";
import { Calendar, Clock, CheckCircle2, XCircle, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Pending", color: "bg-warning/10 text-warning", icon: Clock },
  approved: { label: "Approved", color: "bg-accent/10 text-accent", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "bg-destructive/10 text-destructive", icon: XCircle },
  cancelled: { label: "Cancelled", color: "bg-muted text-muted-foreground", icon: XCircle },
  completed: { label: "Completed", color: "bg-primary/10 text-primary", icon: CheckCircle2 },
};

const UserBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchBookings();
  }, [user]);

  const fetchBookings = async () => {
    const { data } = await supabase
      .from("bookings")
      .select("*, hostels(hostel_name, city, location)")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    setBookings(data || []);
    setLoading(false);
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading font-bold text-xl mb-1 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" /> My Bookings
        </h2>
        <p className="text-muted-foreground text-sm">{bookings.length} booking requests</p>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border/50">
          <Calendar className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">No booking requests yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking, i) => {
            const cfg = statusConfig[booking.status] || statusConfig.pending;
            const StatusIcon = cfg.icon;
            return (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-card rounded-2xl border border-border/50 shadow-card p-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-heading font-semibold text-sm mb-1">
                      {(booking.hostels as any)?.hostel_name || "Unknown Hostel"}
                    </h4>
                    <p className="text-muted-foreground text-xs mb-1">
                      {(booking.hostels as any)?.location}, {(booking.hostels as any)?.city}
                    </p>
                    {booking.move_in_date && (
                      <p className="text-xs text-muted-foreground">Move-in: {new Date(booking.move_in_date).toLocaleDateString()}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Requested: {new Date(booking.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge className={`${cfg.color} border-0 gap-1`}>
                    <StatusIcon className="w-3 h-3" /> {cfg.label}
                  </Badge>
                </div>
                {booking.message && (
                  <p className="text-xs text-muted-foreground mt-3 bg-secondary/50 rounded-xl p-3">{booking.message}</p>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UserBookings;
