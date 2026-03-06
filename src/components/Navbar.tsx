import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, User, Heart, Building2, LogOut, ShieldCheck, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, hasRole, signOut } = useAuth();
  const isWelcome = location.pathname === "/welcome";

  if (isWelcome) return null;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl shadow-card border-b border-border/50 transition-all duration-300">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-[72px]">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-sm">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-heading font-extrabold text-xl tracking-tight text-foreground">
              FindMy<span className="text-primary">Stay</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <Link to="/listings"><Button variant="ghost" size="sm">Explore</Button></Link>
            {(hasRole("owner") || hasRole("admin")) && (
              <Link to="/owner-dashboard"><Button variant="ghost" size="sm">My Properties</Button></Link>
            )}
            {hasRole("admin") && (
              <Link to="/admin-dashboard"><Button variant="ghost" size="sm" className="gap-1"><ShieldCheck className="w-3.5 h-3.5" />Admin</Button></Link>
            )}
            <div className="w-px h-6 bg-border mx-2" />

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="rounded-full gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span className="max-w-[100px] truncate text-xs">{user.email}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {hasRole("owner") && (
                    <DropdownMenuItem onClick={() => navigate("/verify-property")} className="gap-2">
                      <FileCheck className="w-4 h-4" /> Verify Property
                    </DropdownMenuItem>
                  )}
                  {hasRole("admin") && (
                    <DropdownMenuItem onClick={() => navigate("/admin-dashboard")} className="gap-2">
                      <ShieldCheck className="w-4 h-4" /> Admin Dashboard
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="gap-2 text-destructive">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/login">
                <Button size="sm" className="rounded-full gap-2 ml-1">
                  <User className="w-4 h-4" /> Sign In
                </Button>
              </Link>
            )}
          </div>

          <button className="md:hidden p-2 rounded-lg hover:bg-secondary" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-card border-t border-border"
          >
            <div className="p-4 space-y-2">
              <Link to="/listings" className="block py-2.5 px-3 text-sm font-medium rounded-lg hover:bg-secondary" onClick={() => setMobileOpen(false)}>Explore</Link>
              {hasRole("owner") && (
                <>
                  <Link to="/owner-dashboard" className="block py-2.5 px-3 text-sm font-medium rounded-lg hover:bg-secondary" onClick={() => setMobileOpen(false)}>My Properties</Link>
                  <Link to="/verify-property" className="block py-2.5 px-3 text-sm font-medium rounded-lg hover:bg-secondary" onClick={() => setMobileOpen(false)}>Verify Property</Link>
                </>
              )}
              {hasRole("admin") && (
                <Link to="/admin-dashboard" className="block py-2.5 px-3 text-sm font-medium rounded-lg hover:bg-secondary" onClick={() => setMobileOpen(false)}>Admin</Link>
              )}
              <div className="pt-2">
                {user ? (
                  <Button variant="outline" className="w-full rounded-full gap-2" onClick={() => { handleSignOut(); setMobileOpen(false); }}>
                    <LogOut className="w-4 h-4" /> Sign Out
                  </Button>
                ) : (
                  <Link to="/login" onClick={() => setMobileOpen(false)}>
                    <Button className="w-full rounded-full gap-2"><User className="w-4 h-4" /> Sign In</Button>
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
