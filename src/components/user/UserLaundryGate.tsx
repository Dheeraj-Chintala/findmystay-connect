import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import UserLaundry from "@/components/user/UserLaundry";
import { useLaundryEligible } from "@/hooks/useLaundryEligible";

/**
 * Renders laundry booking only when the user has an active membership at a hostel with laundry.
 */
const UserLaundryGate = () => {
  const { loading, eligible, hostelId } = useLaundryEligible();

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!eligible || !hostelId) {
    return <Navigate to="/dashboard/my-hostel" replace />;
  }

  return <UserLaundry orderHostelId={hostelId} />;
};

export default UserLaundryGate;
