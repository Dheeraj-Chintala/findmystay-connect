import { Routes, Route } from "react-router-dom";
import {
  BarChart3, BadgeCheck, Users, AlertTriangle,
  MessageSquare, Building2, ShieldCheck, Activity, ShirtIcon
} from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AdminAnalytics from "@/components/admin/AdminAnalytics";
import AdminUserManagement from "@/components/admin/AdminUserManagement";
import AdminReviewModeration from "@/components/admin/AdminReviewModeration";
import AdminFraudAlerts from "@/components/AdminFraudAlerts";
import AdminMediaVerification from "@/components/AdminMediaVerification";
import AdminHostelApprovals from "@/components/admin/AdminHostelApprovals";
import AdminActivityMonitor from "@/components/admin/AdminActivityMonitor";
import AdminLaundry from "@/components/admin/AdminLaundry";

const sidebarGroups = [
  {
    label: "Overview",
    items: [
      { title: "Analytics", url: "/admin", icon: BarChart3 },
      { title: "Activity Monitor", url: "/admin/activity", icon: Activity },
    ],
  },
  {
    label: "Management",
    items: [
      { title: "Hostel Approvals", url: "/admin/approvals", icon: BadgeCheck },
      { title: "Users", url: "/admin/users", icon: Users },
      { title: "Fraud Alerts & Complaints", url: "/admin/fraud", icon: AlertTriangle },
      { title: "Reviews", url: "/admin/reviews", icon: MessageSquare },
      { title: "Media Verification", url: "/admin/media", icon: Building2 },
      { title: "Laundry", url: "/admin/laundry", icon: ShirtIcon },
    ],
  },
];

const AdminDashboard = () => {
  return (
    <ProtectedRoute allowedRoles={["admin"]} loginPath="/admin/login">
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
          <Route path="activity" element={<AdminActivityMonitor />} />
          <Route path="approvals" element={<AdminHostelApprovals />} />
          <Route path="users" element={<AdminUserManagement />} />
          <Route path="fraud" element={<AdminFraudAlerts />} />
          <Route path="reviews" element={<AdminReviewModeration />} />
          <Route path="media" element={<AdminMediaVerification />} />
          <Route path="laundry" element={<AdminLaundry />} />
        </Routes>
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default AdminDashboard;
