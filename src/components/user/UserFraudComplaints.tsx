import { useState, useEffect } from "react";
import { AlertTriangle, Loader2, Send, Clock, CheckCircle2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { toast } from "sonner";

const statusStyles: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600",
  confirmed: "bg-destructive/10 text-destructive",
  dismissed: "bg-muted text-muted-foreground",
};

const UserFraudComplaints = () => {
  const { user } = useAuth();
  const [hostels, setHostels] = useState<{ id: string; hostel_name: string }[]>([]);
  const [myAlerts, setMyAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selectedHostel, setSelectedHostel] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    if (user) {
      fetchHostels();
      fetchMyAlerts();
    }
  }, [user]);

  const fetchHostels = async () => {
    const { data, error } = await supabase
      .from("hostels")
      .select("id, hostel_name")
      .eq("is_active", true)
      .order("hostel_name");
    if (error) { toast.error(error.message); return; }
    setHostels(data || []);
  };

  const fetchMyAlerts = async () => {
    const { data, error } = await supabase
      .from("fraud_alerts")
      .select("*, hostels(hostel_name)")
      .eq("reported_by", user!.id)
      .order("created_at", { ascending: false });
    if (error) { toast.error(error.message); setLoading(false); return; }

    setMyAlerts(data || []);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!selectedHostel || !description.trim()) {
      toast.error("Please select a hostel and provide a description.");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("fraud_alerts").insert({
        hostel_id: selectedHostel,
        reported_by: user!.id,
        status: "pending",
        risk_score: 0,
        flags: [{
          type: category || "user_report",
          severity: "medium",
          description: description.trim(),
        }],
      });

      if (error) throw error;
      toast.success("Your report has been submitted. Our team will review it shortly.");
      setSelectedHostel("");
      setDescription("");
      setCategory("");
      fetchMyAlerts();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading font-bold text-xl mb-1 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-destructive" /> Report an Issue
        </h2>
        <p className="text-muted-foreground text-sm">Submit fraud alerts or complaints about hostels</p>
      </div>

      <div className="bg-card rounded-2xl border border-border/50 shadow-card p-5 space-y-4">
        <h3 className="font-heading font-semibold text-sm">Submit a Report</h3>

        <div className="space-y-2">
          <Label className="text-xs">Select Hostel *</Label>
          <Select value={selectedHostel} onValueChange={setSelectedHostel}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Choose a hostel" />
            </SelectTrigger>
            <SelectContent>
              {hostels.map(h => (
                <SelectItem key={h.id} value={h.id}>{h.hostel_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="misleading_listing">Misleading Listing</SelectItem>
              <SelectItem value="safety_concern">Safety Concern</SelectItem>
              <SelectItem value="pricing_issue">Pricing Issue</SelectItem>
              <SelectItem value="harassment">Harassment</SelectItem>
              <SelectItem value="maintenance">Maintenance Issue</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Description *</Label>
          <Textarea
            placeholder="Describe the issue in detail..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="rounded-xl min-h-[100px] resize-none"
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={submitting || !selectedHostel || !description.trim()}
          className="gap-2 rounded-xl"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Submit Report
        </Button>
      </div>

      {myAlerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-heading font-semibold text-sm">Your Reports</h3>
          {myAlerts.map((alert, i) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-card rounded-2xl border border-border/50 shadow-card p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-heading font-semibold text-sm">
                  {(alert.hostels as any)?.hostel_name || "Unknown Hostel"}
                </h4>
                <Badge className={`${statusStyles[alert.status] || statusStyles.pending} text-[10px]`}>
                  {alert.status === "pending" && <Clock className="w-3 h-3 mr-1" />}
                  {alert.status === "dismissed" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                  {alert.status === "confirmed" && <Shield className="w-3 h-3 mr-1" />}
                  {alert.status}
                </Badge>
              </div>
              {Array.isArray(alert.flags) && alert.flags.map((f: any, fi: number) => (
                <p key={fi} className="text-xs text-muted-foreground">
                  {f.description}
                </p>
              ))}
              <p className="text-[10px] text-muted-foreground mt-2">
                Submitted: {new Date(alert.created_at).toLocaleDateString()}
              </p>
              {alert.admin_notes && (
                <p className="text-xs text-muted-foreground mt-1 italic">Admin response: {alert.admin_notes}</p>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserFraudComplaints;
