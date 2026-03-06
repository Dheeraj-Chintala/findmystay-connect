import { Building2, Users, BadgeCheck, AlertTriangle, Eye, TrendingUp, ShieldCheck, XCircle, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { listings } from "@/data/mockListings";
import { motion } from "framer-motion";
import { toast } from "sonner";

const adminStats = [
  { label: "Total Properties", value: "2,547", icon: Building2, color: "text-primary" },
  { label: "Active Users", value: "15,234", icon: Users, color: "text-accent" },
  { label: "Verified Listings", value: "1,892", icon: BadgeCheck, color: "text-verified" },
  { label: "Reported Issues", value: "23", icon: AlertTriangle, color: "text-destructive" },
];

const pendingVerifications = [
  { id: "1", title: "Sunshine PG for Women", owner: "Meena Iyer", location: "HSR Layout, Bangalore", submitted: "2 days ago" },
  { id: "2", title: "Urban Nest Hostel", owner: "Ajay Kumar", location: "Powai, Mumbai", submitted: "3 days ago" },
  { id: "3", title: "StudyHub Co-Living", owner: "Ravi Shankar", location: "Hinjewadi, Pune", submitted: "5 days ago" },
];

const recentReports = [
  { id: "1", type: "Fake Listing", property: "XYZ Hostel", reporter: "Ananya S.", severity: "high" },
  { id: "2", type: "Misleading Photos", property: "ABC PG", reporter: "Vikash M.", severity: "medium" },
  { id: "3", type: "Price Discrepancy", property: "Elite Stay", reporter: "Priti K.", severity: "low" },
];

const AdminDashboard = () => {
  const handleVerify = (title: string) => {
    toast.success(`${title} has been verified!`);
  };

  const handleReject = (title: string) => {
    toast.error(`${title} has been rejected.`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 lg:pt-24">
        <div className="container mx-auto px-4 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-6 h-6 text-primary" />
                <h1 className="font-heading font-bold text-2xl md:text-3xl">Admin Dashboard</h1>
              </div>
              <p className="text-muted-foreground text-sm">Manage listings, users, and platform integrity</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {adminStats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="bg-card rounded-2xl p-5 border border-border/50 shadow-card"
              >
                <div className={`w-10 h-10 rounded-xl bg-secondary flex items-center justify-center ${stat.color} mb-3`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <p className="font-heading font-extrabold text-2xl">{stat.value}</p>
                <p className="text-muted-foreground text-xs mt-0.5">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Pending Verifications */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading font-semibold text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-verified" />
                  Pending Verifications
                </h2>
                <Badge variant="secondary" className="font-mono">{pendingVerifications.length}</Badge>
              </div>
              <div className="space-y-3">
                {pendingVerifications.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="p-4 bg-card rounded-2xl border border-border/50 shadow-card"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-heading font-semibold text-sm">{item.title}</h3>
                        <p className="text-muted-foreground text-xs">{item.location}</p>
                        <p className="text-muted-foreground text-xs mt-1">by {item.owner} · {item.submitted}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="accent" className="gap-1 rounded-lg flex-1" onClick={() => handleVerify(item.title)}>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Verify
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1 rounded-lg flex-1" onClick={() => handleReject(item.title)}>
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </Button>
                      <Button size="sm" variant="ghost" className="rounded-lg">
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Reported Issues */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading font-semibold text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  Reported Issues
                </h2>
                <Badge variant="secondary" className="font-mono">{recentReports.length}</Badge>
              </div>
              <div className="space-y-3">
                {recentReports.map((report, i) => (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="p-4 bg-card rounded-2xl border border-border/50 shadow-card"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-heading font-semibold text-sm">{report.type}</h3>
                          <Badge className={
                            report.severity === "high" ? "bg-destructive text-destructive-foreground" :
                            report.severity === "medium" ? "bg-verified text-verified-foreground" :
                            "bg-secondary text-secondary-foreground"
                          }>
                            {report.severity}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-xs">{report.property} · Reported by {report.reporter}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline" className="rounded-lg text-xs flex-1">Investigate</Button>
                      <Button size="sm" variant="ghost" className="rounded-lg text-xs">Dismiss</Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent listings overview */}
          <div className="mt-8">
            <h2 className="font-heading font-semibold text-lg mb-4">Recently Added Listings</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.slice(0, 3).map((listing) => (
                <div key={listing.id} className="flex gap-3 p-3 bg-card rounded-xl border border-border/50">
                  <img src={listing.image} alt={listing.title} className="w-16 h-14 rounded-lg object-cover shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-heading font-semibold text-sm truncate">{listing.title}</p>
                      {listing.verified && <BadgeCheck className="w-3.5 h-3.5 text-verified shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{listing.location}</p>
                    <p className="text-xs font-semibold text-primary mt-0.5">₹{listing.price.toLocaleString()}/mo</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AdminDashboard;
