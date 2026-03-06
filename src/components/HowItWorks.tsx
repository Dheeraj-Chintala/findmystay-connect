import { Search, BadgeCheck, CalendarCheck } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  {
    icon: Search,
    title: "Search & Discover",
    description: "Browse thousands of verified hostels, PGs, and co-living spaces across India.",
  },
  {
    icon: BadgeCheck,
    title: "Compare & Verify",
    description: "Check reviews, photos, amenities, and verified badges to find your perfect match.",
  },
  {
    icon: CalendarCheck,
    title: "Book & Move In",
    description: "Send a booking request, get confirmation, and move in hassle-free.",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-16 lg:py-24 bg-secondary/50">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="font-heading font-bold text-2xl md:text-3xl text-foreground mb-2">
            How It Works
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Finding your ideal stay is just 3 simple steps away
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                <step.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-heading font-semibold text-lg mb-2">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
