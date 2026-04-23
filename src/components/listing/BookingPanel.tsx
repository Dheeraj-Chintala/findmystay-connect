import { useState } from "react";
import { Calendar, Users, Shield, Loader2, BedDouble } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

interface Room {
  id: string;
  sharing_type: string;
  price_per_month: number;
  available_beds: number;
  total_beds: number;
}

interface BookingPanelProps {
  hostelId: string;
  hostelName: string;
  priceMin: number;
  priceMax: number;
  rooms: Room[];
  isActive: boolean;
}

const BookingPanel = ({ hostelId, hostelName, priceMin, priceMax, rooms, isActive }: BookingPanelProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedRoom, setSelectedRoom] = useState("");
  const [checkInDate, setCheckInDate] = useState("");
  const [occupants, setOccupants] = useState("1");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const selectedRoomData = rooms.find(r => r.id === selectedRoom);
  const displayPrice = selectedRoomData?.price_per_month || priceMin;
  const availableRooms = rooms.filter(r => r.available_beds > 0);

  const handleBookNow = async () => {
    if (!user) {
      toast.info("Please sign in or create an account to continue booking.");
      navigate(`/login?redirect=/listing/${hostelId}&book=true`);
      return;
    }

    if (!checkInDate) {
      toast.error("Please select a check-in date.");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("bookings").insert({
        user_id: user.id,
        hostel_id: hostelId,
        room_id: selectedRoom || null,
        full_name: user.user_metadata?.full_name || "",
        email: user.email || null,
        move_in_date: checkInDate,
        message: message || null,
        status: "pending" as any,
      });

      if (error) {
        if (error.code === "23505") {
          toast.info("You already have a pending booking request for this date.");
          setSubmitted(true);
          return;
        }
        throw error;
      }
      setSubmitted(true);
      toast.success("Booking request submitted! The owner will review it shortly.");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit booking request.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card rounded-2xl shadow-card-hover p-6 border border-border/50 text-center">
        <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-7 h-7 text-accent" />
        </div>
        <h3 className="font-heading font-bold text-lg mb-2">Booking Request Sent!</h3>
        <p className="text-muted-foreground text-sm mb-4">Your request for <strong>{hostelName}</strong> has been submitted. The owner will review and respond within 24 hours.</p>
        <Button variant="outline" className="rounded-xl" onClick={() => navigate("/dashboard/bookings")}>
          View My Bookings
        </Button>
      </motion.div>
    );
  }

  if (!isActive) {
    return (
      <div className="bg-card rounded-2xl shadow-card-hover p-6 border border-border/50">
        <p className="text-center text-muted-foreground text-sm">This property is currently not available for booking.</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl shadow-card-hover p-6 border border-border/50 space-y-5">
      <div className="flex items-baseline gap-1 mb-1">
        <span className="font-heading font-extrabold text-3xl text-primary">₹{displayPrice.toLocaleString()}</span>
        <span className="text-muted-foreground text-sm">/ month</span>
      </div>

      {availableRooms.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-1.5">
            <BedDouble className="w-4 h-4 text-primary" /> Room Type
          </Label>
          <Select value={selectedRoom} onValueChange={setSelectedRoom}>
            <SelectTrigger className="rounded-xl h-11">
              <SelectValue placeholder="Select room type" />
            </SelectTrigger>
            <SelectContent>
              {availableRooms.map(room => (
                <SelectItem key={room.id} value={room.id}>
                  {room.sharing_type} — ₹{room.price_per_month.toLocaleString()}/mo ({room.available_beds} beds available)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-primary" /> Check-in Date
        </Label>
        <Input
          type="date"
          className="rounded-xl h-11"
          value={checkInDate}
          onChange={e => setCheckInDate(e.target.value)}
          min={new Date().toISOString().split("T")[0]}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-1.5">
          <Users className="w-4 h-4 text-primary" /> Number of Occupants
        </Label>
        <Select value={occupants} onValueChange={setOccupants}>
          <SelectTrigger className="rounded-xl h-11">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 Person</SelectItem>
            <SelectItem value="2">2 People</SelectItem>
            <SelectItem value="3">3 People</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Message (Optional)</Label>
        <Textarea
          placeholder="Any specific requirements..."
          className="rounded-xl min-h-[80px] resize-none"
          value={message}
          onChange={e => setMessage(e.target.value)}
        />
      </div>

      <Button
        onClick={handleBookNow}
        size="lg"
        className="w-full gap-2 rounded-xl bg-[#8B5E3C] hover:bg-[#7A5235] text-white font-semibold shadow-md hover:-translate-y-0.5 transition-all"
        disabled={submitting}
      >
        {submitting ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
        ) : (
          <><Calendar className="w-4 h-4" /> Confirm Booking</>
        )}
      </Button>

      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Shield className="w-3.5 h-3.5 text-accent" />
        <span>No payment required · Owner will review your request</span>
      </div>
    </div>
  );
};

export default BookingPanel;
