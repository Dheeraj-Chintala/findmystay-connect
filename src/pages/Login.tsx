import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Building2, Mail, ArrowRight, ShieldCheck, Lock, Smartphone, Loader2, KeyRound, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import OTPInput from "@/components/auth/OTPInput";
import { PhoneCountryInput } from "@/components/auth/PhoneCountryInput";
import { DEFAULT_DIAL_CODE } from "@/lib/phoneCountries";
import { cn } from "@/lib/utils";
import {
  composePhoneE164,
  normalizeEmail,
  isValidEmailInput,
  sendPhoneOtp,
  sendEmailOtp,
  verifyPhoneOtp,
  verifyEmailOtp,
  checkAccountStatusOrSignOut,
  isRecentlyCreatedUser,
} from "@/lib/otpAuth";
import { stashReferralCodeFromUrl, applyPendingReferralCode } from "@/lib/pendingReferral";

type AuthStep = "contact" | "otp";
type ContactMethod = "email" | "mobile";

const Login = () => {
  const [step, setStep] = useState<AuthStep>("contact");
  const [contactMethod, setContactMethod] = useState<ContactMethod>("mobile");
  const [email, setEmail] = useState("");
  const [phoneDialCode, setPhoneDialCode] = useState(DEFAULT_DIAL_CODE);
  const [phoneNational, setPhoneNational] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [resendCountdown, setResendCountdown] = useState(0);
  const verifyingRef = useRef(false);
  const postLoginNavRef = useRef(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get("redirect");
  const { user, hasRole, rolesLoaded } = useAuth();

  const phoneE164 = composePhoneE164(phoneDialCode, phoneNational);
  const emailNormalized = normalizeEmail(email);
  const contactDisplay =
    contactMethod === "email" ? email : `${phoneDialCode} ${phoneNational}`.trim();

  // Show redirect message
  useEffect(() => {
    if (redirectPath) {
      toast.info("Please sign in or create an account to continue booking.");
    }
  }, []);

  useEffect(() => {
    stashReferralCodeFromUrl(searchParams.get("ref"), searchParams.get("coupon"));
  }, [searchParams]);

  useEffect(() => {
    if (!user) postLoginNavRef.current = false;
  }, [user]);

  useEffect(() => {
    if (!user || !rolesLoaded || postLoginNavRef.current) return;
    postLoginNavRef.current = true;
    let cancelled = false;
    (async () => {
      await applyPendingReferralCode();
      if (cancelled) return;
      if (redirectPath) {
        const bookParam = searchParams.get("book");
        navigate(redirectPath + (bookParam ? `?book=${bookParam}` : ""));
      } else if (hasRole("admin")) navigate("/admin");
      else if (hasRole("owner")) navigate("/owner");
      else navigate("/dashboard");
    })();
    return () => {
      cancelled = true;
    };
  }, [user, rolesLoaded, redirectPath, hasRole, navigate, searchParams]);

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    // If email + password provided, do direct password login (no OTP)
    if (contactMethod === "email" && password.trim()) {
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        toast.error("Please enter a valid email address."); return;
      }
      setSubmitting(true);
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password: password.trim(),
        });
        if (error) {
          toast.error(error.message || "Invalid email or password.");
        } else if (data.session) {
          toast.success("Welcome back!");
          // Role-based redirect handled by useEffect watching user/rolesLoaded
        }
      } catch {
        toast.error("Something went wrong. Please try again.");
      }
      setSubmitting(false);
      return;
    }

    // Otherwise, proceed with OTP flow
    if (contactMethod === "email") {
      if (!isValidEmailInput(email)) {
        toast.error("Please enter a valid email address.");
        return;
      }
    } else {
      if (!phoneE164) {
        toast.error("Please enter a valid mobile number (country code and digits).");
        return;
      }
    }

    setSubmitting(true);
    try {
      if (contactMethod === "mobile") {
        const { error } = await sendPhoneOtp(phoneE164!, { shouldCreateUser: false });
        if (error) {
          toast.error(error.message || "Failed to send OTP");
        } else {
          toast.success("OTP sent!");
          setStep("otp");
          setCountdown(300);
          setResendCountdown(60);
        }
      } else {
        const { error } = await sendEmailOtp(emailNormalized, { shouldCreateUser: true });
        if (error) {
          toast.error(error.message || "Failed to send OTP");
        } else {
          toast.success("OTP sent! Check your email.");
          setStep("otp");
          setCountdown(300);
          setResendCountdown(60);
        }
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
    setSubmitting(false);
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6 || verifyingRef.current) return;
    if (contactMethod === "mobile" && !phoneE164) {
      toast.error("Invalid phone number.");
      return;
    }
    if (contactMethod === "email" && !isValidEmailInput(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    verifyingRef.current = true;
    setSubmitting(true);

    try {
      if (contactMethod === "mobile") {
        const verifyResult = await verifyPhoneOtp(phoneE164!, otp);
        if (verifyResult.error) {
          toast.error(verifyResult.error.message || "Verification failed");
        } else if (verifyResult.data.session && verifyResult.data.user) {
          const statusCheck = await checkAccountStatusOrSignOut();
          if (!statusCheck.ok) {
            toast.error(statusCheck.message);
          } else {
            toast.success("Welcome back!");
          }
        } else {
          toast.error("Failed to create session");
        }
      } else {
        const verifyResult = await verifyEmailOtp(emailNormalized, otp);
        if (verifyResult.error) {
          toast.error(verifyResult.error.message || "Verification failed");
        } else if (verifyResult.data.session && verifyResult.data.user) {
          const statusCheck = await checkAccountStatusOrSignOut();
          if (!statusCheck.ok) {
            toast.error(statusCheck.message);
          } else if (isRecentlyCreatedUser(verifyResult.data.user)) {
            toast.info("No account found. Please create an account first.");
            navigate("/signup");
          } else {
            toast.success("Welcome back!");
          }
        } else {
          toast.error("Failed to create session");
        }
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
      if (contactMethod === "mobile") {
        if (!phoneE164) {
          toast.error("Invalid phone number.");
          setSubmitting(false);
          return;
        }
        const { error } = await sendPhoneOtp(phoneE164, { shouldCreateUser: false });
        if (error) toast.error(error.message);
        else {
          toast.success("OTP resent!");
          setCountdown(300);
          setResendCountdown(60);
        }
      } else {
        const { error } = await sendEmailOtp(emailNormalized, { shouldCreateUser: true });
        if (error) toast.error(error.message);
        else {
          toast.success("OTP resent! Check your email.");
          setCountdown(300);
          setResendCountdown(60);
        }
      }
    } catch {
      toast.error("Failed to resend OTP");
    }
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

                <form onSubmit={handleLogin} className="space-y-4">
                  {contactMethod === "email" ? (
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium" style={{ color: "#2C2C2C" }}>Email Address</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9B9B9B]" />
                          <Input type="email" placeholder="you@example.com" className="pl-10 h-11 rounded-xl border-[#E8E0D8]" required value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium" style={{ color: "#2C2C2C" }}>Password <span className="text-xs font-normal" style={{ color: "#9B9B9B" }}>(optional — leave blank for OTP)</span></Label>
                        <div className="relative">
                          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9B9B9B]" />
                          <Input type={showPassword ? "text" : "password"} placeholder="Enter password" className="pl-10 pr-10 h-11 rounded-xl border-[#E8E0D8]" value={password} onChange={(e) => setPassword(e.target.value)} />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9B9B9B] hover:text-[#6B6B6B] transition-colors"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium" style={{ color: "#2C2C2C" }}>Mobile Number</Label>
                      <PhoneCountryInput
                        id="login-phone"
                        dialCode={phoneDialCode}
                        onDialCodeChange={setPhoneDialCode}
                        nationalNumber={phoneNational}
                        onNationalChange={setPhoneNational}
                        disabled={submitting}
                      />
                    </div>
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full gap-2 rounded-xl text-white font-semibold"
                    style={{ backgroundColor: "#5A3E2B" }}
                    disabled={submitting}
                  >
                    {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> {password.trim() ? "Signing in..." : "Sending OTP..."}</> : <>{password.trim() ? "Sign In" : "Send OTP"} <ArrowRight className="w-4 h-4" /></>}
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
