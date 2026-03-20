import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, Mail, ArrowRight, ShieldCheck, Lock, Phone, Smartphone, User, Home, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import OTPInput from "@/components/auth/OTPInput";
import { cn } from "@/lib/utils";

type AuthStep = "details" | "otp" | "pending";
type ContactMethod = "email" | "mobile";
type SelectedRole = "tenant" | "owner";

const Signup = () => {
  const [step, setStep] = useState<AuthStep>("details");
  const [contactMethod, setContactMethod] = useState<ContactMethod>("mobile");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [fullName, setFullName] = useState("");
  const [selectedRole, setSelectedRole] = useState<SelectedRole>("tenant");
  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [resendCountdown, setResendCountdown] = useState(0);
  const verifyingRef = useRef(false);
  const navigate = useNavigate();
  const { user, rolesLoaded } = useAuth();

  const contactValue = contactMethod === "email" ? email.trim().toLowerCase() : mobile.trim().replace(/[\s\-()]/g, "");
  const contactDisplay = contactMethod === "email" ? email : mobile;

  useEffect(() => {
    if (user && rolesLoaded) {
      navigate("/dashboard");
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

  const validate = () => {
    if (!fullName.trim()) { toast.error("Please enter your full name."); return false; }
    if (contactMethod === "email") {
      if (!email.trim() || !/^[^s@]+@[^s@]+.[^s@]+$/.test(email.trim())) {
        toast.error("Please enter a valid email address."); return false;
      }
    } else {
      const cleaned = mobile.trim().replace(/[\s\-()]/g, "");
      if (!cleaned || !/^\+?\d{7,15}$/.test(cleaned)) {
        toast.error("Please enter a valid mobile number (e.g. +919876543210)."); return false;
      }
    }
    return true;
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !validate()) return;
    setSubmitting(true);

    try {
      const res = await supabase.functions.invoke("otp-auth", {
        body: {
          action: "send",
          contact: contactValue,
          contact_type: contactMethod === "mobile" ? "phone" : "email",
          role: selectedRole === "owner" ? "owner" : "user",
          full_name: fullName.trim(),
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
          role: selectedRole === "owner" ? "owner" : "user",
          full_name: fullName.trim(),
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
          // Complete registration with role
          const dbRole = selectedRole === "owner" ? "owner_pending" : "user";
          const profileData: Record<string, unknown> = { full_name: fullName.trim() };

          const regRes = await supabase.functions.invoke("complete-registration", {
            body: { selected_role: dbRole, profile_data: profileData },
          });

          if (regRes.error || regRes.data?.error) {
            toast.error(regRes.data?.error || "Registration failed.");
          } else if (selectedRole === "owner") {
            setStep("pending");
          } else {
            toast.success("Account created! Please sign in.");
            navigate("/login");
          }
        } else {
          toast.success("Welcome back! Redirecting...");
          // Existing user — redirect handled by auth context
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
          role: selectedRole === "owner" ? "owner" : "user",
          full_name: fullName.trim(),
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
            {step === "details" && (
              <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <div className="text-center">
                  <h1 className="font-heading font-bold text-2xl mb-1" style={{ color: "#2C2C2C" }}>Create Account</h1>
                  <p className="text-sm" style={{ color: "#6B6B6B" }}>Join StayNest to find or list properties</p>
                </div>

                {/* Role Selection Cards */}
                <div>
                  <Label className="text-sm font-medium mb-2 block" style={{ color: "#2C2C2C" }}>I want to</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedRole("tenant")}
                      className={cn(
                        "p-4 rounded-xl border-2 text-center transition-all",
                        selectedRole === "tenant"
                          ? "border-[#5A3E2B] bg-[#5A3E2B]/5"
                          : "border-[#E8E0D8] hover:border-[#D2B48C]"
                      )}
                    >
                      <User className={cn("w-5 h-5 mx-auto mb-2", selectedRole === "tenant" ? "text-[#5A3E2B]" : "text-[#9B9B9B]")} />
                      <span className={cn("text-sm font-semibold block", selectedRole === "tenant" ? "text-[#5A3E2B]" : "text-[#6B6B6B]")}>
                        Find a Stay
                      </span>
                      <span className="text-[10px] text-[#9B9B9B]">Tenant</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedRole("owner")}
                      className={cn(
                        "p-4 rounded-xl border-2 text-center transition-all",
                        selectedRole === "owner"
                          ? "border-[#5A3E2B] bg-[#5A3E2B]/5"
                          : "border-[#E8E0D8] hover:border-[#D2B48C]"
                      )}
                    >
                      <Home className={cn("w-5 h-5 mx-auto mb-2", selectedRole === "owner" ? "text-[#5A3E2B]" : "text-[#9B9B9B]")} />
                      <span className={cn("text-sm font-semibold block", selectedRole === "owner" ? "text-[#5A3E2B]" : "text-[#6B6B6B]")}>
                        List Property
                      </span>
                      <span className="text-[10px] text-[#9B9B9B]">Owner</span>
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSendOTP} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium" style={{ color: "#2C2C2C" }}>Full Name</Label>
                    <Input
                      type="text"
                      placeholder="Your full name"
                      className="h-11 rounded-xl border-[#E8E0D8] focus:border-[#5A3E2B] focus:ring-[#5A3E2B]/20"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>

                  {/* Contact method toggle */}
                  <div className="flex rounded-xl border border-[#E8E0D8] overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setContactMethod("mobile")}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-all",
                        contactMethod === "mobile"
                          ? "text-white"
                          : "text-[#6B6B6B] hover:bg-[#FAF7F2]"
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
                        contactMethod === "email"
                          ? "text-white"
                          : "text-[#6B6B6B] hover:bg-[#FAF7F2]"
                      )}
                      style={contactMethod === "email" ? { backgroundColor: "#5A3E2B" } : {}}
                    >
                      <Mail className="w-4 h-4" /> Email
                    </button>
                  </div>

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

                <p className="text-xs text-center" style={{ color: "#9B9B9B" }}>
                  Already have an account?{" "}
                  <Link to="/login" className="font-medium hover:underline" style={{ color: "#5A3E2B" }}>Sign In</Link>
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
                  {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</> : <>Verify & Continue <ShieldCheck className="w-4 h-4" /></>}
                </Button>

                <div className="flex items-center justify-between">
                  <button type="button" onClick={() => { setStep("details"); setOtp(""); }} className="text-sm hover:underline" style={{ color: "#6B6B6B" }}>
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

            {step === "pending" && (
              <motion.div key="pending" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-5 text-center py-4">
                <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center" style={{ backgroundColor: "#D2B48C20" }}>
                  <ShieldCheck className="w-8 h-8" style={{ color: "#5A3E2B" }} />
                </div>
                <h1 className="font-heading font-bold text-xl" style={{ color: "#2C2C2C" }}>Account Under Review</h1>
                <p className="text-sm leading-relaxed" style={{ color: "#6B6B6B" }}>
                  Your owner account is under admin review. You will be notified once approved.
                </p>
                <Link to="/">
                  <Button variant="outline" className="rounded-xl border-[#E8E0D8]">
                    Back to Home
                  </Button>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;
