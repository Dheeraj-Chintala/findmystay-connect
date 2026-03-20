import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type AppRole = "admin" | "owner" | "user" | "owner_pending";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Roles allowed to access this route. If empty, any authenticated user can access. */
  allowedRoles?: AppRole[];
  /** Where to redirect unauthenticated users */
  loginPath?: string;
  /** Where to redirect users without the required role */
  unauthorizedPath?: string;
}

const ProtectedRoute = ({
  children,
  allowedRoles = [],
  loginPath = "/login",
  unauthorizedPath = "/",
}: ProtectedRouteProps) => {
  const { user, hasRole, loading, rolesLoaded } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !rolesLoaded) return;

    if (!user) {
      navigate(loginPath);
      return;
    }

    // Handle owner_pending redirect
    if (hasRole("owner_pending" as AppRole)) {
      if (!allowedRoles.includes("owner_pending")) {
        navigate("/owner-verification-pending");
        return;
      }
    }

    // Check role access
    if (allowedRoles.length > 0) {
      const hasAccess = allowedRoles.some((role) => hasRole(role));
      if (!hasAccess) {
        toast.error("You don't have permission to access this page.");
        navigate(unauthorizedPath);
      }
    }
  }, [user, loading, rolesLoaded]);

  if (loading || !rolesLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
};

export default ProtectedRoute;
