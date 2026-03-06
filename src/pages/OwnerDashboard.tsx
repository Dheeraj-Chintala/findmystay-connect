import { Link, useNavigate } from "react-router-dom";
import { Building2, Plus, Eye, Star, TrendingUp, Users, MessageSquare, IndianRupee, BarChart3, Settings, BadgeCheck, MoreHorizontal, Camera, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { listings } from "@/data/mockListings";
import { motion } from "framer-motion";

const stats = [
  { label: "Total Views", value: "2,847", change: "+12%", icon: Eye, color: "text-primary" },
  { label: "Booking Requests", value: "38", change: "+5%", icon: MessageSquare, color: "text-accent" },
  { label: "Avg. Rating", value: "4.7", change: "+0.2", icon: Star, color: "text-verified" },
  { label: "Revenue", value: "₹1.2L", change: "+18%", icon: IndianRupee, color: "text-accent" },
];

const bookingRequests = [
  { name: "Amit Kumar", property: "Sunrise Co-Living", date: "Today", status: "pending" },
  { name: "Sneha P.", property: "Sunrise Co-Living", date: "Yesterday", status: "approved" },
  { name: "Rahul V.", property: "Elite PG", date: "2 days ago", status: "pending" },
];

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const myListings = listings.slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 lg:pt-24">
        <div className="container mx-auto px-4 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-heading font-bold text-2xl md:text-3xl">Owner Dashboard</h1>
              <p className="text-muted-foreground text-sm mt-1">Manage your properties and bookings</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="hero" className="gap-2 rounded-xl">
                <Plus className="w-4 h-4" /> Add Property
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="bg-card rounded-2xl p-5 border border-border/50 shadow-card"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-secondary flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium text-accent bg-accent/10 px-2 py-1 rounded-full">{stat.change}</span>
                </div>
                <p className="font-heading font-extrabold text-2xl">{stat.value}</p>
                <p className="text-muted-foreground text-xs mt-0.5">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Media Verification Actions */}
          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card rounded-2xl p-5 border border-border/50 shadow-card flex items-center gap-4 cursor-pointer hover:shadow-card-hover transition-all"
              onClick={() => navigate("/pr-photoshoot-request")}
            >
              <div className="w-12 h-12 rounded-xl bg-verified/10 flex items-center justify-center shrink-0">
                <Camera className="w-6 h-6 text-verified" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-heading font-semibold text-sm">Request Professional Photoshoot</h3>
                <p className="text-muted-foreground text-xs mt-0.5">Our team visits and captures professional media</p>
              </div>
              <Badge className="bg-verified/10 text-verified border-verified/30 border shrink-0">
                <ShieldCheck className="w-3 h-3 mr-1" /> Premium
              </Badge>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-card rounded-2xl p-5 border border-border/50 shadow-card flex items-center gap-4 cursor-pointer hover:shadow-card-hover transition-all"
              onClick={() => navigate("/self-verify-capture")}
            >
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                <Camera className="w-6 h-6 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-heading font-semibold text-sm">Self Verify Listing Media</h3>
                <p className="text-muted-foreground text-xs mt-0.5">Guided photo capture for instant verification</p>
              </div>
              <Badge className="bg-accent/10 text-accent border-accent/30 border shrink-0">Quick</Badge>
            </motion.div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* My Properties */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading font-semibold text-lg">My Properties</h2>
                <Button variant="ghost" size="sm">View All</Button>
              </div>
              <div className="space-y-3">
                {myListings.map((listing, i) => (
                  <motion.div
                    key={listing.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <Link to={`/listing/${listing.id}`} className="flex gap-4 p-4 bg-card rounded-2xl border border-border/50 shadow-card hover:shadow-card-hover transition-all group">
                      <img src={listing.image} alt={listing.title} className="w-24 h-20 rounded-xl object-cover shrink-0 group-hover:scale-105 transition-transform" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-heading font-semibold text-sm truncate">{listing.title}</h3>
                          {listing.verified && (
                            <BadgeCheck className="w-4 h-4 text-verified shrink-0" />
                          )}
                        </div>
                        <p className="text-muted-foreground text-xs mb-2">{listing.location}</p>
                        <div className="flex items-center gap-4 text-xs">
                          <span className="font-heading font-bold text-primary">₹{listing.price.toLocaleString()}/mo</span>
                          <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-verified text-verified" />{listing.rating}</span>
                          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />432</span>
                        </div>
                      </div>
                      <button className="self-start p-2 rounded-lg hover:bg-secondary">
                        <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Recent Requests */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading font-semibold text-lg">Booking Requests</h2>
                <Button variant="ghost" size="sm">View All</Button>
              </div>
              <div className="space-y-3">
                {bookingRequests.map((req, i) => (
                  <motion.div
                    key={req.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="p-4 bg-card rounded-2xl border border-border/50 shadow-card"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-heading font-bold text-primary text-xs">{req.name[0]}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-heading font-semibold text-sm truncate">{req.name}</p>
                        <p className="text-muted-foreground text-xs">{req.property}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{req.date}</span>
                      <Badge className={req.status === "approved" ? "bg-accent text-accent-foreground" : "bg-verified/10 text-verified"}>
                        {req.status}
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default OwnerDashboard;
