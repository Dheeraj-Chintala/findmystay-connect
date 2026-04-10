import { Link } from "react-router-dom";
import { Building2 } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gradient-hero py-14">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-heading font-bold text-lg text-primary-foreground">
                Stay<span className="text-accent">Nest</span>
              </span>
            </div>
            <p className="text-primary-foreground/40 text-sm leading-relaxed">
              India's trusted marketplace for hostels, PGs, and co-living spaces.
            </p>
          </div>
          <div>
            <h4 className="font-heading font-semibold text-primary-foreground mb-4 text-sm">Explore</h4>
            <div className="space-y-2.5">
              <Link to="/listings" className="block text-sm text-primary-foreground/40 hover:text-primary-foreground/70 transition-colors">Browse Listings</Link>
              <Link to="/listings" className="block text-sm text-primary-foreground/40 hover:text-primary-foreground/70 transition-colors">Top Cities</Link>
              <Link to="/listings" className="block text-sm text-primary-foreground/40 hover:text-primary-foreground/70 transition-colors">Reviews</Link>
            </div>
          </div>
          <div>
            <h4 className="font-heading font-semibold text-primary-foreground mb-4 text-sm">For Owners</h4>
            <div className="space-y-2.5">
              <Link to="/owner-dashboard" className="block text-sm text-primary-foreground/40 hover:text-primary-foreground/70 transition-colors">List Property</Link>
              <Link to="/owner-dashboard" className="block text-sm text-primary-foreground/40 hover:text-primary-foreground/70 transition-colors">Owner Dashboard</Link>
              <Link to="/listings" className="block text-sm text-primary-foreground/40 hover:text-primary-foreground/70 transition-colors">Pricing</Link>
            </div>
          </div>
          <div>
            <h4 className="font-heading font-semibold text-primary-foreground mb-4 text-sm">Support</h4>
            <div className="space-y-2.5">
              <a href="mailto:support@staynest.app" className="block text-sm text-primary-foreground/40 hover:text-primary-foreground/70 transition-colors">Help Center</a>
              <Link to="/listings" className="block text-sm text-primary-foreground/40 hover:text-primary-foreground/70 transition-colors">Safety</Link>
              <Link to="/listings" className="block text-sm text-primary-foreground/40 hover:text-primary-foreground/70 transition-colors">Terms</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-primary-foreground/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-primary-foreground/25 text-xs">© 2026 StayNest. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/listings" className="text-primary-foreground/25 hover:text-primary-foreground/50 text-xs transition-colors">Privacy</Link>
            <Link to="/listings" className="text-primary-foreground/25 hover:text-primary-foreground/50 text-xs transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
