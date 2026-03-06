import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, Mail, Lock, User, Eye, EyeOff, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { toast } from "sonner";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"user" | "owner">("user");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Welcome back!");
    navigate("/");
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Account created successfully!");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left - Decorative */}
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
          <h2 className="font-heading font-bold text-3xl text-primary-foreground mb-4">
            Welcome to Your New Home
          </h2>
          <p className="text-primary-foreground/50 leading-relaxed">
            Join thousands who trust FindMyStay to find verified, affordable accommodation across India.
          </p>
        </div>
      </div>

      {/* Right - Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
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

            {/* Login */}
            <TabsContent value="login">
              <div className="space-y-6">
                <div>
                  <h1 className="font-heading font-bold text-2xl mb-1">Welcome Back</h1>
                  <p className="text-muted-foreground text-sm">Sign in to continue your search</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="email" type="email" placeholder="you@example.com" className="pl-10 h-11 rounded-xl" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" className="pl-10 pr-10 h-11 rounded-xl" required />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button type="button" className="text-xs text-primary hover:underline">Forgot password?</button>
                  </div>
                  <Button type="submit" variant="hero" size="lg" className="w-full gap-2">
                    Sign In <ArrowRight className="w-4 h-4" />
                  </Button>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                  <div className="relative flex justify-center"><span className="bg-background px-3 text-xs text-muted-foreground">or continue with</span></div>
                </div>

                <Button variant="outline" className="w-full h-11 rounded-xl gap-2">
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  Google
                </Button>
              </div>
            </TabsContent>

            {/* Register */}
            <TabsContent value="register">
              <div className="space-y-6">
                <div>
                  <h1 className="font-heading font-bold text-2xl mb-1">Create Account</h1>
                  <p className="text-muted-foreground text-sm">Start your journey to finding the perfect stay</p>
                </div>

                {/* Role selector */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("user")}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${role === "user" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}
                  >
                    <User className={`w-5 h-5 mx-auto mb-2 ${role === "user" ? "text-primary" : "text-muted-foreground"}`} />
                    <span className={`text-sm font-heading font-semibold ${role === "user" ? "text-primary" : "text-muted-foreground"}`}>Student / Employee</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("owner")}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${role === "owner" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}
                  >
                    <Building2 className={`w-5 h-5 mx-auto mb-2 ${role === "owner" ? "text-primary" : "text-muted-foreground"}`} />
                    <span className={`text-sm font-heading font-semibold ${role === "owner" ? "text-primary" : "text-muted-foreground"}`}>Property Owner</span>
                  </button>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input type="text" placeholder="Your full name" className="pl-10 h-11 rounded-xl" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input type="email" placeholder="you@example.com" className="pl-10 h-11 rounded-xl" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input type={showPassword ? "text" : "password"} placeholder="Create a password" className="pl-10 pr-10 h-11 rounded-xl" required />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" variant="hero" size="lg" className="w-full gap-2">
                    Create Account <ArrowRight className="w-4 h-4" />
                  </Button>
                </form>

                <p className="text-xs text-center text-muted-foreground">
                  By creating an account, you agree to our Terms of Service and Privacy Policy
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
