import { useEffect, useState } from "react";
import { MessageSquareWarning, CheckCircle2, Clock, AlertTriangle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface FraudAlertRow {
  id: string;
  hostel_id: string;
  risk_score: number;
  flags: unknown;
  status: string;
  created_at: string;
  hostels: { hostel_name: string } | null;
}

const statusStyles: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600",
  open: "bg-destructive/10 text-destructive",
  investigating: "bg-amber-500/10 text-amber-600",
  resolved: "bg-verified/10 text-verified",
  dismissed: "bg-muted text-muted-foreground",
};

const statusIcons: Record<string, typeof AlertTriangle> = {
  pending: Clock,
  open: AlertTriangle,
  investigating: Clock,
  resolved: CheckCircle2,
  dismissed: CheckCircle2,
};

const AdminComplaints = () => {
  const [alerts, setAlerts] = useState<FraudAlertRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("fraud_alerts")
        .select("id, hostel_id, risk_score, flags, status, created_at, hostels(hostel_name)")
        .order("created_at", { ascending: false });

      if (!error && data) setAlerts(data as FraudAlertRow[]);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-semibold text-lg flex items-center gap-2">
          <MessageSquareWarning className="w-5 h-5 text-destructive" /> Fraud alerts
        </h2>
        <Badge variant="secondary" className="font-mono">{alerts.length}</Badge>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
          <MessageSquareWarning className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No fraud alerts</p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((a, i) => {
            const StatusIcon = statusIcons[a.status] || AlertTriangle;
            const hostelName = a.hostels?.hostel_name || "Unknown hostel";
            const flagsStr =
              Array.isArray(a.flags) && a.flags.length
                ? JSON.stringify(a.flags)
                : typeof a.flags === "object" && a.flags !== null
                  ? JSON.stringify(a.flags)
                  : "—";
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="bg-card rounded-xl border border-border/50 p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                    <StatusIcon className="w-4 h-4 text-destructive" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="font-heading font-semibold text-sm">{hostelName}</p>
                      <Badge className={`${statusStyles[a.status] || statusStyles.pending} text-[10px]`}>{a.status}</Badge>
                      <Badge variant="outline" className="text-[10px]">
                        Risk {Number(a.risk_score).toFixed(0)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-3 font-mono">{flagsStr}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {format(new Date(a.created_at), "yyyy-MM-dd HH:mm")}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {a.status !== "resolved" && a.status !== "dismissed" && (
                      <Button variant="ghost" size="sm" className="h-7 text-[10px] px-2">
                        Review
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminComplaints;
