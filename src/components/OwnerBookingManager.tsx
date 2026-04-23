import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Loader2, MessageSquare, Phone, Mail, Calendar, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface Booking {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  message: string | null;
  move_in_date: string | null;
  status: string;
  created_at: string;
  hostel_id: string;
  hostels: {
    hostel_name: string;
  };
}

const statusStyles: Record<string, string> = {
  pending: "bg-verified/10 text-verified",
  approved: "bg-accent/10 text-accent",
  rejected: "bg-destructive/10 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
  checked_in: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  completed: "bg-primary/10 text-primary",
};

const OwnerBookingManager = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchBookings();
  }, [user]);

  const fetchBookings = async () => {
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
      .from("bookings")
      .select("*, hostels!inner(hostel_name)")
      .in("hostel_id", hostelIds)
      .order("created_at", { ascending: false });

    if (data) setBookings(data as unknown as Booking[]);
    setLoading(false);
  };

  const updateStatus = async (bookingId: string, status: string) => {
    setProcessing(bookingId);
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: status as Database["public"]["Enums"]["booking_status"] })
        .eq("id", bookingId);

      if (error) throw error;

      if (status === "checked_in") {
        const booking = bookings.find(b => b.id === bookingId);
        if (booking) {
          await supabase
            .from("hostel_members")
            .upsert(
              {
                hostel_id: booking.hostel_id,
                user_id: booking.user_id,
                booking_id: booking.id,
                status: "active",
              },
              { onConflict: "hostel_id,user_id" }
            );
        }
      }

      toast.success(
        status === "approved" ? "Booking approved" :
        status === "rejected" ? "Booking rejected" :
        status === "checked_in" ? "Tenant checked in & added as hostel member" :
        `Booking ${status}`
      );
      fetchBookings();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const pendingCount = bookings.filter(b => b.status === "pending").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading font-semibold text-lg flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-accent" />
          Booking Requests
        </h2>
        {pendingCount > 0 && (
          <Badge className="bg-verified/10 text-verified">{pendingCount} pending</Badge>
        )}
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
          <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No booking requests yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking, i) => (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card rounded-2xl border border-border/50 shadow-card p-5"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-heading font-bold text-primary text-sm">
                    {(booking.full_name || "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-heading font-semibold text-sm">{booking.full_name || "Unknown"}</p>
                    <p className="text-muted-foreground text-xs">{booking.hostels.hostel_name}</p>
                  </div>
                </div>
                <Badge className={statusStyles[booking.status] || statusStyles.pending}>
                  {booking.status.replace("_", " ")}
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-muted-foreground mb-3">
                {booking.email && (
                  <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{booking.email}</span>
                )}
                {booking.phone && (
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{booking.phone}</span>
                )}
                {booking.move_in_date && (
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(booking.move_in_date).toLocaleDateString()}</span>
                )}
              </div>

              {booking.message && (
                <p className="text-xs text-muted-foreground bg-secondary/50 rounded-xl p-3 mb-3">"{booking.message}"</p>
              )}

              {booking.status === "pending" && (
                <div className="flex gap-2">
                  <Button
                    variant="accent"
                    size="sm"
                    className="gap-1.5 rounded-xl flex-1"
                    onClick={() => updateStatus(booking.id, "approved")}
                    disabled={!!processing}
                  >
                    {processing === booking.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 rounded-xl flex-1 text-destructive hover:text-destructive"
                    onClick={() => updateStatus(booking.id, "rejected")}
                    disabled={!!processing}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Reject
                  </Button>
                </div>
              )}

              {booking.status === "approved" && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="gap-1.5 rounded-xl flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => updateStatus(booking.id, "checked_in")}
                    disabled={!!processing}
                  >
                    {processing === booking.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogIn className="w-3.5 h-3.5" />}
                    Check In & Onboard
                  </Button>
                </div>
              )}

              {booking.status === "checked_in" && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 rounded-xl flex-1"
                    onClick={() => updateStatus(booking.id, "completed")}
                    disabled={!!processing}
                  >
                    {processing === booking.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    Mark Completed
                  </Button>
                </div>
              )}

              <p className="text-xs text-muted-foreground mt-2">
                {new Date(booking.created_at).toLocaleDateString()} · {new Date(booking.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OwnerBookingManager;
