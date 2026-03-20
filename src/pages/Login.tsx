import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Building2, Mail, ArrowRight, ShieldCheck, Lock, Phone, Smartphone, Loader2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import OTPInput from "@/components/auth/OTPInput";
import { cn } from "@/lib/utils";

type AuthStep = "contact" | "otp";
type ContactMethod = "email" | "mobile";

const Login = () => {
  const [step, setStep] = useState<AuthStep>("contact");
  const [contactMethod, setContactMethod] = useState<ContactMethod>("mobile");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [resendCountdown, setResendCountdown] = useState(0);
  const verifyingRef = useRef(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get("redirect");
  const { user, hasRole, rolesLoaded } = useAuth();

  const contactValue = contactMethod === "email" ? email.trim().toLowerCase() : mobile.trim().replace(/[\s\-()]/g, "");
  const contactDisplay = contactMethod === "email" ? email : mobile;

  // Show redirect message
  useEffect(() => {
    if (redirectPath) {
      toast.info("Please sign in or create an account to continue booking.");
    }
  }, []);

  useEffect(() => {
    if (user && rolesLoaded) {
      if (redirectPath) {
        const bookParam = searchParams.get("book");
        navigate(redirectPath + (bookParam ? `?book=${bookParam}` : ""));
      } else if (hasRole("admin")) navigate("/admin");
      else if (hasRole("owner")) navigate("/owner");
      else if (hasRole("owner_pending" as any)) navigate("/owner-verification-pending");
      else navigate("/dashboard");
    }
  }, [user, rolesLoaded]);

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  useEffect(() => {
    if (resendCountdown > 0) {
      const t = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendCountdown]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (contactMethod === "email") {
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        toast.error("Please enter a valid email address."); return;
      }
    } else {
      const cleaned = mobile.trim().replace(/[\s\-()]/g, "");
      if (!cleaned || !/^\+?\d{7,15}$/.test(cleaned)) {
        toast.error("Please enter a valid mobile number (e.g. +919876543210)."); return;
      }
    }

    setSubmitting(true);
    try {
      const res = await supabase.functions.invoke("otp-auth", {
        body: {
          action: "send",
          contact: contactValue,
          contact_type: contactMethod === "mobile" ? "phone" : "email",
          role: "user",
          full_name: "",
        },
      });
      if (res.error || res.data?.error) {
        toast.error(res.data?.error || res.error?.message || "Failed to send OTP");
      } else {
        toast.success(res.data?.message || "OTP sent!");
        setStep("otp");
        setCountdown(300);
        setResendCountdown(60);
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
        body: {
          action: "verify",
          contact: contactValue,
          contact_type: contactMethod === "mobile" ? "phone" : "email",
          otp,
          role: "user",
          full_name: "",
        },
      });

      if (res.error || res.data?.error) {
        toast.error(res.data?.error || "Verification failed");
      } else if (res.data?.session) {
        await supabase.auth.setSession({
          access_token: res.data.session.access_token,
          refresh_token: res.data.session.refresh_token,
        });

        if (res.data.isNewUser) {
          toast.info("No account found. Please create an account first.");
          navigate("/signup");
        } else {
          toast.success("Welcome back!");
        }
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
    if (resendCountdown > 0) return;
    setSubmitting(true);
    try {
      const res = await supabase.functions.invoke("otp-auth", {
        body: {
          action: "send",
          contact: contactValue,
          contact_type: contactMethod === "mobile" ? "phone" : "email",
          role: "user",
          full_name: "",
        },
      });
      if (res.data?.error) toast.error(res.data.error);
      else { toast.success("OTP resent!"); setCountdown(300); setResendCountdown(60); }
    } catch { toast.error("Failed to resend OTP"); }
    setSubmitting(false);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

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
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="font-heading font-extrabold text-2xl" style={{ color: "#2C2C2C" }}>StayNest</span>
        </Link>

        <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(90,62,43,0.08)] border border-[#E8E0D8] p-8">
          <AnimatePresence mode="wait">
            {step === "contact" && (
              <motion.div key="contact" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <div className="text-center">
                  <h1 className="font-heading font-bold text-2xl mb-1" style={{ color: "#2C2C2C" }}>Welcome Back</h1>
                  <p className="text-sm" style={{ color: "#6B6B6B" }}>
                    {redirectPath ? "Sign in to continue booking" : "Sign in to your StayNest account"}
                  </p>
                </div>

                {/* Contact method toggle */}
                <div className="flex rounded-xl border border-[#E8E0D8] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setContactMethod("mobile")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-all",
                      contactMethod === "mobile" ? "text-white" : "text-[#6B6B6B] hover:bg-[#FAF7F2]"
                    )}
                    style={contactMethod === "mobile" ? { backgroundColor: "#5A3E2B" } : {}}
                  >
                    <Smartphone className="w-4 h-4" /> Mobile
                  </button>
                  <button
                    type="button"
                    onClick={() => setContactMethod("email")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-all",
                      contactMethod === "email" ? "text-white" : "text-[#6B6B6B] hover:bg-[#FAF7F2]"
                    )}
                    style={contactMethod === "email" ? { backgroundColor: "#5A3E2B" } : {}}
                  >
                    <Mail className="w-4 h-4" /> Email
                  </button>
                </div>

                <form onSubmit={handleSendOTP} className="space-y-4">
                  {contactMethod === "email" ? (
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium" style={{ color: "#2C2C2C" }}>Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9B9B9B]" />
                        <Input type="email" placeholder="you@example.com" className="pl-10 h-11 rounded-xl border-[#E8E0D8]" required value={email} onChange={(e) => setEmail(e.target.value)} />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium" style={{ color: "#2C2C2C" }}>Mobile Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9B9B9B]" />
                        <Input type="tel" placeholder="+91 9876543210" className="pl-10 h-11 rounded-xl border-[#E8E0D8]" required value={mobile} onChange={(e) => setMobile(e.target.value)} />
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full gap-2 rounded-xl text-white font-semibold"
                    style={{ backgroundColor: "#5A3E2B" }}
                    disabled={submitting}
                  >
                    {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending OTP...</> : <>Send OTP <ArrowRight className="w-4 h-4" /></>}
                  </Button>
                </form>

                <div className="flex items-center gap-2 p-3 rounded-xl" style={{ backgroundColor: "#FAF7F2", border: "1px solid #E8E0D8" }}>
                  <Lock className="w-4 h-4 shrink-0" style={{ color: "#9B9B9B" }} />
                  <p className="text-xs" style={{ color: "#9B9B9B" }}>Secure OTP verification • 5 min expiry</p>
                </div>

                <p className="text-xs text-center" style={{ color: "#9B9B9B" }}>
                  Don't have an account?{" "}
                  <Link to="/signup" className="font-medium hover:underline" style={{ color: "#5A3E2B" }}>Create Account</Link>
                </p>
              </motion.div>
            )}

            {step === "otp" && (
              <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <div className="text-center">
                  <h1 className="font-heading font-bold text-2xl mb-1" style={{ color: "#2C2C2C" }}>Verify OTP</h1>
                  <p className="text-sm" style={{ color: "#6B6B6B" }}>
                    Enter the 6-digit code sent to <span className="font-medium" style={{ color: "#2C2C2C" }}>{contactDisplay}</span>
                  </p>
                </div>

                <OTPInput value={otp} onChange={setOtp} onComplete={handleVerifyOTP} />

                <div className="text-center">
                  {countdown > 0 ? (
                    <p className="text-sm" style={{ color: "#6B6B6B" }}>Expires in <span className="font-mono font-semibold" style={{ color: "#5A3E2B" }}>{formatTime(countdown)}</span></p>
                  ) : (
                    <p className="text-sm text-red-500 font-medium">Code expired</p>
                  )}
                </div>

                <Button
                  onClick={handleVerifyOTP}
                  size="lg"
                  className="w-full gap-2 rounded-xl text-white font-semibold"
                  style={{ backgroundColor: "#5A3E2B" }}
                  disabled={submitting || otp.length !== 6}
                >
                  {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</> : <>Verify & Sign In <ShieldCheck className="w-4 h-4" /></>}
                </Button>

                <div className="flex items-center justify-between">
                  <button type="button" onClick={() => { setStep("contact"); setOtp(""); }} className="text-sm hover:underline" style={{ color: "#6B6B6B" }}>
                    ← Change {contactMethod === "email" ? "email" : "number"}
                  </button>
                  <button type="button" onClick={handleResendOTP} disabled={resendCountdown > 0 || submitting} className="text-sm font-medium disabled:opacity-40" style={{ color: "#5A3E2B" }}>
                    {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : "Resend Code"}
                  </button>
                </div>

                <div className="flex items-center gap-2 p-3 rounded-xl" style={{ backgroundColor: "#FAF7F2", border: "1px solid #E8E0D8" }}>
                  <Lock className="w-4 h-4 shrink-0" style={{ color: "#9B9B9B" }} />
                  <p className="text-xs" style={{ color: "#9B9B9B" }}>Secure OTP verification • 5 min expiry</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
