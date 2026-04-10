import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Shield, Star, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import PropertyCard, { FeaturedListing } from "./PropertyCard";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
const listingPlaceholder = "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600&q=80";

const FACILITY_LABELS: Record<string, string> = {
  wifi: "WiFi",
  ac: "AC",
  food: "Food",
  laundry: "Laundry",
  gym: "Gym",
  parking: "Parking",
  pool: "Pool",
  power_backup: "Power Backup",
  cctv: "CCTV",
  geyser: "Geyser",
  washing_machine: "Washing Machine",
  housekeeping: "Housekeeping",
  common_kitchen: "Common Kitchen",
  study_room: "Study Room",
};

function facilitiesToAmenities(f: Record<string, unknown> | null): string[] {
  if (!f) return [];
  const out: string[] = [];
  Object.entries(f).forEach(([key, val]) => {
    if (val === true && FACILITY_LABELS[key]) out.push(FACILITY_LABELS[key]);
  });
  return out;
}

const FeaturedListings = () => {
  const [featured, setFeatured] = useState<FeaturedListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: hostels, error } = await supabase
        .from("hostels")
        .select(
          `
          id,
          hostel_name,
          location,
          city,
          price_min,
          rating,
          review_count,
          property_type,
          gender,
          verified_status,
          media_verification_badge,
          hostel_images(image_url, display_order),
          facilities(wifi, ac, food, laundry, gym, parking, pool, power_backup, cctv, geyser, washing_machine, housekeeping, common_kitchen, study_room)
        `,
        )
        .eq("is_active", true)
        .eq("verified_status", "verified")
        .order("rating", { ascending: false })
        .limit(6);

      if (error || !hostels?.length) {
        setFeatured([]);
        setLoading(false);
        return;
      }

      const mapped: FeaturedListing[] = hostels.map((h: any) => {
        const imgs = (h.hostel_images || []).sort(
          (a: { display_order?: number }, b: { display_order?: number }) =>
            (a.display_order ?? 0) - (b.display_order ?? 0),
        );
        const imageUrl = imgs[0]?.image_url || listingPlaceholder;
        const fac = Array.isArray(h.facilities) ? h.facilities[0] : h.facilities;
        return {
          id: h.id,
          title: h.hostel_name,
          location: `${h.location}, ${h.city}`,
          image: imageUrl,
          rating: typeof h.rating === "number" ? h.rating : 0,
          verified: h.verified_status === "verified",
          type: h.property_type || "hostel",
          gender: h.gender || "co-ed",
          price: h.price_min ?? 0,
          amenities: facilitiesToAmenities(fac || null),
          mediaVerificationBadge: h.media_verification_badge,
        };
      });

      setFeatured(mapped);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1 h-6 rounded-full bg-gradient-primary" />
              <span className="text-primary font-heading font-semibold text-sm uppercase tracking-wider">Featured</span>
            </div>
            <h2 className="font-heading font-bold text-2xl md:text-3xl text-foreground">
              Top Verified Properties
            </h2>
            <p className="text-muted-foreground mt-1">Handpicked stays trusted by thousands</p>
          </div>
          <Link to="/listings">
            <Button variant="ghost" className="gap-2 hidden sm:flex">
              View All <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((listing, i) => (
              <PropertyCard key={listing.id} listing={listing} index={i} />
            ))}
          </div>
        )}

        <div className="sm:hidden mt-6 text-center">
          <Link to="/listings">
            <Button variant="outline" className="gap-2 rounded-full">
              View All Properties <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {[
            { icon: Shield, title: "Verified Properties", desc: "Every listing is physically verified by our team" },
            { icon: Star, title: "Genuine Reviews", desc: "Only verified residents can leave reviews" },
            { icon: CheckCircle2, title: "Secure Booking", desc: "Your money is safe until you confirm your stay" },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-4 p-5 rounded-2xl bg-secondary/50 border border-border/50">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <item.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-sm mb-1">{item.title}</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturedListings;
