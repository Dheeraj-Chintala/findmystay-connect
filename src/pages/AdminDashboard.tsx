import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, Users, BadgeCheck, AlertTriangle, Eye, ShieldCheck, XCircle, CheckCircle2, Clock, Loader2, FileText, ExternalLink, Camera } from "lucide-react";
import AdminMediaVerification from "@/components/AdminMediaVerification";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface PendingVerification {
  id: string;
  hostel_id: string;
  owner_id: string;
  government_id_url: string | null;
  ownership_proof_url: string | null;
  admin_notes: string | null;
  created_at: string;
  hostels: {
    id: string;
    hostel_name: string;
    location: string;
    city: string;
    verified_status: string;
    property_type: string;
  };
  profiles: {
    full_name: string;
    email: string | null;
  };
}

const AdminDashboard = () => {
  const { user, hasRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [pendingDocs, setPendingDocs] = useState<PendingVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [stats, setStats] = useState({ total: 0, verified: 0, pending: 0, users: 0 });

  useEffect(() => {
    if (!authLoading) {
      if (!user) { navigate("/login"); return; }
      if (!hasRole("admin")) {
        toast.error("Admin access required");
        navigate("/");
        return;
      }
      fetchData();
    }
  }, [user, authLoading]);

  const fetchData = async () => {
    // Fetch pending verification documents
    const { data: docs } = await supabase
      .from("verification_documents")
      .select("*, hostels!inner(id, hostel_name, location, city, verified_status, property_type), profiles!verification_documents_owner_id_fkey(full_name, email)")
      .in("hostels.verified_status", ["under_review", "pending"])
      .order("created_at", { ascending: false });

    if (docs) setPendingDocs(docs as any);

    // Fetch stats
    const [hostelsRes, verifiedRes, pendingRes, usersRes] = await Promise.all([
      supabase.from("hostels").select("id", { count: "exact", head: true }),
      supabase.from("hostels").select("id", { count: "exact", head: true }).eq("verified_status", "verified"),
      supabase.from("hostels").select("id", { count: "exact", head: true }).in("verified_status", ["pending", "under_review"]),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
    ]);

    setStats({
      total: hostelsRes.count || 0,
      verified: verifiedRes.count || 0,
      pending: pendingRes.count || 0,
      users: usersRes.count || 0,
    });

    setLoading(false);
  };

  const handleVerify = async (doc: PendingVerification) => {
    setProcessing(doc.id);
    try {
      // Update hostel verification status
      await supabase
        .from("hostels")
        .update({ verified_status: "verified" as any, is_active: true })
        .eq("id", doc.hostel_id);

      // Update verification document
      await supabase
        .from("verification_documents")
        .update({
          admin_notes: adminNotes[doc.id] || "Approved",
          reviewed_by: user!.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", doc.id);

      // Ensure owner has owner role
      await supabase.from("user_roles").upsert({
        user_id: doc.owner_id,
        role: "owner" as any,
      }, { onConflict: "user_id,role" });

      toast.success(`${doc.hostels.hostel_name} has been verified!`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (doc: PendingVerification) => {
    if (!adminNotes[doc.id]?.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    setProcessing(doc.id);
    try {
      await supabase
        .from("hostels")
        .update({ verified_status: "rejected" as any })
        .eq("id", doc.hostel_id);

      await supabase
        .from("verification_documents")
        .update({
          admin_notes: adminNotes[doc.id],
          reviewed_by: user!.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", doc.id);

      toast.success(`${doc.hostels.hostel_name} has been rejected.`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcessing(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const adminStatCards = [
    { label: "Total Properties", value: stats.total, icon: Building2, color: "text-primary" },
    { label: "Active Users", value: stats.users, icon: Users, color: "text-accent" },
    { label: "Verified Listings", value: stats.verified, icon: BadgeCheck, color: "text-verified" },
    { label: "Pending Review", value: stats.pending, icon: Clock, color: "text-destructive" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 lg:pt-24">
        <div className="container mx-auto px-4 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <ShieldCheck className="w-7 h-7 text-primary" />
            <div>
              <h1 className="font-heading font-bold text-2xl md:text-3xl">Admin Dashboard</h1>
              <p className="text-muted-foreground text-sm">Manage verifications, listings & platform integrity</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {adminStatCards.map((stat, i) => (
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

          {/* Pending Verifications */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading font-semibold text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-verified" />
                Pending Verifications
              </h2>
              <Badge variant="secondary" className="font-mono">{pendingDocs.length}</Badge>
            </div>

            {pendingDocs.length === 0 ? (
              <div className="text-center py-16 bg-card rounded-2xl border border-border/50">
                <CheckCircle2 className="w-12 h-12 text-accent mx-auto mb-4" />
                <p className="text-muted-foreground">All caught up! No pending verifications.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingDocs.map((doc, i) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-card rounded-2xl border border-border/50 shadow-card p-6"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                      {/* Property info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-heading font-semibold text-lg">{doc.hostels.hostel_name}</h3>
                          <Badge variant="secondary" className="capitalize text-xs">{doc.hostels.property_type}</Badge>
                          <Badge className={doc.hostels.verified_status === "under_review" ? "bg-verified/10 text-verified" : "bg-muted text-muted-foreground"}>
                            {doc.hostels.verified_status === "under_review" ? "Under Review" : "Pending"}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-sm mb-1">{doc.hostels.location}, {doc.hostels.city}</p>
                        <p className="text-muted-foreground text-xs">
                          Submitted by: <strong>{doc.profiles?.full_name || "Unknown"}</strong>
                          {doc.profiles?.email && <> · {doc.profiles.email}</>}
                        </p>
                        <p className="text-muted-foreground text-xs mt-1">
                          Submitted: {new Date(doc.created_at).toLocaleDateString()}
                        </p>

                        {/* Documents */}
                        <div className="flex gap-3 mt-4">
                          {doc.government_id_url && (
                            <a href={doc.government_id_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-secondary/50 rounded-xl text-sm hover:bg-secondary transition-colors">
                              <FileText className="w-4 h-4 text-primary" />
                              Government ID
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          {doc.ownership_proof_url && (
                            <a href={doc.ownership_proof_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-secondary/50 rounded-xl text-sm hover:bg-secondary transition-colors">
                              <FileText className="w-4 h-4 text-primary" />
                              Ownership Proof
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Action panel */}
                      <div className="lg:w-72 space-y-3">
                        <div className="space-y-2">
                          <Label className="text-xs font-medium">Admin Notes</Label>
                          <Textarea
                            placeholder="Add notes (required for rejection)..."
                            value={adminNotes[doc.id] || ""}
                            onChange={(e) => setAdminNotes({ ...adminNotes, [doc.id]: e.target.value })}
                            className="rounded-xl min-h-[80px] resize-none text-sm"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="accent"
                            size="sm"
                            className="gap-1.5 rounded-xl flex-1"
                            onClick={() => handleVerify(doc)}
                            disabled={!!processing}
                          >
                            {processing === doc.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            Verify
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 rounded-xl flex-1 text-destructive hover:text-destructive"
                            onClick={() => handleReject(doc)}
                            disabled={!!processing}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Media Verification Management */}
          <div className="mt-8">
            <AdminMediaVerification />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AdminDashboard;
