import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Welcome from "./pages/Welcome";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AdminLogin from "./pages/AdminLogin";
import OwnerLogin from "./pages/OwnerLogin";
import Listings from "./pages/Listings";
import ListingDetail from "./pages/ListingDetail";
import BookingRequest from "./pages/BookingRequest";
import Reviews from "./pages/Reviews";
import OwnerDashboard from "./pages/OwnerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import UserDashboard from "./pages/UserDashboard";
import VerificationSubmit from "./pages/VerificationSubmit";
import PRPhotoshootRequest from "./pages/PRPhotoshootRequest";
import SelfVerifyCapture from "./pages/SelfVerifyCapture";
import MapView from "./pages/MapView";
import OwnerVerificationPending from "./pages/OwnerVerificationPending";
import LaundryHome from "./pages/LaundryHome";
import LaundryBookService from "./pages/LaundryBookService";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/owner-login" element={<OwnerLogin />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/listings" element={<Listings />} />
            <Route path="/listing/:id" element={<ListingDetail />} />
            <Route path="/booking/:id" element={<BookingRequest />} />
            <Route path="/listing/:id/reviews" element={<Reviews />} />
            {/* Dashboard routes */}
            <Route path="/owner/*" element={<OwnerDashboard />} />
            <Route path="/admin/*" element={<AdminDashboard />} />
            <Route path="/dashboard/*" element={<UserDashboard />} />
            {/* Legacy routes */}
            <Route path="/owner-dashboard" element={<OwnerDashboard />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/verify-property" element={<VerificationSubmit />} />
            <Route path="/pr-photoshoot-request" element={<PRPhotoshootRequest />} />
            <Route path="/self-verify-capture" element={<SelfVerifyCapture />} />
            <Route path="/owner-verification-pending" element={<OwnerVerificationPending />} />
            <Route path="/map" element={<MapView />} />
            <Route path="/laundry" element={<LaundryHome />} />
            <Route path="/laundry/book-service" element={<LaundryBookService />} />
            <Route path="/laundry/orders" element={<LaundryBookService />} />
            <Route path="/laundry/order-details" element={<LaundryBookService />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
