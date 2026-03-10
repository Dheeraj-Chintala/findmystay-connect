import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, Mail, ArrowRight, ShieldCheck, Home, Lock, MapPin, Phone, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import OTPInput from "@/components/auth/OTPInput";
import { cn } from "@/lib/utils";

type AuthStep = "contact" | "otp" | "register";
type ContactMethod = "email" | "mobile";

const IS_DEV_MODE = true;

const OwnerLogin = () => {
  const [step, setStep] = useState<AuthStep>("contact");
  const [contactMethod, setContactMethod] = useState<ContactMethod>("mobile");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [fullName, setFullName] = useState("");
  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [resendCountdown, setResendCountdown] = useState(0);
  const verifyingRef = useRef(false);
  const navigate = useNavigate();
  const { user, hasRole, rolesLoaded } = useAuth();

  const [hostelName, setHostelName] = useState("");
  const [propertyLocation, setPropertyLocation] = useState("");
  const [contactNumber, setContactNumber] = useState("");

  const contactDisplay = contactMethod === "email" ? email : mobile;

  useEffect(() => {
    if (user && rolesLoaded) {
      if (hasRole("admin")) navigate("/admin");
      else if (hasRole("owner")) navigate("/owner");
      else if (hasRole("owner_pending" as any)) navigate("/owner-verification-pending");
      else navigate("/dashboard");
    }
  }, [user, rolesLoaded]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    let normalizedContact: string;
    if (contactMethod === "email") {
      normalizedContact = email.trim().toLowerCase();
      if (!normalizedContact || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedContact)) {
        toast.error("Please enter a valid email address.");
        return;
      }
    } else {
      normalizedContact = mobile.trim().replace(/[\s\-()]/g, "");
      if (!normalizedContact || !/^\+?\d{7,15}$/.test(normalizedContact)) {
        toast.error("Please enter a valid mobile number (e.g. +919876543210).");
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await supabase.functions.invoke("otp-auth", {
        body: {
          action: "send",
          contact: normalizedContact,
          contact_type: contactMethod === "mobile" ? "phone" : "email",
          role: "owner",
          full_name: fullName.trim(),
        },
      });
      if (res.error) {
        toast.error(res.data?.error || res.error.message || "Failed to send OTP");
      } else if (res.data?.error) {
        toast.error(res.data.error);
      } else {
        toast.success(res.data?.message || "OTP sent!");
        if (contactMethod === "email") setEmail(normalizedContact);
        else setMobile(normalizedContact);
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
    const normalizedContact = contactMethod === "email" ? email.trim().toLowerCase() : mobile.trim().replace(/[\s\-()]/g, "");
    try {
      const res = await supabase.functions.invoke("otp-auth", {
        body: {
          action: "verify",
          contact: normalizedContact,
          contact_type: contactMethod === "mobile" ? "phone" : "email",
          otp,
          role: "owner",
          full_name: fullName.trim(),
        },
      });
      if (res.error) {
        toast.error("Verification failed");
      } else if (res.data?.error) {
        toast.error(res.data.error);
      } else if (res.data?.session) {
        await supabase.auth.setSession({
          access_token: res.data.session.access_token,
          refresh_token: res.data.session.refresh_token,
        });
        if (res.data.isNewUser) {
          setStep("register");
          toast.success("OTP verified! Complete your owner registration.");
        } else {
          toast.success(res.data.message || "Welcome back!");
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

  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostelName.trim() || !propertyLocation.trim()) {
      toast.error("Please fill in required fields.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await supabase.functions.invoke("complete-registration", {
        body: {
          selected_role: "owner_pending",
          profile_data: {
            full_name: fullName.trim(),
            hostel_name: hostelName.trim(),
            property_location: propertyLocation.trim(),
            phone: contactNumber.trim() || null,
          },
        },
      });
      if (res.error || res.data?.error) {
        toast.error(res.data?.error || "Registration failed. Please try again.");
      } else {
        toast.success(res.data.message);
        window.location.href = "/owner-verification-pending";
      }
    } catch {
      toast.error("Something went wrong.");
    }
    setSubmitting(false);
  };

  const handleResendOTP = async () => {
    if (resendCountdown > 0) return;
    setSubmitting(true);
    const normalizedContact = contactMethod === "email" ? email.trim().toLowerCase() : mobile.trim().replace(/[\s\-()]/g, "");
    try {
      const res = await supabase.functions.invoke("otp-auth", {
        body: {
          action: "send",
          contact: normalizedContact,
          contact_type: contactMethod === "mobile" ? "phone" : "email",
          role: "owner",
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
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-accent/90 to-primary/70 relative items-center justify-center p-12">
        <div className="absolute top-1/4 -left-20 w-64 h-64 bg-accent/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
        <div className="relative z-10 text-center max-w-md">
          <div className="flex items-center justify-center gap-2.5 mb-8">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <Home className="w-6 h-6 text-white" />
            </div>
            <span className="font-heading font-extrabold text-3xl text-white">StayNest</span>
          </div>
          <h2 className="font-heading font-bold text-3xl text-white mb-4">Property Owner Portal</h2>
          <p className="text-white/60 leading-relaxed">
            Manage your hostel listings, track bookings, and grow your property business — all from one place.
          </p>
          <div className="mt-8 flex items-center justify-center gap-2 text-white/40">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-sm">Verified Owners • Secure Access • Business Tools</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <Link to="/" className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-heading font-extrabold text-xl">StayNest</span>
          </Link>

          <div className="mb-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent-foreground text-sm font-medium border border-accent/20">
            <Home className="w-4 h-4" />
            Property Owner Login
          </div>

          <AnimatePresence mode="wait">
            {step === "contact" && (
              <motion.div key="contact" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div>
                  <h1 className="font-heading font-bold text-2xl mb-1">Owner Login</h1>
                  <p className="text-muted-foreground text-sm">Sign in to manage your hostel listings and bookings</p>
                </div>

                {/* Contact method toggle */}
                <div className="flex rounded-xl border border-border overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setContactMethod("mobile")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-all",
                      contactMethod === "mobile"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/30 text-muted-foreground hover:bg-muted/60"
                    )}
                  >
                    <Smartphone className="w-4 h-4" />
                    Mobile Number
                  </button>
                  <button
                    type="button"
                    onClick={() => setContactMethod("email")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-all",
                      contactMethod === "email"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/30 text-muted-foreground hover:bg-muted/60"
                    )}
                  >
                    <Mail className="w-4 h-4" />
                    Email ID
                  </button>
                </div>

                {IS_DEV_MODE && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
                    <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">🔧 Development Mode OTP Enabled — Use OTP: 123456</span>
                  </div>
                )}

                <form onSubmit={handleSendOTP} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Full Name</Label>
                    <Input type="text" placeholder="Your full name" className="h-11 rounded-xl" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                  </div>

                  {contactMethod === "email" ? (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input type="email" placeholder="owner@example.com" className="pl-10 h-11 rounded-xl" required value={email} onChange={(e) => setEmail(e.target.value)} />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Mobile Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input type="tel" placeholder="+91 9876543210" className="pl-10 h-11 rounded-xl" required value={mobile} onChange={(e) => setMobile(e.target.value)} />
                      </div>
                    </div>
                  )}

                  <Button type="submit" variant="hero" size="lg" className="w-full gap-2" disabled={submitting}>
                    {submitting ? "Sending OTP..." : "Send Verification Code"}
                    {!submitting && <ArrowRight className="w-4 h-4" />}
                  </Button>
                </form>

                <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 border border-border">
                  <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                  <p className="text-xs text-muted-foreground">Your login is protected with secure OTP verification.</p>
                </div>

                <p className="text-xs text-center text-muted-foreground">
                  Looking for accommodation?{" "}
                  <Link to="/login" className="text-primary hover:underline font-medium">Student / Employee Login</Link>
                </p>
              </motion.div>
            )}

            {step === "otp" && (
              <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div>
                  <h1 className="font-heading font-bold text-2xl mb-1">Enter Verification Code</h1>
                  <p className="text-muted-foreground text-sm">
                    We sent a 6-digit code to <span className="font-medium text-foreground">{contactDisplay}</span>
                  </p>
                </div>

                <OTPInput value={otp} onChange={setOtp} onComplete={handleVerifyOTP} />

                <div className="text-center">
                  {countdown > 0 ? (
                    <p className="text-sm text-muted-foreground">Code expires in <span className="font-mono font-semibold text-primary">{formatTime(countdown)}</span></p>
                  ) : (
                    <p className="text-sm text-destructive font-medium">Code expired</p>
                  )}
                </div>

                <Button onClick={handleVerifyOTP} variant="hero" size="lg" className="w-full gap-2" disabled={submitting || otp.length !== 6}>
                  {submitting ? "Verifying..." : "Verify & Continue"}
                  {!submitting && <ShieldCheck className="w-4 h-4" />}
                </Button>

                <div className="flex items-center justify-between">
                  <button type="button" onClick={() => { setStep("contact"); setOtp(""); setCountdown(0); setResendCountdown(0); }} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    ← Change {contactMethod === "email" ? "email" : "number"}
                  </button>
                  <button type="button" onClick={handleResendOTP} disabled={resendCountdown > 0 || submitting} className="text-sm text-primary hover:text-primary/80 transition-colors disabled:text-muted-foreground disabled:cursor-not-allowed">
                    {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : "Resend Code"}
                  </button>
                </div>

                <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 border border-border">
                  <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                  <p className="text-xs text-muted-foreground">Your login is protected with secure OTP verification.</p>
                </div>
              </motion.div>
            )}

            {step === "register" && (
              <motion.div key="register" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div>
                  <h1 className="font-heading font-bold text-2xl mb-1">Property Owner Registration</h1>
                  <p className="text-muted-foreground text-sm">Tell us about your property to get started</p>
                </div>

                <form onSubmit={handleCompleteRegistration} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Hostel / PG Name *</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input type="text" placeholder="e.g. Sunshine Hostel" className="pl-10 h-11 rounded-xl" required value={hostelName} onChange={(e) => setHostelName(e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Property Location *</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input type="text" placeholder="e.g. HSR Layout, Bangalore" className="pl-10 h-11 rounded-xl" required value={propertyLocation} onChange={(e) => setPropertyLocation(e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Contact Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input type="tel" placeholder="+91 9876543210" className="pl-10 h-11 rounded-xl" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} />
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      <strong>Note:</strong> Your owner account will need admin verification before you can access the Owner Dashboard.
                    </p>
                  </div>

                  <Button type="submit" variant="hero" size="lg" className="w-full gap-2" disabled={submitting}>
                    {submitting ? "Saving..." : "Submit for Verification"}
                    {!submitting && <ArrowRight className="w-4 h-4" />}
                  </Button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default OwnerLogin;
