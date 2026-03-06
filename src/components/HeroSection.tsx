import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = () => {
    navigate(`/listings?q=${encodeURIComponent(searchQuery)}`);
  };

  const popularCities = ["Bangalore", "Mumbai", "Delhi NCR", "Pune", "Hyderabad"];

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img src={heroBg} alt="Modern accommodation" className="w-full h-full object-cover" loading="eager" />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/70 via-foreground/50 to-foreground/80" />
        {/* Decorative blur circles */}
        <div className="absolute top-1/4 -left-32 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-accent/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 mb-8">
            <Sparkles className="w-4 h-4 text-verified" />
            <span className="text-primary-foreground/90 text-sm font-medium">Trusted by 15,000+ students & professionals</span>
          </div>
          
          <h1 className="font-heading font-extrabold text-4xl md:text-6xl lg:text-7xl text-primary-foreground mb-5 leading-[1.1] tracking-tight">
            Find Your Perfect
            <br />
            <span className="text-gradient">Stay</span>
          </h1>
          <p className="text-primary-foreground/70 text-lg md:text-xl max-w-xl mx-auto mb-10 font-body leading-relaxed">
            Discover verified hostels, PGs & co-living spaces near your college or workplace
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="max-w-2xl mx-auto"
        >
          <div className="glass rounded-2xl p-2 flex items-center gap-2 shadow-elevated">
            <div className="flex-1 flex items-center gap-3 px-4">
              <MapPin className="w-5 h-5 text-primary shrink-0" />
              <input
                type="text"
                placeholder="Search by city, area, or hostel name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="w-full py-3 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none font-body text-sm"
              />
            </div>
            <Button onClick={handleSearch} variant="hero" size="lg" className="shrink-0 gap-2">
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Search</span>
            </Button>
          </div>

          {/* Popular cities */}
          <div className="flex items-center justify-center gap-2 mt-5 flex-wrap">
            <span className="text-primary-foreground/40 text-xs">Popular:</span>
            {popularCities.map((city) => (
              <button
                key={city}
                onClick={() => { setSearchQuery(city); navigate(`/listings?q=${encodeURIComponent(city)}`); }}
                className="text-xs px-3 py-1.5 rounded-full bg-primary-foreground/10 text-primary-foreground/70 hover:bg-primary-foreground/20 transition-colors border border-primary-foreground/10"
              >
                {city}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="flex items-center justify-center gap-10 md:gap-16 mt-14"
        >
          {[
            { value: "2,500+", label: "Properties" },
            { value: "15K+", label: "Happy Tenants" },
            { value: "25+", label: "Cities" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="font-heading font-extrabold text-2xl md:text-3xl text-primary-foreground">{stat.value}</p>
              <p className="text-primary-foreground/50 text-xs mt-1">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
