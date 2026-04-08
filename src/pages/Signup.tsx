import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Building2, Mail, ArrowRight, ShieldCheck, Lock, Smartphone, User, Home, Loader2 } from "lucide-react";
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
} from "@/lib/otpAuth";
import { getEdgeFunctionErrorMessage } from "@/lib/edgeFunctionErrors";
import { stashReferralCodeFromUrl, applyPendingReferralCode } from "@/lib/pendingReferral";

type AuthStep = "details" | "otp";
type ContactMethod = "email" | "mobile";
type SelectedRole = "tenant" | "owner";
type RegistrationRole = "user" | "owner";

const Signup = () => {
  const [step, setStep] = useState<AuthStep>("details");
  const [contactMethod, setContactMethod] = useState<ContactMethod>("mobile");
  const [email, setEmail] = useState("");
  const [phoneDialCode, setPhoneDialCode] = useState(DEFAULT_DIAL_CODE);
  const [phoneNational, setPhoneNational] = useState("");
  const [fullName, setFullName] = useState("");
  const [selectedRole, setSelectedRole] = useState<SelectedRole>("tenant");
  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [resendCountdown, setResendCountdown] = useState(0);

  const verifyingRef = useRef(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, rolesLoaded, refreshRoles } = useAuth();

  const phoneE164 = composePhoneE164(phoneDialCode, phoneNational);
  const emailNormalized = normalizeEmail(email);

  const contactDisplay =
    contactMethod === "email"
      ? email
      : `${phoneDialCode} ${phoneNational}`.trim();

  /* -------------------------------------------- */
  /* Invoke Edge Function */
  /* -------------------------------------------- */

  const invokeCompleteRegistration = async (
    selectedRole: RegistrationRole,
    profileData: Record<string, unknown>
  ) => {
    const maxAttempts = 2;
  
    const {
      data: { session },
    } = await supabase.auth.getSession();
  
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const result = await supabase.functions.invoke("complete-registration", {
        body: {
          selected_role: selectedRole,
          profile_data: profileData,
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });
  
      if (!result.error && !result.data?.error) {
        return result;
      }
  
      const isNetworkError = /failed to send a request/i.test(
        result.error?.message ?? ""
      );
  
      if (!isNetworkError || attempt === maxAttempts) {
        return result;
      }
  
      await new Promise((r) => setTimeout(r, 700));
    }
  
    return { data: null, error: new Error("Registration failed.") };
  };

  /* -------------------------------------------- */

  useEffect(() => {
    stashReferralCodeFromUrl(searchParams.get("ref"), searchParams.get("coupon"));
  }, [searchParams]);

  useEffect(() => {
    if (step === "details" && user && rolesLoaded) {
      navigate("/dashboard");
    }
  }, [step, user, rolesLoaded, navigate]);

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

  /* -------------------------------------------- */

  const validate = () => {
    if (!fullName.trim()) {
      toast.error("Please enter your full name.");
      return false;
    }

    if (contactMethod === "email") {
      if (!isValidEmailInput(email)) {
        toast.error("Please enter a valid email address.");
        return false;
      }
    } else {
      if (!phoneE164) {
        toast.error("Please enter a valid mobile number.");
        return false;
      }
    }

    return true;
  };

  /* -------------------------------------------- */

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (submitting || !validate()) return;

    setSubmitting(true);

    try {
      const meta = { full_name: fullName.trim() };

      if (contactMethod === "mobile") {
        const { error } = await sendPhoneOtp(phoneE164!, {
          shouldCreateUser: true,
          full_name: meta.full_name,
        });

        if (error) {
          toast.error(error.message);
        } else {
          toast.success("OTP sent!");
          setStep("otp");
          setCountdown(300);
          setResendCountdown(60);
        }
      } else {
        const { error } = await sendEmailOtp(emailNormalized, {
          full_name: meta.full_name,
          shouldCreateUser: true,
        });

        if (error) {
          toast.error(error.message);
        } else {
          toast.success("OTP sent!");
          setStep("otp");
          setCountdown(300);
          setResendCountdown(60);
        }
      }
    } catch {
      toast.error("Something went wrong.");
    }

    setSubmitting(false);
  };

  /* -------------------------------------------- */

  const handleVerifyOTP = async () => {
    if (otp.length !== 6 || verifyingRef.current) return;

    verifyingRef.current = true;
    setSubmitting(true);

    try {
      let verifyResult;

      if (contactMethod === "mobile") {
        verifyResult = await verifyPhoneOtp(phoneE164!, otp);
      } else {
        verifyResult = await verifyEmailOtp(emailNormalized, otp);
      }

      if (verifyResult.error) {
        toast.error(verifyResult.error.message);
        return;
      }

      if (!verifyResult.data.session || !verifyResult.data.user) {
        toast.error("Failed to create session");
        return;
      }

      const statusCheck = await checkAccountStatusOrSignOut();

      if (statusCheck.ok === false) {
        toast.error(statusCheck.message);
        return;
      }

      const dbRole: RegistrationRole =
        selectedRole === "owner" ? "owner" : "user";

      const profileData: Record<string, unknown> = {
        full_name: fullName.trim(),
      };

      if (phoneE164) {
        profileData.phone = phoneE164;
      }

      const regRes = await invokeCompleteRegistration(
        dbRole,
        profileData
      );

      if (regRes.error || regRes.data?.error) {
        toast.error(
          await getEdgeFunctionErrorMessage(
            regRes,
            "Registration failed."
          )
        );
        return;
      }

      await refreshRoles(verifyResult.data.user.id);

      await applyPendingReferralCode();

      if (selectedRole === "owner") {
        toast.success("Account created! Add your property.");
        navigate("/owner");
      } else {
        toast.success("Account created!");
        navigate("/dashboard");
      }
    } catch {
      toast.error("Something went wrong.");
    }

    setSubmitting(false);
    verifyingRef.current = false;
  };

  /* -------------------------------------------- */

  const handleResendOTP = async () => {
    if (resendCountdown > 0) return;

    setSubmitting(true);

    try {
      const meta = { full_name: fullName.trim() };

      if (contactMethod === "mobile") {
        const { error } = await sendPhoneOtp(phoneE164!, {
          shouldCreateUser: true,
          full_name: meta.full_name,
        });

        if (error) toast.error(error.message);
        else {
          toast.success("OTP resent!");
          setCountdown(300);
          setResendCountdown(60);
        }
      } else {
        const { error } = await sendEmailOtp(emailNormalized, {
          shouldCreateUser: true,
          full_name: meta.full_name,
        });

        if (error) toast.error(error.message);
        else {
          toast.success("OTP resent!");
          setCountdown(300);
          setResendCountdown(60);
        }
      }
    } catch {
      toast.error("Failed to resend OTP");
    }

    setSubmitting(false);
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  /* -------------------------------------------- */
  /* UI (UNCHANGED) */
  /* -------------------------------------------- */

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "#FAF7F2" }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Link to="/" className="flex items-center gap-2 justify-center mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#5A3E2B" }}>
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="font-heading font-extrabold text-2xl" style={{ color: "#2C2C2C" }}>
            StayNest
          </span>
        </Link>

        <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(90,62,43,0.08)] border border-[#E8E0D8] p-8">
          <AnimatePresence mode="wait">
            {step === "details" && (
              <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <div className="text-center">
                  <h1 className="font-heading font-bold text-2xl mb-1" style={{ color: "#2C2C2C" }}>Create Account</h1>
                  <p className="text-sm" style={{ color: "#6B6B6B" }}>Join StayNest to find or list hostels</p>
                </div>

                {/* Role selector */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedRole("tenant")}
                    className={cn(
                      "p-4 rounded-xl border-2 text-center transition-all",
                      selectedRole === "tenant"
                        ? "border-[#5A3E2B] bg-[#5A3E2B]/5"
                        : "border-[#E8E0D8] hover:border-[#5A3E2B]/30"
                    )}
                  >
                    <User className={cn("w-5 h-5 mx-auto mb-2", selectedRole === "tenant" ? "text-[#5A3E2B]" : "text-[#9B9B9B]")} />
                    <span className={cn("text-sm font-heading font-semibold", selectedRole === "tenant" ? "text-[#5A3E2B]" : "text-[#9B9B9B]")}>
                      Student / Tenant
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole("owner")}
                    className={cn(
                      "p-4 rounded-xl border-2 text-center transition-all",
                      selectedRole === "owner"
                        ? "border-[#5A3E2B] bg-[#5A3E2B]/5"
                        : "border-[#E8E0D8] hover:border-[#5A3E2B]/30"
                    )}
                  >
                    <Home className={cn("w-5 h-5 mx-auto mb-2", selectedRole === "owner" ? "text-[#5A3E2B]" : "text-[#9B9B9B]")} />
                    <span className={cn("text-sm font-heading font-semibold", selectedRole === "owner" ? "text-[#5A3E2B]" : "text-[#9B9B9B]")}>
                      Property Owner
                    </span>
                  </button>
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
                  {/* Full name */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium" style={{ color: "#2C2C2C" }}>Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9B9B9B]" />
                      <Input
                        type="text"
                        placeholder="Your full name"
                        className="pl-10 h-11 rounded-xl border-[#E8E0D8]"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        disabled={submitting}
                      />
                    </div>
                  </div>

                  {/* Contact input */}
                  {contactMethod === "email" ? (
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium" style={{ color: "#2C2C2C" }}>Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9B9B9B]" />
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          className="pl-10 h-11 rounded-xl border-[#E8E0D8]"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={submitting}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium" style={{ color: "#2C2C2C" }}>Mobile Number</Label>
                      <PhoneCountryInput
                        id="signup-phone"
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
                    {submitting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Sending OTP...</>
                    ) : (
                      <>Send OTP <ArrowRight className="w-4 h-4" /></>
                    )}
                  </Button>
                </form>

                <div className="flex items-center gap-2 p-3 rounded-xl" style={{ backgroundColor: "#FAF7F2", border: "1px solid #E8E0D8" }}>
                  <Lock className="w-4 h-4 shrink-0" style={{ color: "#9B9B9B" }} />
                  <p className="text-xs" style={{ color: "#9B9B9B" }}>Secure OTP verification &bull; 5 min expiry</p>
                </div>

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
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Creating Account...</>
                  ) : (
                    <>Verify & Create Account <ShieldCheck className="w-4 h-4" /></>
                  )}
                </Button>

                <div className="flex items-center justify-between">
                  <button type="button" onClick={() => { setStep("details"); setOtp(""); }} className="text-sm hover:underline" style={{ color: "#6B6B6B" }}>
                    &larr; Change {contactMethod === "email" ? "email" : "number"}
                  </button>
                  <button type="button" onClick={handleResendOTP} disabled={resendCountdown > 0 || submitting} className="text-sm font-medium disabled:opacity-40" style={{ color: "#5A3E2B" }}>
                    {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : "Resend Code"}
                  </button>
                </div>

                <div className="flex items-center gap-2 p-3 rounded-xl" style={{ backgroundColor: "#FAF7F2", border: "1px solid #E8E0D8" }}>
                  <Lock className="w-4 h-4 shrink-0" style={{ color: "#9B9B9B" }} />
                  <p className="text-xs" style={{ color: "#9B9B9B" }}>Secure OTP verification &bull; 5 min expiry</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;