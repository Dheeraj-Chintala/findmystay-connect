import { Link } from "react-router-dom";
import { Building2, ArrowRight, Shield, Star, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import heroBg from "@/assets/hero-bg.jpg";
import listing1 from "@/assets/listing-1.jpg";
import listing3 from "@/assets/listing-3.jpg";
import listing5 from "@/assets/listing-5.jpg";

const Welcome = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBg} alt="Welcome" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-hero opacity-90" />
          <div className="absolute top-20 -left-32 w-96 h-96 bg-primary/15 rounded-full blur-3xl animate-pulse-soft" />
          <div className="absolute bottom-20 -right-32 w-96 h-96 bg-accent/15 rounded-full blur-3xl animate-pulse-soft" />
        </div>

        <div className="relative z-10 container mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="flex items-center gap-2.5 mb-8">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg">
                  <Building2 className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-heading font-extrabold text-2xl text-primary-foreground">
                  FindMyStay
                </span>
              </div>

              <h1 className="font-heading font-extrabold text-4xl md:text-5xl lg:text-6xl text-primary-foreground leading-[1.1] mb-6">
                Your Next Home
                <br />
                <span className="text-gradient">Awaits You</span>
              </h1>

              <p className="text-primary-foreground/60 text-lg mb-10 max-w-md leading-relaxed">
                Join thousands of students and professionals who found their perfect hostel, PG, or co-living space.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/">
                  <Button variant="hero" size="xl" className="gap-2 w-full sm:w-auto">
                    Get Started <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="hero-outline" size="xl" className="w-full sm:w-auto">
                    Sign In
                  </Button>
                </Link>
              </div>

              {/* Trust stats */}
              <div className="flex gap-10 mt-12">
                {[
                  { icon: Shield, label: "Verified", value: "2,500+ stays" },
                  { icon: Star, label: "Rated", value: "4.8/5 avg" },
                  { icon: MapPin, label: "Cities", value: "25+" },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary-foreground/10 flex items-center justify-center">
                      <s.icon className="w-4 h-4 text-primary-foreground/60" />
                    </div>
                    <div>
                      <p className="text-primary-foreground font-heading font-bold text-sm">{s.value}</p>
                      <p className="text-primary-foreground/40 text-xs">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right - Preview cards */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="hidden lg:block"
            >
              <div className="relative">
                <div className="absolute -top-4 -left-4 w-72 h-80 rounded-3xl overflow-hidden shadow-elevated rotate-[-6deg] hover:rotate-0 transition-transform duration-500">
                  <img src={listing1} alt="" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-foreground/80 to-transparent">
                    <p className="text-primary-foreground font-heading font-semibold text-sm">Sunrise Co-Living</p>
                    <p className="text-primary-foreground/60 text-xs">₹8,500/mo · Bangalore</p>
                  </div>
                </div>
                <div className="absolute top-20 left-48 w-72 h-80 rounded-3xl overflow-hidden shadow-elevated rotate-[4deg] hover:rotate-0 transition-transform duration-500 z-10">
                  <img src={listing3} alt="" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-foreground/80 to-transparent">
                    <p className="text-primary-foreground font-heading font-semibold text-sm">Elite PG</p>
                    <p className="text-primary-foreground/60 text-xs">₹12,000/mo · Noida</p>
                  </div>
                </div>
                <div className="absolute top-48 -left-2 w-64 h-72 rounded-3xl overflow-hidden shadow-elevated rotate-[8deg] hover:rotate-0 transition-transform duration-500">
                  <img src={listing5} alt="" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-foreground/80 to-transparent">
                    <p className="text-primary-foreground font-heading font-semibold text-sm">Grace Ladies PG</p>
                    <p className="text-primary-foreground/60 text-xs">₹9,000/mo · Bangalore</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Welcome;
