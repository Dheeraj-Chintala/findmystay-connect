import { Routes, Route } from "react-router-dom";
import { useMemo } from "react";
import {
  Home, Search, Heart, Calendar, Star, User,
  Building2, ShirtIcon, Gift, AlertTriangle,
} from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import UserHome from "@/components/user/UserHome";
import ReferAndEarn from "@/components/user/ReferAndEarn";
import UserSearch from "@/components/user/UserSearch";
import UserSaved from "@/components/user/UserSaved";
import UserBookings from "@/components/user/UserBookings";
import UserReviews from "@/components/user/UserReviews";
import UserProfile from "@/components/user/UserProfile";
import UserLaundryGate from "@/components/user/UserLaundryGate";
import UserHostelStatus from "@/components/user/UserHostelStatus";
import UserFraudComplaints from "@/components/user/UserFraudComplaints";
import { useLaundryEligible } from "@/hooks/useLaundryEligible";

const UserDashboard = () => {
  const { eligible: showLaundry, loading: laundryLoading } = useLaundryEligible();

  const sidebarGroups = useMemo(() => {
    const activityItems = [
      { title: "My Hostel", url: "/dashboard/my-hostel", icon: Building2 },
      { title: "Bookings", url: "/dashboard/bookings", icon: Calendar },
      ...(laundryLoading ? [] : showLaundry ? [{ title: "Laundry", url: "/dashboard/laundry", icon: ShirtIcon }] : []),
      { title: "Refer & Earn", url: "/dashboard/referrals", icon: Gift },
      { title: "Reviews", url: "/dashboard/reviews", icon: Star },
      { title: "Report Issue", url: "/dashboard/complaints", icon: AlertTriangle },
    ];

    return [
      {
        label: "Discover",
        items: [
          { title: "Home", url: "/dashboard", icon: Home },
          { title: "Search", url: "/dashboard/search", icon: Search },
          { title: "Saved", url: "/dashboard/saved", icon: Heart },
        ],
      },
      {
        label: "Activity",
        items: activityItems,
      },
      {
        label: "Account",
        items: [{ title: "Profile", url: "/dashboard/profile", icon: User }],
      },
    ];
  }, [showLaundry, laundryLoading]);

  return (
    <ProtectedRoute allowedRoles={["user"]} loginPath="/login">
      <DashboardLayout
        title="StayNest"
        subtitle="Your Dashboard"
        groups={sidebarGroups}
        pageTitle="Dashboard"
      >
        <Routes>
          <Route index element={<UserHome />} />
          <Route path="search" element={<UserSearch />} />
          <Route path="saved" element={<UserSaved />} />
          <Route path="my-hostel" element={<UserHostelStatus />} />
          <Route path="bookings" element={<UserBookings />} />
          <Route path="laundry" element={<UserLaundryGate />} />
          <Route path="referrals" element={<ReferAndEarn />} />
          <Route path="reviews" element={<UserReviews />} />
          <Route path="complaints" element={<UserFraudComplaints />} />
          <Route path="profile" element={<UserProfile />} />
        </Routes>
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default UserDashboard;
