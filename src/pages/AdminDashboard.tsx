import { useEffect } from "react";
import { useNavigate, Routes, Route } from "react-router-dom";
import {
  BarChart3, BadgeCheck, Users, AlertTriangle,
  MessageSquare, Building2, ShieldCheck
} from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import AdminAnalytics from "@/components/admin/AdminAnalytics";
import AdminUserManagement from "@/components/admin/AdminUserManagement";
import AdminReviewModeration from "@/components/admin/AdminReviewModeration";
import AdminFraudAlerts from "@/components/AdminFraudAlerts";
import AdminMediaVerification from "@/components/AdminMediaVerification";
import AdminHostelApprovals from "@/components/admin/AdminHostelApprovals";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const sidebarGroups = [
  {
    label: "Overview",
    items: [
      { title: "Analytics", url: "/admin", icon: BarChart3 },
    ],
  },
  {
    label: "Management",
    items: [
      { title: "Hostel Approvals", url: "/admin/approvals", icon: BadgeCheck },
      { title: "Users", url: "/admin/users", icon: Users },
      { title: "Fraud Alerts", url: "/admin/fraud", icon: AlertTriangle },
      { title: "Reviews", url: "/admin/reviews", icon: MessageSquare },
      { title: "Media Verification", url: "/admin/media", icon: Building2 },
    ],
  },
];

const AdminDashboard = () => {
  const { user, hasRole, loading: authLoading, rolesLoaded } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && rolesLoaded) {
      if (!user) { navigate("/login"); return; }
      if (!hasRole("admin")) { toast.error("Admin access required"); navigate("/"); return; }
    }
  }, [user, authLoading, rolesLoaded]);

  if (authLoading || !rolesLoaded) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <DashboardLayout
      title="StayNest"
      subtitle="Admin Panel"
      groups={sidebarGroups}
      pageTitle="Admin Control Panel"
      headerRight={
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span className="hidden sm:inline">Platform Admin</span>
        </div>
      }
    >
      <Routes>
        <Route index element={<AdminAnalytics />} />
        <Route path="approvals" element={<AdminHostelApprovals />} />
        <Route path="users" element={<AdminUserManagement />} />
        <Route path="fraud" element={<AdminFraudAlerts />} />
        <Route path="reviews" element={<AdminReviewModeration />} />
        <Route path="media" element={<AdminMediaVerification />} />
      </Routes>
    </DashboardLayout>
  );
};

export default AdminDashboard;
