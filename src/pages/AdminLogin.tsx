import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, Lock, Mail, Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { user, hasRole, rolesLoaded } = useAuth();

  useEffect(() => {
    if (user && rolesLoaded) {
      if (hasRole("admin")) {
        navigate("/admin");
      }
    }
  }, [user, rolesLoaded]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { toast.error("Please enter your email."); return; }
    if (!password) { toast.error("Please enter your password."); return; }
    setSubmitting(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        toast.error(error.message || "Invalid credentials");
        setSubmitting(false);
        return;
      }

      if (data.session) {
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id)
          .eq("role", "admin");

        if (!roles || roles.length === 0) {
          await supabase.auth.signOut();
          toast.error("Access denied. Admin privileges required.");
          setSubmitting(false);
          return;
        }

        toast.success("Welcome, Admin!");
        navigate("/admin");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "#FAF7F2" }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 justify-center mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#5A3E2B" }}>
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <span className="font-heading font-extrabold text-2xl" style={{ color: "#2C2C2C" }}>StayNest Admin</span>
        </Link>

        <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(90,62,43,0.08)] border border-[#E8E0D8] p-8">
          <div className="space-y-5">
            {/* Warning banner */}
            <div className="flex items-start gap-2 p-3 rounded-xl" style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA" }}>
              <Lock className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-600">
                Restricted access. Authorized administrators only. Unauthorized attempts are logged.
              </p>
            </div>

            <div className="text-center">
              <h1 className="font-heading font-bold text-2xl mb-1" style={{ color: "#2C2C2C" }}>Admin Login</h1>
              <p className="text-sm" style={{ color: "#6B6B6B" }}>Enter your credentials to access the control panel</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium" style={{ color: "#2C2C2C" }}>Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9B9B9B]" />
                  <Input
                    type="email"
                    placeholder="admin@staynest.com"
                    className="pl-10 h-11 rounded-xl border-[#E8E0D8]"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium" style={{ color: "#2C2C2C" }}>Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9B9B9B]" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 h-11 rounded-xl border-[#E8E0D8]"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full gap-2 rounded-xl text-white font-semibold"
                style={{ backgroundColor: "#5A3E2B" }}
                disabled={submitting}
              >
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Authenticating...</> : <>Access Admin Panel <ShieldCheck className="w-4 h-4" /></>}
              </Button>
            </form>

            <p className="text-xs text-center" style={{ color: "#9B9B9B" }}>
              Not an admin?{" "}
              <Link to="/login" className="font-medium hover:underline" style={{ color: "#5A3E2B" }}>Go to public login</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
