import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShirtIcon, Clock, Truck, Star, ArrowRight, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  { icon: ShirtIcon, title: "Select Services", desc: "Choose from wash, iron, dry clean & more" },
  { icon: Clock, title: "Schedule Pickup", desc: "Pick a convenient date and time" },
  { icon: Truck, title: "Track Progress", desc: "Real-time status updates on your order" },
  { icon: CheckCircle2, title: "Get Delivered", desc: "Fresh clothes delivered to your door" },
];

const LaundryHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-hero text-primary-foreground py-16 px-4">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <ShirtIcon className="w-12 h-12 mx-auto mb-4 opacity-80" />
              <h1 className="font-heading font-bold text-3xl md:text-4xl">Laundry Services</h1>
              <p className="text-lg opacity-80 max-w-xl mx-auto">
                Professional laundry at your hostel doorstep. Wash, iron, dry clean — we handle it all.
              </p>
              <div className="flex gap-3 justify-center mt-6">
                <Button
                  size="lg"
                  variant="secondary"
                  className="rounded-xl gap-2"
                  onClick={() => navigate(user ? "/dashboard/laundry" : "/login")}
                >
                  Book Now <ArrowRight className="w-4 h-4" />
                </Button>
                {!user && (
                  <Button size="lg" variant="outline" className="rounded-xl border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" onClick={() => navigate("/login")}>
                    Sign In
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-heading font-bold text-2xl text-center mb-10">How It Works</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {steps.map((step, i) => (
                <motion.div key={step.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                  <Card className="text-center h-full">
                    <CardContent className="p-6 space-y-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                        <step.icon className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="font-heading font-semibold">{step.title}</h3>
                      <p className="text-sm text-muted-foreground">{step.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 px-4 bg-muted/30">
          <div className="max-w-2xl mx-auto text-center space-y-4">
            <Star className="w-8 h-8 mx-auto text-verified" />
            <h2 className="font-heading font-bold text-xl">Trusted by Hostel Residents</h2>
            <p className="text-sm text-muted-foreground">Quick turnaround, affordable pricing, and doorstep service</p>
            <Button className="rounded-xl gap-2" onClick={() => navigate(user ? "/dashboard/laundry" : "/login")}>
              Get Started <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default LaundryHome;
