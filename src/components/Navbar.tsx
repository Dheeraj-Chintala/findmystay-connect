import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, User, Heart, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";
  const isWelcome = location.pathname === "/welcome";

  if (isWelcome) return null;

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isHome ? "bg-background/70 backdrop-blur-xl border-b border-border/50" : "bg-card/95 backdrop-blur-xl shadow-card border-b border-border/50"}`}>
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
            <Link to="/listings">
              <Button variant="ghost" size="sm">Explore</Button>
            </Link>
            <Link to="/owner-dashboard">
              <Button variant="ghost" size="sm">For Owners</Button>
            </Link>
            <div className="w-px h-6 bg-border mx-2" />
            <Link to="/listings">
              <button className="p-2 rounded-full hover:bg-secondary transition-colors">
                <Heart className="w-5 h-5 text-muted-foreground" />
              </button>
            </Link>
            <Link to="/login">
              <Button size="sm" className="rounded-full gap-2 ml-1">
                <User className="w-4 h-4" />
                Sign In
              </Button>
            </Link>
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
              <Link to="/listings" className="block py-2.5 px-3 text-sm font-medium rounded-lg hover:bg-secondary" onClick={() => setMobileOpen(false)}>Explore Stays</Link>
              <Link to="/owner-dashboard" className="block py-2.5 px-3 text-sm font-medium rounded-lg hover:bg-secondary" onClick={() => setMobileOpen(false)}>For Owners</Link>
              <Link to="/admin-dashboard" className="block py-2.5 px-3 text-sm font-medium rounded-lg hover:bg-secondary" onClick={() => setMobileOpen(false)}>Admin</Link>
              <div className="pt-2">
                <Link to="/login" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full rounded-full gap-2">
                    <User className="w-4 h-4" /> Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
