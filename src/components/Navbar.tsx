import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Search, Menu, X, User, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isHome ? "bg-background/80 backdrop-blur-lg" : "bg-card shadow-card"}`}>
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-heading font-bold text-sm">F</span>
            </div>
            <span className="font-heading font-bold text-xl text-foreground">FindMyStay</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/listings" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Explore
            </Link>
            <Link to="/listings" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              For Owners
            </Link>
            <button className="p-2 rounded-full hover:bg-secondary transition-colors">
              <Heart className="w-5 h-5 text-muted-foreground" />
            </button>
            <Button variant="outline" size="sm" className="rounded-full gap-2">
              <User className="w-4 h-4" />
              <span>Sign In</span>
            </Button>
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-card border-t border-border"
          >
            <div className="p-4 space-y-3">
              <Link to="/listings" className="block py-2 text-sm font-medium" onClick={() => setMobileOpen(false)}>Explore</Link>
              <Link to="/listings" className="block py-2 text-sm font-medium" onClick={() => setMobileOpen(false)}>For Owners</Link>
              <Button variant="outline" className="w-full rounded-full gap-2">
                <User className="w-4 h-4" />
                Sign In
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
