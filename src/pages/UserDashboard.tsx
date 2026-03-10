import { useEffect } from "react";
import { useNavigate, Routes, Route } from "react-router-dom";
import {
  Home, Search, Heart, Calendar, Star, User,
  Sparkles, MapPin, ShirtIcon, Gift
} from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import UserHome from "@/components/user/UserHome";
import ReferAndEarn from "@/components/user/ReferAndEarn";
import UserSearch from "@/components/user/UserSearch";
import UserSaved from "@/components/user/UserSaved";
import UserBookings from "@/components/user/UserBookings";
import UserReviews from "@/components/user/UserReviews";
import UserProfile from "@/components/user/UserProfile";
import UserLaundry from "@/components/user/UserLaundry";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

const sidebarGroups = [
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
    items: [
      { title: "Bookings", url: "/dashboard/bookings", icon: Calendar },
      { title: "Laundry", url: "/dashboard/laundry", icon: ShirtIcon },
      { title: "Refer & Earn", url: "/dashboard/referrals", icon: Gift },
      { title: "Reviews", url: "/dashboard/reviews", icon: Star },
    ],
  },
  {
    label: "Account",
    items: [
      { title: "Profile", url: "/dashboard/profile", icon: User },
    ],
  },
];

const UserDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, rolesLoaded } = useAuth();

  useEffect(() => {
    if (!authLoading && rolesLoaded && !user) navigate("/login");
  }, [user, authLoading, rolesLoaded]);

  if (authLoading || !rolesLoaded) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
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
        <Route path="bookings" element={<UserBookings />} />
        <Route path="laundry" element={<UserLaundry />} />
        <Route path="referrals" element={<ReferAndEarn />} />
        <Route path="reviews" element={<UserReviews />} />
        <Route path="profile" element={<UserProfile />} />
      </Routes>
    </DashboardLayout>
  );
};

export default UserDashboard;
