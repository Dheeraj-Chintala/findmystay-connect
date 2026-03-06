import { useEffect, useState } from "react";
import { useNavigate, Routes, Route } from "react-router-dom";
import {
  BarChart3, Building2, MessageSquare, Star,
  Camera, Bed, ShieldCheck
} from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import OwnerAnalytics from "@/components/owner/OwnerAnalytics";
import OwnerPropertyManager from "@/components/owner/OwnerPropertyManager";
import OwnerBookingManager from "@/components/OwnerBookingManager";
import OwnerReviewManager from "@/components/owner/OwnerReviewManager";
import OwnerMediaVerification from "@/components/owner/OwnerMediaVerification";
import AddHostelForm from "@/components/owner/AddHostelForm";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

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
      { title: "Reviews", url: "/owner/reviews", icon: Star },
      { title: "Media Verification", url: "/owner/media", icon: Camera },
    ],
  },
];

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, rolesLoaded } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!authLoading && rolesLoaded && !user) navigate("/login");
  }, [user, authLoading, rolesLoaded]);

  if (authLoading || !rolesLoaded) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const handleRefresh = () => setRefreshKey(k => k + 1);

  return (
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
        <Route path="reviews" element={<OwnerReviewManager />} />
        <Route path="media" element={<OwnerMediaVerification />} />
      </Routes>
    </DashboardLayout>
  );
};

export default OwnerDashboard;
