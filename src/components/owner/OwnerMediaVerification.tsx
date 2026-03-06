import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, ShieldCheck, Clock, CheckCircle2, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-warning/10 text-warning" },
  scheduled: { label: "Scheduled", color: "bg-primary/10 text-primary" },
  under_review: { label: "Under Review", color: "bg-verified/10 text-verified" },
  platform_verified: { label: "Platform Verified", color: "bg-accent/10 text-accent" },
  owner_verified: { label: "Owner Verified", color: "bg-accent/10 text-accent" },
  ai_check: { label: "AI Check", color: "bg-primary/10 text-primary" },
  admin_review: { label: "Admin Review", color: "bg-verified/10 text-verified" },
  rejected: { label: "Rejected", color: "bg-destructive/10 text-destructive" },
};

const OwnerMediaVerification = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchRequests();
  }, [user]);

  const fetchRequests = async () => {
    const { data } = await supabase
      .from("media_verification_requests")
      .select("*, hostels(hostel_name, city)")
      .eq("owner_id", user!.id)
      .order("created_at", { ascending: false });
    setRequests(data || []);
    setLoading(false);
  };

  if (loading) return <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-xl mb-1 flex items-center gap-2">
            <Camera className="w-5 h-5 text-verified" /> Media Verification
          </h2>
          <p className="text-muted-foreground text-sm">Track your verification requests</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 rounded-xl" onClick={() => navigate("/pr-photoshoot-request")}>
            <ShieldCheck className="w-3.5 h-3.5" /> Request Photoshoot
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 rounded-xl" onClick={() => navigate("/self-verify-capture")}>
            <Camera className="w-3.5 h-3.5" /> Self Verify
          </Button>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border/50">
          <Camera className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">No verification requests yet</p>
          <div className="flex gap-2 justify-center">
            <Button size="sm" className="rounded-xl gap-1.5" onClick={() => navigate("/pr-photoshoot-request")}>
              <ShieldCheck className="w-3.5 h-3.5" /> Request Photoshoot
            </Button>
            <Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={() => navigate("/self-verify-capture")}>
              <Camera className="w-3.5 h-3.5" /> Self Verify
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req, i) => {
            const status = statusLabels[req.status] || statusLabels.pending;
            return (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-card rounded-2xl border border-border/50 shadow-card p-5"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-heading font-semibold text-sm">{(req.hostels as any)?.hostel_name}</h4>
                    <p className="text-xs text-muted-foreground">{(req.hostels as any)?.city}</p>
                  </div>
                  <Badge className={`${status.color} border-0`}>{status.label}</Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="capitalize">Type: {req.verification_type === "pr_team" ? "Professional" : "Self Capture"}</span>
                  {req.requested_date && <span>Date: {new Date(req.requested_date).toLocaleDateString()}</span>}
                  <span>Submitted: {new Date(req.created_at).toLocaleDateString()}</span>
                </div>
                {req.areas_to_capture?.length > 0 && (
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {req.areas_to_capture.map((a: string) => (
                      <Badge key={a} variant="secondary" className="text-[10px] capitalize">{a}</Badge>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OwnerMediaVerification;
