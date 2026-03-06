import { useState, useEffect } from "react";
import { Camera, ShieldCheck, Clock, CheckCircle2, XCircle, Loader2, Eye, UserCheck, Calendar, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface MediaRequest {
  id: string;
  hostel_id: string;
  owner_id: string;
  verification_type: string;
  status: string;
  requested_date: string | null;
  assigned_pr_member: string | null;
  areas_to_capture: string[] | null;
  admin_notes: string | null;
  risk_score: number | null;
  created_at: string;
  hostels: { hostel_name: string; location: string; city: string };
  profiles: { full_name: string; email: string | null } | null;
}

const statusColors: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  scheduled: "bg-primary/10 text-primary",
  under_review: "bg-verified/10 text-verified",
  ai_check: "bg-verified/10 text-verified",
  admin_review: "bg-verified/10 text-verified",
  platform_verified: "bg-accent/10 text-accent",
  owner_verified: "bg-accent/10 text-accent",
  rejected: "bg-destructive/10 text-destructive",
};

const AdminMediaVerification = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<MediaRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [prMembers, setPrMembers] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from("media_verification_requests")
      .select("*, hostels!inner(hostel_name, location, city)")
      .order("created_at", { ascending: false });

    if (data) {
      // Fetch profiles separately to avoid FK issues
      const ownerIds = [...new Set(data.map((d: any) => d.owner_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", ownerIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);
      const enriched = data.map((d: any) => ({
        ...d,
        profiles: profileMap.get(d.owner_id) || null,
      }));
      setRequests(enriched);
    }
    setLoading(false);
  };

  const updateStatus = async (reqId: string, newStatus: string, badgeType?: string) => {
    setProcessing(reqId);
    try {
      await supabase
        .from("media_verification_requests")
        .update({
          status: newStatus as any,
          admin_notes: notes[reqId] || null,
          assigned_pr_member: prMembers[reqId] || null,
        })
        .eq("id", reqId);

      // If verified, update hostel badge
      if (badgeType) {
        const req = requests.find((r) => r.id === reqId);
        if (req) {
          await supabase
            .from("hostels")
            .update({ media_verification_badge: badgeType })
            .eq("id", req.hostel_id);
        }
      }

      toast.success(`Request updated to ${newStatus.replace(/_/g, " ")}`);
      fetchRequests();
    } catch (err: any) {
      toast.error(err.message);
    }
    setProcessing(null);
  };

  const filtered = filter === "all" ? requests : requests.filter((r) => r.status === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-semibold text-lg flex items-center gap-2">
          <Camera className="w-5 h-5 text-verified" />
          Media Verification Requests
        </h2>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-mono">{requests.length}</Badge>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-36 rounded-xl h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="ai_check">AI Check</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="platform_verified">Verified</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
          <Camera className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No media verification requests found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((req, i) => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card rounded-2xl border border-border/50 shadow-card p-6"
            >
              <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="font-heading font-semibold text-lg">{req.hostels.hostel_name}</h3>
                    <Badge className={statusColors[req.status] || "bg-muted text-muted-foreground"}>
                      {req.status.replace(/_/g, " ")}
                    </Badge>
                    <Badge variant="secondary" className="capitalize text-xs">
                      {req.verification_type === "pr_team" ? "🎥 PR Team" : "📱 Self Capture"}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-sm mb-1">{req.hostels.location}, {req.hostels.city}</p>
                  <p className="text-muted-foreground text-xs">
                    Owner: <strong>{req.profiles?.full_name || "Unknown"}</strong>
                    {req.profiles?.email && <> · {req.profiles.email}</>}
                  </p>
                  {req.requested_date && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Requested: {new Date(req.requested_date).toLocaleDateString()}
                    </p>
                  )}
                  {req.areas_to_capture && req.areas_to_capture.length > 0 && (
                    <div className="flex gap-1.5 mt-3 flex-wrap">
                      {req.areas_to_capture.map((area) => (
                        <Badge key={area} variant="secondary" className="text-[10px] capitalize">{area}</Badge>
                      ))}
                    </div>
                  )}
                  {req.risk_score != null && req.risk_score > 0 && (
                    <div className="mt-2 text-xs text-destructive font-medium">⚠ Risk Score: {req.risk_score}</div>
                  )}
                </div>

                <div className="lg:w-72 space-y-3">
                  {req.verification_type === "pr_team" && req.status === "pending" && (
                    <div className="space-y-2">
                      <Label className="text-xs">Assign PR Member</Label>
                      <Input
                        placeholder="Team member name"
                        value={prMembers[req.id] || ""}
                        onChange={(e) => setPrMembers({ ...prMembers, [req.id]: e.target.value })}
                        className="rounded-xl text-sm"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label className="text-xs">Admin Notes</Label>
                    <Textarea
                      placeholder="Add notes..."
                      value={notes[req.id] || ""}
                      onChange={(e) => setNotes({ ...notes, [req.id]: e.target.value })}
                      className="rounded-xl min-h-[60px] resize-none text-sm"
                    />
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {req.status === "pending" && req.verification_type === "pr_team" && (
                      <Button size="sm" className="gap-1 rounded-xl flex-1" onClick={() => updateStatus(req.id, "scheduled")} disabled={!!processing}>
                        {processing === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Calendar className="w-3 h-3" />}
                        Schedule
                      </Button>
                    )}
                    {(req.status === "pending" || req.status === "ai_check" || req.status === "admin_review" || req.status === "scheduled" || req.status === "under_review") && (
                      <>
                        <Button
                          variant="accent"
                          size="sm"
                          className="gap-1 rounded-xl flex-1"
                          onClick={() => updateStatus(
                            req.id,
                            req.verification_type === "pr_team" ? "platform_verified" : "owner_verified",
                            req.verification_type === "pr_team" ? "platform_verified" : "owner_verified"
                          )}
                          disabled={!!processing}
                        >
                          {processing === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                          Verify
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 rounded-xl text-destructive hover:text-destructive"
                          onClick={() => updateStatus(req.id, "rejected")}
                          disabled={!!processing}
                        >
                          <XCircle className="w-3 h-3" /> Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminMediaVerification;
