import { Link } from "react-router-dom";
import { Building2 } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground py-14">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-heading font-extrabold text-lg text-background">
                FindMy<span className="text-primary">Stay</span>
              </span>
            </div>
            <p className="text-background/40 text-sm leading-relaxed">
              India's trusted marketplace for hostels, PGs, and co-living spaces.
            </p>
          </div>
          <div>
            <h4 className="font-heading font-semibold text-background mb-4 text-sm">Explore</h4>
            <div className="space-y-2.5">
              <Link to="/listings" className="block text-sm text-background/40 hover:text-background/70 transition-colors">Browse Listings</Link>
              <Link to="/listings" className="block text-sm text-background/40 hover:text-background/70 transition-colors">Top Cities</Link>
              <Link to="/listings" className="block text-sm text-background/40 hover:text-background/70 transition-colors">Reviews</Link>
            </div>
          </div>
          <div>
            <h4 className="font-heading font-semibold text-background mb-4 text-sm">For Owners</h4>
            <div className="space-y-2.5">
              <Link to="/owner-dashboard" className="block text-sm text-background/40 hover:text-background/70 transition-colors">List Property</Link>
              <Link to="/owner-dashboard" className="block text-sm text-background/40 hover:text-background/70 transition-colors">Owner Dashboard</Link>
              <Link to="/listings" className="block text-sm text-background/40 hover:text-background/70 transition-colors">Pricing</Link>
            </div>
          </div>
          <div>
            <h4 className="font-heading font-semibold text-background mb-4 text-sm">Support</h4>
            <div className="space-y-2.5">
              <a href="#" className="block text-sm text-background/40 hover:text-background/70 transition-colors">Help Center</a>
              <a href="#" className="block text-sm text-background/40 hover:text-background/70 transition-colors">Safety</a>
              <a href="#" className="block text-sm text-background/40 hover:text-background/70 transition-colors">Terms</a>
            </div>
          </div>
        </div>
        <div className="border-t border-background/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-background/25 text-xs">© 2026 FindMyStay. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="text-background/25 hover:text-background/50 text-xs transition-colors">Privacy</a>
            <a href="#" className="text-background/25 hover:text-background/50 text-xs transition-colors">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
