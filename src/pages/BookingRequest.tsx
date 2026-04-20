import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, User, Phone, Mail, MessageSquare, Shield, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface HostelInfo {
  id: string;
  hostel_name: string;
  location: string;
  city: string;
  price_min: number;
  price_max: number;
  image_url: string | null;
}

const BookingRequest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hostel, setHostel] = useState<HostelInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    moveInDate: "",
    occupancy: "",
    message: "",
  });

  useEffect(() => {
    if (!user) {
      toast.info("Please sign in to submit a booking request.");
      navigate(`/login?redirect=/booking/${id}`);
      return;
    }
  }, [user, id, navigate]);

  useEffect(() => {
    if (!id) return;
    const fetchHostel = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("hostels")
        .select(`
          id, hostel_name, location, city, price_min, price_max,
          hostel_images(image_url, display_order)
        `)
        .eq("id", id)
        .maybeSingle();

      if (data) {
        const images = (data as any).hostel_images || [];
        const sorted = [...images].sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0));
        setHostel({
          id: data.id,
          hostel_name: data.hostel_name,
          location: data.location,
          city: data.city,
          price_min: data.price_min,
          price_max: data.price_max,
          image_url: sorted[0]?.image_url || null,
        });
      }
      setLoading(false);
    };
    fetchHostel();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!hostel) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-xl font-heading font-semibold mb-4">Property not found</p>
          <Link to="/listings"><Button>Back to Listings</Button></Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please sign in to submit a booking request");
      navigate(`/login?redirect=/booking/${id}`);
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("bookings").insert({
        user_id: user.id,
        hostel_id: hostel.id,
        full_name: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        move_in_date: formData.moveInDate || null,
        message: formData.message || null,
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
      toast.success("Booking request submitted!");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit booking");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20 lg:pt-24 flex items-center justify-center min-h-[80vh]">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md px-6">
            <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-accent" />
            </div>
            <h1 className="font-heading font-bold text-2xl mb-3">Booking Request Sent!</h1>
            <p className="text-muted-foreground mb-8">Your request for <strong>{hostel.hostel_name}</strong> has been submitted. The owner will review and contact you within 24 hours.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to={`/listing/${hostel.id}`}><Button variant="outline" className="rounded-xl">View Property</Button></Link>
              <Link to="/listings"><Button variant="hero" className="rounded-xl">Browse More</Button></Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 lg:pt-24">
        <div className="container mx-auto px-4 lg:px-8 py-8 max-w-4xl">
          <Link to={`/listing/${hostel.id}`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to property
          </Link>

          <div className="grid lg:grid-cols-5 gap-8">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-3">
              <h1 className="font-heading font-bold text-2xl mb-1">Request Booking</h1>
              <p className="text-muted-foreground text-sm mb-8">Fill in your details to send a booking request</p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input placeholder="Your full name" className="pl-10 h-11 rounded-xl" required value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input placeholder="+91 XXXXX XXXXX" className="pl-10 h-11 rounded-xl" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input type="email" placeholder="you@example.com" className="pl-10 h-11 rounded-xl" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Move-in Date</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input type="date" className="pl-10 h-11 rounded-xl" required value={formData.moveInDate} onChange={(e) => setFormData({ ...formData, moveInDate: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Occupancy</Label>
                    <Select value={formData.occupancy} onValueChange={(v) => setFormData({ ...formData, occupancy: v })}>
                      <SelectTrigger className="h-11 rounded-xl">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="double">Double Sharing</SelectItem>
                        <SelectItem value="triple">Triple Sharing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Message (Optional)</Label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Textarea placeholder="Any specific requirements or questions..." className="pl-10 rounded-xl min-h-[100px] resize-none" value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} />
                  </div>
                </div>

                <Button type="submit" variant="hero" size="lg" className="w-full" disabled={submitting}>
                  {submitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Submitting...</> : "Submit Booking Request"}
                </Button>

                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Shield className="w-3.5 h-3.5 text-accent" />
                  <span>No payment required · Owner will review your request</span>
                </div>
              </form>
            </motion.div>

            <div className="lg:col-span-2">
              <div className="sticky top-28 bg-card rounded-2xl border border-border/50 overflow-hidden shadow-card">
                {hostel.image_url ? (
                  <img src={hostel.image_url} alt={hostel.hostel_name} className="w-full aspect-video object-cover" />
                ) : (
                  <div className="w-full aspect-video bg-secondary flex items-center justify-center text-muted-foreground text-sm">No Image</div>
                )}
                <div className="p-5 space-y-4">
                  <div>
                    <h3 className="font-heading font-semibold">{hostel.hostel_name}</h3>
                    <p className="text-muted-foreground text-sm">{hostel.location}, {hostel.city}</p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Monthly Rent</span>
                      <span className="font-semibold">₹{hostel.price_min.toLocaleString()} - ₹{hostel.price_max.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default BookingRequest;
