import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-foreground py-12">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-heading font-bold text-sm">F</span>
              </div>
              <span className="font-heading font-bold text-lg text-background">FindMyStay</span>
            </div>
            <p className="text-background/50 text-sm">
              India's trusted marketplace for hostels, PGs, and co-living spaces.
            </p>
          </div>
          <div>
            <h4 className="font-heading font-semibold text-background mb-3 text-sm">Explore</h4>
            <div className="space-y-2">
              <Link to="/listings" className="block text-sm text-background/50 hover:text-background/80 transition-colors">Browse Listings</Link>
              <Link to="/listings" className="block text-sm text-background/50 hover:text-background/80 transition-colors">Top Cities</Link>
            </div>
          </div>
          <div>
            <h4 className="font-heading font-semibold text-background mb-3 text-sm">For Owners</h4>
            <div className="space-y-2">
              <Link to="/listings" className="block text-sm text-background/50 hover:text-background/80 transition-colors">List Property</Link>
              <Link to="/listings" className="block text-sm text-background/50 hover:text-background/80 transition-colors">Owner Dashboard</Link>
            </div>
          </div>
          <div>
            <h4 className="font-heading font-semibold text-background mb-3 text-sm">Support</h4>
            <div className="space-y-2">
              <a href="#" className="block text-sm text-background/50 hover:text-background/80 transition-colors">Help Center</a>
              <a href="#" className="block text-sm text-background/50 hover:text-background/80 transition-colors">Contact Us</a>
            </div>
          </div>
        </div>
        <div className="border-t border-background/10 pt-6">
          <p className="text-background/30 text-xs text-center">© 2026 FindMyStay. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
