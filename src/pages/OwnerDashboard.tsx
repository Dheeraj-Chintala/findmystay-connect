import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, Eye, Star, MessageSquare, IndianRupee, Camera, ShieldCheck, BarChart3, Bed, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AddHostelForm from "@/components/owner/AddHostelForm";
import OwnerPropertyManager from "@/components/owner/OwnerPropertyManager";
import OwnerAnalytics from "@/components/owner/OwnerAnalytics";
import OwnerBookingManager from "@/components/OwnerBookingManager";
import OwnerReviewManager from "@/components/owner/OwnerReviewManager";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const { user, hasRole, loading: authLoading } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading]);

  const handleRefresh = () => setRefreshKey(k => k + 1);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 lg:pt-24">
        <div className="container mx-auto px-4 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-heading font-bold text-2xl md:text-3xl">Owner Dashboard</h1>
              <p className="text-muted-foreground text-sm mt-1">Manage your properties, bookings & analytics</p>
            </div>
            <AddHostelForm onSuccess={handleRefresh} />
          </div>

          {/* Media Verification Quick Actions */}
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card rounded-2xl p-4 border border-border/50 shadow-card flex items-center gap-4 cursor-pointer hover:shadow-card-hover transition-all"
              onClick={() => navigate("/pr-photoshoot-request")}
            >
              <div className="w-11 h-11 rounded-xl bg-verified/10 flex items-center justify-center shrink-0">
                <Camera className="w-5 h-5 text-verified" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-heading font-semibold text-sm">Request Professional Photoshoot</h3>
                <p className="text-muted-foreground text-xs">Our team captures professional media</p>
              </div>
              <Badge className="bg-verified/10 text-verified border-verified/30 border shrink-0 text-[10px]">
                <ShieldCheck className="w-3 h-3 mr-0.5" /> Premium
              </Badge>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-card rounded-2xl p-4 border border-border/50 shadow-card flex items-center gap-4 cursor-pointer hover:shadow-card-hover transition-all"
              onClick={() => navigate("/self-verify-capture")}
            >
              <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                <Camera className="w-5 h-5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-heading font-semibold text-sm">Self Verify Listing Media</h3>
                <p className="text-muted-foreground text-xs">Guided photo capture for verification</p>
              </div>
              <Badge className="bg-accent/10 text-accent border-accent/30 border shrink-0 text-[10px]">Quick</Badge>
            </motion.div>
          </div>

          {/* Tabbed Dashboard */}
          <Tabs defaultValue="analytics" className="space-y-6">
            <TabsList className="bg-secondary/50 rounded-xl p-1 h-auto flex-wrap">
              <TabsTrigger value="analytics" className="rounded-lg gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm text-xs">
                <BarChart3 className="w-3.5 h-3.5" /> Analytics
              </TabsTrigger>
              <TabsTrigger value="properties" className="rounded-lg gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm text-xs">
                <Building2 className="w-3.5 h-3.5" /> Properties
              </TabsTrigger>
              <TabsTrigger value="bookings" className="rounded-lg gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm text-xs">
                <MessageSquare className="w-3.5 h-3.5" /> Bookings
              </TabsTrigger>
              <TabsTrigger value="reviews" className="rounded-lg gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm text-xs">
                <Star className="w-3.5 h-3.5" /> Reviews
              </TabsTrigger>
            </TabsList>

            <TabsContent value="analytics">
              <OwnerAnalytics key={refreshKey} />
            </TabsContent>

            <TabsContent value="properties">
              <OwnerPropertyManager key={refreshKey} />
            </TabsContent>

            <TabsContent value="bookings">
              <OwnerBookingManager />
            </TabsContent>

            <TabsContent value="reviews">
              <OwnerReviewManager />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default OwnerDashboard;
