import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, Mail, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import OTPInput from "@/components/auth/OTPInput";
import RoleSelector from "@/components/auth/RoleSelector";

type AuthStep = "contact" | "otp" | "role";

const Login = () => {
  const [step, setStep] = useState<AuthStep>("contact");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"user" | "owner">("user");
  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isNewUser, setIsNewUser] = useState(false);
  const verifyingRef = useRef(false);
  const navigate = useNavigate();
  const { user, hasRole, rolesLoaded } = useAuth();

  useEffect(() => {
    if (user && rolesLoaded) {
      redirectByRole();
    }
  }, [user, rolesLoaded]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const redirectByRole = () => {
    if (hasRole("admin")) navigate("/admin");
    else if (hasRole("owner")) navigate("/owner");
    else navigate("/dashboard");
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);

    try {
      const res = await supabase.functions.invoke("otp-auth", {
        body: { action: "send", contact: email, role, full_name: fullName },
      });

      if (res.error) {
        toast.error(res.error.message || "Failed to send OTP");
      } else if (res.data?.error) {
        toast.error(res.data.error);
      } else {
        toast.success("OTP sent to your email!");
        setStep("otp");
        setCountdown(300); // 5 minutes
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
    setSubmitting(false);
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6 || verifyingRef.current) return;
    verifyingRef.current = true;
    setSubmitting(true);

    try {
      const res = await supabase.functions.invoke("otp-auth", {
        body: { action: "verify", contact: email, otp, role, full_name: fullName },
      });

      if (res.error) {
        toast.error("Verification failed");
      } else if (res.data?.error) {
        toast.error(res.data.error);
      } else if (res.data?.session) {
        // Set the session in the client
        await supabase.auth.setSession({
          access_token: res.data.session.access_token,
          refresh_token: res.data.session.refresh_token,
        });
        toast.success(res.data.message || "Welcome!");
        // Redirect happens via useEffect
      } else {
        toast.error("Failed to create session");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
    setSubmitting(false);
    verifyingRef.current = false;
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    setSubmitting(true);
    try {
      const res = await supabase.functions.invoke("otp-auth", {
        body: { action: "send", contact: email, role, full_name: fullName },
      });
      if (res.data?.error) {
        toast.error(res.data.error);
      } else {
        toast.success("OTP resent!");
        setCountdown(300);
      }
    } catch {
      toast.error("Failed to resend OTP");
    }
    setSubmitting(false);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-hero relative items-center justify-center p-12">
        <div className="absolute top-1/4 -left-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-64 h-64 bg-accent/20 rounded-full blur-3xl" />
        <div className="relative z-10 text-center max-w-md">
          <div className="flex items-center justify-center gap-2.5 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg">
              <Building2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-heading font-extrabold text-3xl text-primary-foreground">StayNest</span>
          </div>
          <h2 className="font-heading font-bold text-3xl text-primary-foreground mb-4">Secure OTP Verification</h2>
          <p className="text-primary-foreground/50 leading-relaxed">
            No passwords needed. We send a secure 6-digit code to your email for instant, safe access.
          </p>
          <div className="mt-8 flex items-center justify-center gap-2 text-primary-foreground/40">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-sm">256-bit encrypted • 5 min expiry • Rate limited</span>
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <Link to="/" className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-heading font-extrabold text-xl">StayNest</span>
          </Link>

          <AnimatePresence mode="wait">
            {step === "contact" && (
              <motion.div key="contact" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div>
                  <h1 className="font-heading font-bold text-2xl mb-1">Welcome to StayNest</h1>
                  <p className="text-muted-foreground text-sm">Enter your details to receive a verification code</p>
                </div>

                <RoleSelector role={role} onRoleChange={setRole} />

                <form onSubmit={handleSendOTP} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Full Name</Label>
                    <Input
                      type="text"
                      placeholder="Your full name"
                      className="h-11 rounded-xl"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        className="pl-10 h-11 rounded-xl"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button type="submit" variant="hero" size="lg" className="w-full gap-2" disabled={submitting}>
                    {submitting ? "Sending OTP..." : "Send Verification Code"}
                    {!submitting && <ArrowRight className="w-4 h-4" />}
                  </Button>
                </form>
              </motion.div>
            )}

            {step === "otp" && (
              <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div>
                  <h1 className="font-heading font-bold text-2xl mb-1">Enter Verification Code</h1>
                  <p className="text-muted-foreground text-sm">
                    We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>
                  </p>
                </div>

                <OTPInput value={otp} onChange={setOtp} onComplete={handleVerifyOTP} />

                {/* Countdown timer */}
                <div className="text-center">
                  {countdown > 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Code expires in{" "}
                      <span className="font-mono font-semibold text-primary">{formatTime(countdown)}</span>
                    </p>
                  ) : (
                    <p className="text-sm text-destructive font-medium">Code expired</p>
                  )}
                </div>

                <Button
                  onClick={handleVerifyOTP}
                  variant="hero"
                  size="lg"
                  className="w-full gap-2"
                  disabled={submitting || otp.length !== 6}
                >
                  {submitting ? "Verifying..." : "Verify & Continue"}
                  {!submitting && <ShieldCheck className="w-4 h-4" />}
                </Button>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => { setStep("contact"); setOtp(""); setCountdown(0); }}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    ← Change email
                  </button>
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={countdown > 0 || submitting}
                    className="text-sm text-primary hover:text-primary/80 transition-colors disabled:text-muted-foreground disabled:cursor-not-allowed"
                  >
                    Resend Code
                  </button>
                </div>

                <p className="text-xs text-center text-muted-foreground">
                  Check your spam folder if you don't see the email
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
