import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import UserLaundry from "@/components/user/UserLaundry";
import { useLaundryEligible } from "@/hooks/useLaundryEligible";

const LaundryBookService = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { loading: laundryLoading, eligible, hostelId } = useLaundryEligible();

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user || laundryLoading) return;
    if (!eligible) navigate("/dashboard/my-hostel", { replace: true });
  }, [user, laundryLoading, eligible, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  if (laundryLoading || !eligible || !hostelId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <UserLaundry orderHostelId={hostelId} />
      </main>
    </div>
  );
};

export default LaundryBookService;
