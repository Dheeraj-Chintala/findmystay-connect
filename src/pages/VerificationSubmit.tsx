import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, FileText, CheckCircle2, Clock, XCircle, Shield, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface HostelWithDocs {
  id: string;
  hostel_name: string;
  location: string;
  verified_status: string;
  verification_documents: {
    id: string;
    government_id_url: string | null;
    ownership_proof_url: string | null;
    admin_notes: string | null;
    reviewed_at: string | null;
  }[];
}

const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  pending: { icon: <Clock className="w-4 h-4" />, color: "bg-muted text-muted-foreground", label: "Pending Submission" },
  under_review: { icon: <Loader2 className="w-4 h-4 animate-spin" />, color: "bg-verified/10 text-verified", label: "Under Review" },
  verified: { icon: <CheckCircle2 className="w-4 h-4" />, color: "bg-accent/10 text-accent", label: "Verified" },
  rejected: { icon: <XCircle className="w-4 h-4" />, color: "bg-destructive/10 text-destructive", label: "Rejected" },
};

const VerificationSubmit = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [hostels, setHostels] = useState<HostelWithDocs[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [govIdFile, setGovIdFile] = useState<File | null>(null);
  const [ownershipFile, setOwnershipFile] = useState<File | null>(null);
  const [selectedHostel, setSelectedHostel] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }
    if (user) fetchHostels();
  }, [user, authLoading]);

  const fetchHostels = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("hostels")
      .select("id, hostel_name, location, verified_status, verification_documents(id, government_id_url, ownership_proof_url, admin_notes, reviewed_at)")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setHostels(data as any);
    }
    setLoading(false);
  };

  const uploadFile = async (file: File, path: string) => {
    const ext = file.name.split(".").pop();
    const fileName = `${path}/${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage
      .from("verification-docs")
      .upload(fileName, file);
    if (error) throw error;
    const { data: urlData } = supabase.storage
      .from("verification-docs")
      .getPublicUrl(fileName);
    return urlData.publicUrl;
  };

  const handleSubmit = async (hostelId: string) => {
    if (!govIdFile || !ownershipFile || !user) {
      toast.error("Please upload both documents");
      return;
    }

    setUploading(hostelId);
    try {
      const govIdUrl = await uploadFile(govIdFile, `${user.id}/gov-id`);
      const ownershipUrl = await uploadFile(ownershipFile, `${user.id}/ownership`);

      // Check if doc already exists
      const { data: existing } = await supabase
        .from("verification_documents")
        .select("id")
        .eq("hostel_id", hostelId)
        .eq("owner_id", user.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("verification_documents")
          .update({
            government_id_url: govIdUrl,
            ownership_proof_url: ownershipUrl,
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("verification_documents").insert({
          hostel_id: hostelId,
          owner_id: user.id,
          government_id_url: govIdUrl,
          ownership_proof_url: ownershipUrl,
        });
      }

      // Update hostel status to under_review
      await supabase
        .from("hostels")
        .update({ verified_status: "under_review" as any })
        .eq("id", hostelId);

      toast.success("Documents submitted for verification!");
      setGovIdFile(null);
      setOwnershipFile(null);
      setSelectedHostel(null);
      fetchHostels();
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 lg:pt-24">
        <div className="container mx-auto px-4 lg:px-8 py-8 max-w-3xl">
          <Link to="/owner-dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to dashboard
          </Link>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-6 h-6 text-primary" />
              <h1 className="font-heading font-bold text-2xl">Property Verification</h1>
            </div>
            <p className="text-muted-foreground mb-8">Submit documents to verify your property and earn the trusted badge.</p>

            {/* Steps */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
              {[
                { step: "1", label: "Upload Gov ID" },
                { step: "2", label: "Upload Ownership Proof" },
                { step: "3", label: "Admin Reviews" },
                { step: "4", label: "Get Verified Badge" },
              ].map((s) => (
                <div key={s.step} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border/50">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-heading font-bold text-sm">{s.step}</div>
                  <span className="text-xs font-medium">{s.label}</span>
                </div>
              ))}
            </div>

            <Separator className="mb-8" />

            {hostels.length === 0 ? (
              <div className="text-center py-16">
                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">You haven't listed any properties yet.</p>
                <Link to="/owner-dashboard">
                  <Button>Go to Dashboard</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {hostels.map((hostel) => {
                  const status = statusConfig[hostel.verified_status] || statusConfig.pending;
                  const doc = hostel.verification_documents?.[0];
                  const isSelected = selectedHostel === hostel.id;
                  const canSubmit = hostel.verified_status === "pending" || hostel.verified_status === "rejected";

                  return (
                    <div key={hostel.id} className="bg-card rounded-2xl border border-border/50 shadow-card overflow-hidden">
                      <div className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-heading font-semibold">{hostel.hostel_name}</h3>
                            <p className="text-muted-foreground text-sm">{hostel.location}</p>
                          </div>
                          <Badge className={`${status.color} gap-1`}>
                            {status.icon} {status.label}
                          </Badge>
                        </div>

                        {/* Show admin notes if rejected */}
                        {hostel.verified_status === "rejected" && doc?.admin_notes && (
                          <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-3 mb-4">
                            <p className="text-sm text-destructive font-medium mb-1">Rejection Reason:</p>
                            <p className="text-sm text-muted-foreground">{doc.admin_notes}</p>
                          </div>
                        )}

                        {/* Show existing docs */}
                        {doc && hostel.verified_status !== "pending" && (
                          <div className="flex gap-3 mb-4">
                            {doc.government_id_url && (
                              <div className="flex items-center gap-2 text-sm bg-secondary/50 rounded-lg px-3 py-2">
                                <FileText className="w-4 h-4 text-primary" />
                                <span>Gov ID uploaded</span>
                              </div>
                            )}
                            {doc.ownership_proof_url && (
                              <div className="flex items-center gap-2 text-sm bg-secondary/50 rounded-lg px-3 py-2">
                                <FileText className="w-4 h-4 text-primary" />
                                <span>Ownership proof uploaded</span>
                              </div>
                            )}
                          </div>
                        )}

                        {canSubmit && !isSelected && (
                          <Button variant="outline" className="rounded-xl gap-2" onClick={() => setSelectedHostel(hostel.id)}>
                            <Upload className="w-4 h-4" />
                            {hostel.verified_status === "rejected" ? "Re-submit Documents" : "Submit for Verification"}
                          </Button>
                        )}

                        {hostel.verified_status === "verified" && (
                          <div className="flex items-center gap-2 text-accent text-sm font-medium">
                            <CheckCircle2 className="w-4 h-4" />
                            Your property is verified and visible to users
                          </div>
                        )}
                      </div>

                      {/* Upload form */}
                      {isSelected && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="border-t border-border p-5 bg-secondary/20">
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Government ID (Aadhaar, PAN, etc.)</Label>
                              <Input
                                type="file"
                                accept="image/*,.pdf"
                                onChange={(e) => setGovIdFile(e.target.files?.[0] || null)}
                                className="rounded-xl"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Ownership / Rental Agreement Proof</Label>
                              <Input
                                type="file"
                                accept="image/*,.pdf"
                                onChange={(e) => setOwnershipFile(e.target.files?.[0] || null)}
                                className="rounded-xl"
                              />
                            </div>
                            <div className="flex gap-3">
                              <Button
                                variant="hero"
                                className="gap-2 rounded-xl"
                                onClick={() => handleSubmit(hostel.id)}
                                disabled={!!uploading || !govIdFile || !ownershipFile}
                              >
                                {uploading === hostel.id ? (
                                  <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
                                ) : (
                                  <><Upload className="w-4 h-4" /> Submit Documents</>
                                )}
                              </Button>
                              <Button variant="ghost" className="rounded-xl" onClick={() => setSelectedHostel(null)}>Cancel</Button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default VerificationSubmit;
