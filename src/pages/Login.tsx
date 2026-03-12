import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Building2, Mail, ArrowRight, ShieldCheck, User, Lock, MapPin, Briefcase, IndianRupee, GraduationCap, Home, Phone, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import OTPInput from "@/components/auth/OTPInput";
import { cn } from "@/lib/utils";

type AuthStep = "contact" | "otp" | "role_select" | "register";
type SelectedRole = "student" | "employee" | "owner" | null;
type ContactMethod = "email" | "mobile";

const IS_DEV_MODE = true; // Set false in production

const Login = () => {
  const [step, setStep] = useState<AuthStep>("contact");
  const [contactMethod, setContactMethod] = useState<ContactMethod>("mobile");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [fullName, setFullName] = useState("");
  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [selectedRole, setSelectedRole] = useState<SelectedRole>(null);
  const verifyingRef = useRef(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get("redirect");
  const { user, hasRole, rolesLoaded } = useAuth();

  // Registration fields - tenant
  const [occupation, setOccupation] = useState("");
  const [preferredLocation, setPreferredLocation] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");

  // Registration fields - owner
  const [hostelName, setHostelName] = useState("");
  const [propertyLocation, setPropertyLocation] = useState("");
  const [contactNumber, setContactNumber] = useState("");

  const contactValue = contactMethod === "email" ? email : mobile;
  const contactDisplay = contactMethod === "email" ? email : mobile;

  useEffect(() => {
    if (user && rolesLoaded) {
      if (redirectPath) {
        navigate(redirectPath);
      } else if (hasRole("admin")) navigate("/admin");
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
          role: "user",
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
          role: "user",
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
          setStep("role_select");
          toast.success("OTP verified! Please select how you'll use the platform.");
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

  const handleRoleSelected = () => {
    if (!selectedRole) {
      toast.error("Please select how you'll use the platform.");
      return;
    }
    if (selectedRole === "student") setOccupation("Student");
    if (selectedRole === "employee") setOccupation("");
    setStep("register");
  };

  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRole === "owner" && (!hostelName.trim() || !propertyLocation.trim())) {
      toast.error("Please fill in required fields.");
      return;
    }
    if ((selectedRole === "student" || selectedRole === "employee") && !occupation.trim()) {
      toast.error("Please enter your occupation.");
      return;
    }
    setSubmitting(true);
    try {
      const dbRole = selectedRole === "owner" ? "owner_pending" : "user";
      const profileData = selectedRole === "owner"
        ? {
            full_name: fullName.trim(),
            hostel_name: hostelName.trim(),
            property_location: propertyLocation.trim(),
            phone: contactNumber.trim() || null,
          }
        : {
            full_name: fullName.trim(),
            occupation: occupation.trim(),
            preferred_location: preferredLocation.trim() || null,
            budget_min: budgetMin ? parseInt(budgetMin) : null,
            budget_max: budgetMax ? parseInt(budgetMax) : null,
          };

      const res = await supabase.functions.invoke("complete-registration", {
        body: { selected_role: dbRole, profile_data: profileData },
      });

      if (res.error || res.data?.error) {
        toast.error(res.data?.error || "Registration failed. Please try again.");
      } else {
        toast.success(res.data.message);
        window.location.href = res.data.redirect;
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
          role: "user",
          full_name: fullName.trim(),
        },
      });
      if (res.data?.error) toast.error(res.data.error);
      else { toast.success("OTP resent!"); setCountdown(300); setResendCountdown(60); }
    } catch { toast.error("Failed to resend OTP"); }
    setSubmitting(false);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const roleOptions = [
    {
      id: "student" as const,
      icon: GraduationCap,
      title: "Student",
      description: "Looking for a hostel or PG near college or university.",
    },
    {
      id: "employee" as const,
      icon: Briefcase,
      title: "Employee / Working Professional",
      description: "Looking for accommodation near workplace.",
    },
    {
      id: "owner" as const,
      icon: Home,
      title: "Hostel Owner",
      description: "Want to list and manage hostels or PG properties on the platform.",
    },
  ];

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
          <h2 className="font-heading font-bold text-3xl text-primary-foreground mb-4">Find Your Perfect Stay</h2>
          <p className="text-primary-foreground/50 leading-relaxed">
            Sign in to search hostels, book rooms, and manage your accommodation — all with a simple OTP.
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

          {/* Role badge */}
          <div className="mb-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <User className="w-4 h-4" />
            Sign In / Register
          </div>

          <AnimatePresence mode="wait">
            {step === "contact" && (
              <motion.div key="contact" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div>
                  <h1 className="font-heading font-bold text-2xl mb-1">Welcome to StayNest</h1>
                  <p className="text-muted-foreground text-sm">
                    {redirectPath
                      ? "Please sign in or create an account to continue."
                      : "Enter your details to receive a verification code"}
                  </p>
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
                        <Input type="email" placeholder="you@example.com" className="pl-10 h-11 rounded-xl" required value={email} onChange={(e) => setEmail(e.target.value)} />
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

            {step === "role_select" && (
              <motion.div key="role_select" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div>
                  <h1 className="font-heading font-bold text-2xl mb-1">How will you use this platform?</h1>
                  <p className="text-muted-foreground text-sm">Select your role to personalize your experience</p>
                </div>

                <div className="space-y-3">
                  {roleOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setSelectedRole(option.id)}
                      className={cn(
                        "w-full p-4 rounded-xl border-2 text-left transition-all flex items-start gap-4",
                        selectedRole === option.id
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-primary/30 hover:bg-muted/30"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                        selectedRole === option.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      )}>
                        <option.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className={cn(
                          "font-heading font-semibold text-sm",
                          selectedRole === option.id ? "text-primary" : "text-foreground"
                        )}>
                          {option.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{option.description}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <Button onClick={handleRoleSelected} variant="hero" size="lg" className="w-full gap-2" disabled={!selectedRole}>
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </motion.div>
            )}

            {step === "register" && (selectedRole === "student" || selectedRole === "employee") && (
              <motion.div key="register-tenant" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div>
                  <h1 className="font-heading font-bold text-2xl mb-1">Complete Your Profile</h1>
                  <p className="text-muted-foreground text-sm">Tell us a bit about yourself to personalize your experience</p>
                </div>

                <form onSubmit={handleCompleteRegistration} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Occupation *</Label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input type="text" placeholder="e.g. Student, Software Engineer" className="pl-10 h-11 rounded-xl" required value={occupation} onChange={(e) => setOccupation(e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Preferred Location</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input type="text" placeholder="e.g. Koramangala, Bangalore" className="pl-10 h-11 rounded-xl" value={preferredLocation} onChange={(e) => setPreferredLocation(e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Monthly Budget Range</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input type="number" placeholder="Min" className="pl-10 h-11 rounded-xl" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} />
                      </div>
                      <div className="relative">
                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input type="number" placeholder="Max" className="pl-10 h-11 rounded-xl" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} />
                      </div>
                    </div>
                  </div>

                  <Button type="submit" variant="hero" size="lg" className="w-full gap-2" disabled={submitting}>
                    {submitting ? "Saving..." : "Complete Registration"}
                    {!submitting && <ArrowRight className="w-4 h-4" />}
                  </Button>
                </form>

                <button type="button" onClick={() => setStep("role_select")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Change role</button>
              </motion.div>
            )}

            {step === "register" && selectedRole === "owner" && (
              <motion.div key="register-owner" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
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
                      <strong>Note:</strong> Your owner account will need admin verification before you can access the Owner Dashboard and list properties.
                    </p>
                  </div>

                  <Button type="submit" variant="hero" size="lg" className="w-full gap-2" disabled={submitting}>
                    {submitting ? "Saving..." : "Submit for Verification"}
                    {!submitting && <ArrowRight className="w-4 h-4" />}
                  </Button>
                </form>

                <button type="button" onClick={() => setStep("role_select")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Change role</button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
