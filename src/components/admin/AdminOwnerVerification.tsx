import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X, Loader2, UserCheck, Clock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface PendingOwner {
  user_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  hostel_name: string | null;
  property_location: string | null;
  created_at: string;
}

const AdminOwnerVerification = () => {
  const [pendingOwners, setPendingOwners] = useState<PendingOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchPendingOwners = async () => {
    setLoading(true);
    try {
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "owner_pending");

      if (rolesError) {
        console.error("Error fetching roles:", rolesError);
        setLoading(false);
        return;
      }

      if (!roles || roles.length === 0) {
        setPendingOwners([]);
        setLoading(false);
        return;
      }

      const userIds = roles.map((r) => r.user_id);

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, phone, hostel_name, property_location, created_at")
        .in("user_id", userIds);

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
      } else {
        setPendingOwners(profiles || []);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPendingOwners();
  }, []);

  const runVerificationAction = async (userId: string, action: "approve" | "reject") => {
    setActionLoading(userId);
    try {
      const { data, error } = await supabase.functions.invoke("owner-verification-action", {
        body: { target_user_id: userId, action },
      });

      if (error || data?.error) {
        toast.error(typeof data?.error === "string" ? data.error : "Failed to update role");
        setActionLoading(null);
        return;
      }

      toast.success(action === "approve" ? "Owner approved successfully!" : "Owner request rejected.");
      fetchPendingOwners();
    } catch {
      toast.error("Something went wrong");
    }
    setActionLoading(null);
  };

  const handleApprove = (userId: string) => runVerificationAction(userId, "approve");
  const handleReject = (userId: string) => runVerificationAction(userId, "reject");

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
        <div>
          <h2 className="text-xl font-heading font-bold">Owner Verification Requests</h2>
          <p className="text-sm text-muted-foreground">Review and approve pending owner registrations</p>
        </div>
        <Badge variant="secondary" className="gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          {pendingOwners.length} Pending
        </Badge>
      </div>

      {pendingOwners.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <UserCheck className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h3 className="font-heading font-semibold text-lg mb-1">No Pending Requests</h3>
            <p className="text-sm text-muted-foreground">All owner verification requests have been processed.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Owner Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Property Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingOwners.map((owner) => (
                  <TableRow key={owner.user_id}>
                    <TableCell className="font-medium">{owner.full_name || "—"}</TableCell>
                    <TableCell className="text-sm">{owner.email || "—"}</TableCell>
                    <TableCell className="text-sm">{owner.phone || "—"}</TableCell>
                    <TableCell className="text-sm">{owner.hostel_name || "—"}</TableCell>
                    <TableCell className="text-sm">{owner.property_location || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(owner.created_at), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-green-600 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-950"
                          disabled={actionLoading === owner.user_id}
                          onClick={() => handleApprove(owner.user_id)}
                        >
                          {actionLoading === owner.user_id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-destructive border-destructive/20 hover:bg-destructive/5"
                          disabled={actionLoading === owner.user_id}
                          onClick={() => handleReject(owner.user_id)}
                        >
                          <X className="w-3.5 h-3.5" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminOwnerVerification;
