import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, Mail, Lock, User, Eye, EyeOff, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"user" | "owner">("user");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Welcome back!");
      navigate("/");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { data, error } = await supabase.auth.signUp({
      email: regEmail,
      password: regPassword,
      options: {
        data: { full_name: regName },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) {
      setSubmitting(false);
      toast.error(error.message);
      return;
    }

    // If registering as owner, add owner role
    if (role === "owner" && data.user) {
      await supabase.from("user_roles").insert({
        user_id: data.user.id,
        role: "owner" as any,
      });
    }

    setSubmitting(false);
    toast.success("Account created! Check your email to confirm.");
    navigate("/");
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
            <span className="font-heading font-extrabold text-3xl text-primary-foreground">FindMyStay</span>
          </div>
          <h2 className="font-heading font-bold text-3xl text-primary-foreground mb-4">Welcome to Your New Home</h2>
          <p className="text-primary-foreground/50 leading-relaxed">Join thousands who trust FindMyStay to find verified, affordable accommodation across India.</p>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <Link to="/" className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-heading font-extrabold text-xl">FindMyStay</span>
          </Link>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 h-12 rounded-xl">
              <TabsTrigger value="login" className="rounded-lg font-heading font-semibold">Sign In</TabsTrigger>
              <TabsTrigger value="register" className="rounded-lg font-heading font-semibold">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <div className="space-y-6">
                <div>
                  <h1 className="font-heading font-bold text-2xl mb-1">Welcome Back</h1>
                  <p className="text-muted-foreground text-sm">Sign in to continue your search</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input type="email" placeholder="you@example.com" className="pl-10 h-11 rounded-xl" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input type={showPassword ? "text" : "password"} placeholder="••••••••" className="pl-10 pr-10 h-11 rounded-xl" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" variant="hero" size="lg" className="w-full gap-2" disabled={submitting}>
                    {submitting ? "Signing in..." : "Sign In"} {!submitting && <ArrowRight className="w-4 h-4" />}
                  </Button>
                </form>
              </div>
            </TabsContent>

            <TabsContent value="register">
              <div className="space-y-6">
                <div>
                  <h1 className="font-heading font-bold text-2xl mb-1">Create Account</h1>
                  <p className="text-muted-foreground text-sm">Start your journey to finding the perfect stay</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setRole("user")} className={`p-4 rounded-xl border-2 text-center transition-all ${role === "user" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                    <User className={`w-5 h-5 mx-auto mb-2 ${role === "user" ? "text-primary" : "text-muted-foreground"}`} />
                    <span className={`text-sm font-heading font-semibold ${role === "user" ? "text-primary" : "text-muted-foreground"}`}>Student / Employee</span>
                  </button>
                  <button type="button" onClick={() => setRole("owner")} className={`p-4 rounded-xl border-2 text-center transition-all ${role === "owner" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                    <Building2 className={`w-5 h-5 mx-auto mb-2 ${role === "owner" ? "text-primary" : "text-muted-foreground"}`} />
                    <span className={`text-sm font-heading font-semibold ${role === "owner" ? "text-primary" : "text-muted-foreground"}`}>Property Owner</span>
                  </button>
                </div>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input type="text" placeholder="Your full name" className="pl-10 h-11 rounded-xl" required value={regName} onChange={(e) => setRegName(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input type="email" placeholder="you@example.com" className="pl-10 h-11 rounded-xl" required value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input type={showPassword ? "text" : "password"} placeholder="Min 6 characters" className="pl-10 pr-10 h-11 rounded-xl" required value={regPassword} onChange={(e) => setRegPassword(e.target.value)} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" variant="hero" size="lg" className="w-full gap-2" disabled={submitting}>
                    {submitting ? "Creating..." : "Create Account"} {!submitting && <ArrowRight className="w-4 h-4" />}
                  </Button>
                </form>
                <p className="text-xs text-center text-muted-foreground">By creating an account, you agree to our Terms of Service and Privacy Policy</p>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
