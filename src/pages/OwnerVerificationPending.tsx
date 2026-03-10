import { Link } from "react-router-dom";
import { Clock, Building2, ShieldCheck, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

const OwnerVerificationPending = () => {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg text-center space-y-8"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg">
            <Building2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-heading font-extrabold text-2xl">StayNest</span>
        </div>

        {/* Status icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center">
            <Clock className="w-10 h-10 text-amber-600 dark:text-amber-400" />
          </div>
        </div>

        {/* Message */}
        <div className="space-y-3">
          <h1 className="font-heading font-bold text-2xl">Verification Pending</h1>
          <p className="text-muted-foreground leading-relaxed max-w-md mx-auto">
            Your owner account registration has been submitted successfully. Our admin team will review your details and verify your account.
          </p>
        </div>

        {/* Status card */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4 text-left">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <h3 className="font-heading font-semibold text-sm">What happens next?</h3>
          </div>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
              <span>Our team reviews your registration details and property information.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
              <span>Once verified, you'll receive access to the Owner Dashboard.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
              <span>You can then list your hostels and start receiving bookings.</span>
            </li>
          </ul>
        </div>

        {user?.email && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Mail className="w-4 h-4" />
            <span>Registered as <span className="font-medium text-foreground">{user.email}</span></span>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <Link to="/">
            <Button variant="outline" className="w-full">Back to Home</Button>
          </Link>
          <button onClick={handleSignOut} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Sign out
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default OwnerVerificationPending;
