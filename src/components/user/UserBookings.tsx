import { useState, useEffect } from "react";
import { Calendar, Clock, CheckCircle2, XCircle, Phone, Mail, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { toast } from "sonner";

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
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (user) fetchBookings();
  }, [user]);

  const fetchBookings = async () => {
    if (!user) { setLoading(false); return; }
    const { data, error } = await supabase
      .from("bookings")
      .select("*, hostels(hostel_name, city, location, contact_phone, contact_email)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) { toast.error(error.message); setLoading(false); return; }
    setBookings(data || []);
    setLoading(false);
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "cancelled" as any })
        .eq("id", cancelTarget);
      if (error) throw error;
      toast.success("Booking cancelled");
      fetchBookings();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCancelling(false);
      setCancelTarget(null);
    }
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
            const hostel = booking.hostels as any;
            const canCancel = booking.status === "pending" || booking.status === "approved";

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
                      {hostel?.hostel_name || "Unknown Hostel"}
                    </h4>
                    <p className="text-muted-foreground text-xs mb-1">
                      {hostel?.location}, {hostel?.city}
                    </p>
                    {booking.move_in_date && (
                      <p className="text-xs text-muted-foreground">Move-in: {new Date(booking.move_in_date).toLocaleDateString()}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Requested: {new Date(booking.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {canCancel && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 text-destructive hover:text-destructive rounded-xl text-xs"
                        onClick={() => setCancelTarget(booking.id)}
                      >
                        <XCircle className="w-3.5 h-3.5" /> Cancel
                      </Button>
                    )}
                    <Badge className={`${cfg.color} border-0 gap-1`}>
                      <StatusIcon className="w-3 h-3" /> {cfg.label}
                    </Badge>
                  </div>
                </div>

                {booking.message && (
                  <p className="text-xs text-muted-foreground mt-3 bg-secondary/50 rounded-xl p-3">{booking.message}</p>
                )}

                {booking.status === "approved" && (hostel?.contact_phone || hostel?.contact_email) && (
                  <div className="mt-3 p-3 rounded-xl bg-accent/5 border border-accent/20">
                    <p className="text-xs font-semibold text-accent mb-1.5">Owner Contact</p>
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      {hostel.contact_phone && (
                        <a href={`tel:${hostel.contact_phone}`} className="flex items-center gap-1 hover:text-foreground transition-colors">
                          <Phone className="w-3 h-3" /> {hostel.contact_phone}
                        </a>
                      )}
                      {hostel.contact_email && (
                        <a href={`mailto:${hostel.contact_email}`} className="flex items-center gap-1 hover:text-foreground transition-colors">
                          <Mail className="w-3 h-3" /> {hostel.contact_email}
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      <Dialog open={!!cancelTarget} onOpenChange={(open) => { if (!open) setCancelTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this booking request? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelTarget(null)}>Keep Booking</Button>
            <Button variant="destructive" disabled={cancelling} onClick={handleCancel}>
              {cancelling ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <XCircle className="w-4 h-4 mr-1" />}
              Cancel Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserBookings;
