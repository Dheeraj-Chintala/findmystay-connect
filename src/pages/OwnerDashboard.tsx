import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import {
  BarChart3, Building2, Users, Star,
  Camera, Bed, ShirtIcon, WashingMachine
} from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import OwnerAnalytics from "@/components/owner/OwnerAnalytics";
import OwnerPropertyManager from "@/components/owner/OwnerPropertyManager";
import OwnerBookingManager from "@/components/OwnerBookingManager";
import OwnerReviewManager from "@/components/owner/OwnerReviewManager";
import OwnerMediaVerification from "@/components/owner/OwnerMediaVerification";
import OwnerMembers from "@/components/owner/OwnerMembers";
import OwnerLaundryRequests from "@/components/owner/OwnerLaundryRequests";
import OwnerLaundryServices from "@/components/owner/OwnerLaundryServices";
import AddHostelForm from "@/components/owner/AddHostelForm";

const sidebarGroups = [
  {
    label: "Overview",
    items: [
      { title: "Analytics", url: "/owner", icon: BarChart3 },
    ],
  },
  {
    label: "Manage",
    items: [
      { title: "Properties", url: "/owner/properties", icon: Building2 },
      { title: "Bookings", url: "/owner/bookings", icon: Bed },
      { title: "Members", url: "/owner/members", icon: Users },
      { title: "Laundry Services", url: "/owner/laundry-services", icon: WashingMachine },
      { title: "Laundry Requests", url: "/owner/laundry", icon: ShirtIcon },
      { title: "Reviews", url: "/owner/reviews", icon: Star },
      { title: "Media Verification", url: "/owner/media", icon: Camera },
    ],
  },
];

const OwnerDashboard = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const handleRefresh = () => setRefreshKey(k => k + 1);

  return (
    <ProtectedRoute allowedRoles={["owner"]} loginPath="/login" unauthorizedPath="/">
      <DashboardLayout
        title="StayNest"
        subtitle="Owner Portal"
        groups={sidebarGroups}
        pageTitle="Owner Dashboard"
        headerRight={<AddHostelForm onSuccess={handleRefresh} />}
      >
        <Routes>
          <Route index element={<OwnerAnalytics key={refreshKey} />} />
          <Route path="properties" element={<OwnerPropertyManager key={refreshKey} />} />
          <Route path="bookings" element={<OwnerBookingManager />} />
          <Route path="members" element={<OwnerMembers />} />
          <Route path="laundry-services" element={<OwnerLaundryServices />} />
          <Route path="laundry" element={<OwnerLaundryRequests />} />
          <Route path="reviews" element={<OwnerReviewManager />} />
          <Route path="media" element={<OwnerMediaVerification />} />
        </Routes>
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default OwnerDashboard;
