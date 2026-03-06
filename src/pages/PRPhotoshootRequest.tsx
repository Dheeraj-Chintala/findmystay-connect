import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Calendar, MapPin, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion } from "framer-motion";

const captureAreas = [
  { id: "room", label: "Room Interior" },
  { id: "bathroom", label: "Bathroom" },
  { id: "dining", label: "Dining Area" },
  { id: "exterior", label: "Hostel Exterior" },
  { id: "amenities", label: "Amenities" },
  { id: "security", label: "Security Features" },
];

const PRPhotoshootRequest = () => {
  const { user, hasRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [hostels, setHostels] = useState<{ id: string; hostel_name: string; location: string; city: string }[]>([]);
  const [selectedHostel, setSelectedHostel] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user) { navigate("/login"); return; }
      if (!hasRole("owner") && !hasRole("admin")) { navigate("/"); return; }
      fetchHostels();
    }
  }, [user, authLoading]);

  const fetchHostels = async () => {
    const { data } = await supabase
      .from("hostels")
      .select("id, hostel_name, location, city")
      .eq("owner_id", user!.id);
    if (data) setHostels(data);
    setLoading(false);
  };

  const toggleArea = (areaId: string) => {
    setSelectedAreas((prev) =>
      prev.includes(areaId) ? prev.filter((a) => a !== areaId) : [...prev, areaId]
    );
  };

  const handleSubmit = async () => {
    if (!selectedHostel || !preferredDate || selectedAreas.length === 0) {
      toast.error("Please fill all fields and select at least one area");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("media_verification_requests").insert({
      hostel_id: selectedHostel,
      owner_id: user!.id,
      verification_type: "pr_team" as any,
      requested_date: preferredDate,
      areas_to_capture: selectedAreas,
      status: "pending" as any,
    });
    if (error) {
      toast.error(error.message);
    } else {
      setSubmitted(true);
      toast.success("Photoshoot request submitted!");
    }
    setSubmitting(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20 lg:pt-24 flex items-center justify-center min-h-[70vh]">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-md mx-auto px-4">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-accent" />
            </div>
            <h2 className="font-heading font-bold text-2xl mb-2">Request Submitted!</h2>
            <p className="text-muted-foreground mb-6">Our team will review your request and schedule a visit. You'll be notified once confirmed.</p>
            <Button onClick={() => navigate("/owner-dashboard")} variant="hero" className="rounded-xl">Back to Dashboard</Button>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 lg:pt-24">
        <div className="container mx-auto px-4 lg:px-8 py-8 max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-verified/10 flex items-center justify-center">
                <Camera className="w-6 h-6 text-verified" />
              </div>
              <div>
                <h1 className="font-heading font-bold text-2xl">Request Professional Photoshoot</h1>
                <p className="text-muted-foreground text-sm">Our team will visit and capture professional media</p>
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border/50 shadow-card p-6 space-y-6">
              <div className="space-y-2">
                <Label>Select Property</Label>
                <Select value={selectedHostel} onValueChange={setSelectedHostel}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Choose a property" />
                  </SelectTrigger>
                  <SelectContent>
                    {hostels.map((h) => (
                      <SelectItem key={h.id} value={h.id}>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                          {h.hostel_name} · {h.city}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Preferred Visit Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className="rounded-xl pl-10"
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Areas to Capture</Label>
                <div className="grid grid-cols-2 gap-3">
                  {captureAreas.map((area) => (
                    <label
                      key={area.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedAreas.includes(area.id)
                          ? "border-primary bg-primary/5"
                          : "border-border/50 hover:bg-secondary/50"
                      }`}
                    >
                      <Checkbox
                        checked={selectedAreas.includes(area.id)}
                        onCheckedChange={() => toggleArea(area.id)}
                      />
                      <span className="text-sm font-medium">{area.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Button onClick={handleSubmit} variant="hero" size="lg" className="w-full rounded-xl" disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                Submit Request
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PRPhotoshootRequest;
