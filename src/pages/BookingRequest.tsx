import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, User, Phone, Mail, MessageSquare, Shield, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { listings } from "@/data/mockListings";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useState } from "react";

const BookingRequest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const listing = listings.find((l) => l.id === id);
  const [submitted, setSubmitted] = useState(false);

  if (!listing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p>Property not found</p>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    toast.success("Booking request submitted!");
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
            <p className="text-muted-foreground mb-8">Your request for <strong>{listing.title}</strong> has been submitted. The owner will review and contact you within 24 hours.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to={`/listing/${listing.id}`}><Button variant="outline" className="rounded-xl">View Property</Button></Link>
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
          <Link to={`/listing/${listing.id}`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to property
          </Link>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Form */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-3">
              <h1 className="font-heading font-bold text-2xl mb-1">Request Booking</h1>
              <p className="text-muted-foreground text-sm mb-8">Fill in your details to send a booking request</p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input placeholder="Your full name" className="pl-10 h-11 rounded-xl" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input placeholder="+91 XXXXX XXXXX" className="pl-10 h-11 rounded-xl" required />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input type="email" placeholder="you@example.com" className="pl-10 h-11 rounded-xl" required />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Move-in Date</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input type="date" className="pl-10 h-11 rounded-xl" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Occupancy</Label>
                    <Select>
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
                    <Textarea placeholder="Any specific requirements or questions..." className="pl-10 rounded-xl min-h-[100px] resize-none" />
                  </div>
                </div>

                <Button type="submit" variant="hero" size="lg" className="w-full">
                  Submit Booking Request
                </Button>

                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Shield className="w-3.5 h-3.5 text-accent" />
                  <span>No payment required · Owner will review your request</span>
                </div>
              </form>
            </motion.div>

            {/* Summary */}
            <div className="lg:col-span-2">
              <div className="sticky top-28 bg-card rounded-2xl border border-border/50 overflow-hidden shadow-card">
                <img src={listing.image} alt={listing.title} className="w-full aspect-video object-cover" />
                <div className="p-5 space-y-4">
                  <div>
                    <h3 className="font-heading font-semibold">{listing.title}</h3>
                    <p className="text-muted-foreground text-sm">{listing.location}</p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Monthly Rent</span>
                      <span className="font-semibold">₹{listing.price.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Security Deposit</span>
                      <span className="font-semibold">₹{listing.deposit.toLocaleString()}</span>
                    </div>
                    <div className="border-t border-border pt-2 flex justify-between">
                      <span className="font-semibold">Total Move-in Cost</span>
                      <span className="font-heading font-bold text-primary">₹{(listing.price + listing.deposit).toLocaleString()}</span>
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
