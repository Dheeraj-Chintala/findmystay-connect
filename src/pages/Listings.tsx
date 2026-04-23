import { useState, useMemo, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { SlidersHorizontal, X, Star, Heart, MapPin, BadgeCheck, Wifi, Wind, UtensilsCrossed, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

interface HostelListing {
  id: string;
  hostel_name: string;
  location: string;
  city: string;
  price_min: number;
  price_max: number;
  rating: number | null;
  review_count: number | null;
  property_type: string;
  gender: string;
  verified_status: string;
  media_verification_badge: string | null;
  image_url?: string | null;
  facilities: { wifi?: boolean; ac?: boolean; food?: boolean; laundry?: boolean; gym?: boolean; parking?: boolean } | null;
}

const amenityIcons: Record<string, React.ReactNode> = {
  wifi: <Wifi className="w-3.5 h-3.5" />,
  ac: <Wind className="w-3.5 h-3.5" />,
  food: <UtensilsCrossed className="w-3.5 h-3.5" />,
};

const cities = ["All Cities", "Bangalore", "Mumbai", "Delhi NCR", "Pune", "Hyderabad", "Chennai"];
const propertyTypes = ["All Types", "Hostel", "PG", "Co-Living"];
const genderOptions = ["All", "Male", "Female", "Co-ed"];

const Listings = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [search, setSearch] = useState(initialQuery);
  const [selectedCity, setSelectedCity] = useState("All Cities");
  const [selectedType, setSelectedType] = useState("All Types");
  const [selectedGender, setSelectedGender] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [hostels, setHostels] = useState<HostelListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHostels = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("hostels")
        .select(`
          id, hostel_name, location, city, price_min, price_max, rating, review_count,
          property_type, gender, verified_status, media_verification_badge,
          hostel_images(image_url, display_order),
          facilities(wifi, ac, food, laundry, gym, parking)
        `)
        .eq("verified_status", "verified")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (data) {
        setHostels(data.map((h: any) => ({
          ...h,
          image_url: h.hostel_images?.sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0))?.[0]?.image_url || null,
          facilities: h.facilities?.[0] || h.facilities || null,
        })));
      }
      setLoading(false);
    };
    fetchHostels();
  }, []);

  const filtered = useMemo(() => {
    return hostels.filter((h) => {
      const q = search.toLowerCase();
      const matchSearch = !search || h.hostel_name.toLowerCase().includes(q) || h.location.toLowerCase().includes(q) || h.city.toLowerCase().includes(q);
      const matchCity = selectedCity === "All Cities" || h.city.toLowerCase() === selectedCity.toLowerCase();
      const matchType = selectedType === "All Types" || h.property_type === selectedType.toLowerCase().replace("-", "-");
      const gMap: Record<string, string> = { Male: "male", Female: "female", "Co-ed": "co-ed" };
      const matchGender = selectedGender === "All" || h.gender === gMap[selectedGender];
      return matchSearch && matchCity && matchType && matchGender;
    });
  }, [search, selectedCity, selectedType, selectedGender, hostels]);

  const hasFilters = selectedCity !== "All Cities" || selectedType !== "All Types" || selectedGender !== "All";

  const getFacilityList = (f: HostelListing["facilities"]) => {
    if (!f) return [];
    return Object.entries(f).filter(([, v]) => v).map(([k]) => k);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 lg:pt-24">
        <div className="container mx-auto px-4 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-heading font-bold text-2xl md:text-3xl">Explore Stays</h1>
              <p className="text-muted-foreground text-sm mt-1">{filtered.length} properties found</p>
            </div>
            <Button variant="outline" className="md:hidden gap-2 rounded-full" onClick={() => setShowFilters(!showFilters)}>
              <SlidersHorizontal className="w-4 h-4" /> Filters
            </Button>
          </div>

          <div className={`${showFilters ? "block" : "hidden"} md:block mb-8`}>
            <div className="flex flex-wrap gap-3">
              <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="px-4 py-2 rounded-full border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring w-full sm:w-auto" />
              <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} className="px-4 py-2 rounded-full border border-border bg-card text-sm focus:outline-none">
                {cities.map((c) => <option key={c}>{c}</option>)}
              </select>
              <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="px-4 py-2 rounded-full border border-border bg-card text-sm focus:outline-none">
                {propertyTypes.map((t) => <option key={t}>{t}</option>)}
              </select>
              <select value={selectedGender} onChange={(e) => setSelectedGender(e.target.value)} className="px-4 py-2 rounded-full border border-border bg-card text-sm focus:outline-none">
                {genderOptions.map((g) => <option key={g}>{g}</option>)}
              </select>
              {hasFilters && (
                <Button variant="ghost" size="sm" className="gap-1 text-destructive" onClick={() => { setSelectedCity("All Cities"); setSelectedType("All Types"); setSelectedGender("All"); }}>
                  <X className="w-3 h-3" /> Clear
                </Button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((hostel, i) => {
                const amenities = getFacilityList(hostel.facilities);
                return (
                  <motion.div key={hostel.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.07 }}>
                    <Link to={`/listing/${hostel.id}`} className="group block">
                      <div className="bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 group-hover:-translate-y-1 border border-border/50">
                        <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
                          {hostel.image_url ? (
                            <img src={hostel.image_url} alt={hostel.hostel_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">No Image</div>
                          )}
                          <div className="absolute top-3 left-3 flex gap-2">
                            <Badge className="bg-verified text-verified-foreground gap-1 text-[11px] font-semibold shadow-sm">
                              <BadgeCheck className="w-3 h-3" /> Verified
                            </Badge>
                            <Badge variant="secondary" className="text-[11px] capitalize bg-card/90 backdrop-blur-sm shadow-sm">{hostel.property_type}</Badge>
                          </div>
                          <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-all hover:scale-110" onClick={(e) => e.preventDefault()}>
                            <Heart className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <div className="absolute bottom-3 left-3">
                            <Badge variant="secondary" className="bg-card/90 backdrop-blur-sm text-[11px] capitalize shadow-sm">{hostel.gender}</Badge>
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <h3 className="font-heading font-semibold text-card-foreground line-clamp-1 text-[15px]">{hostel.hostel_name}</h3>
                            {hostel.rating && (
                              <div className="flex items-center gap-1 shrink-0 bg-secondary/80 px-2 py-0.5 rounded-md">
                                <Star className="w-3.5 h-3.5 fill-verified text-verified" />
                                <span className="text-xs font-bold">{hostel.rating}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground mb-3">
                            <MapPin className="w-3.5 h-3.5" />
                            <span className="text-sm line-clamp-1">{hostel.location}, {hostel.city}</span>
                          </div>
                          {amenities.length > 0 && (
                            <div className="flex items-center gap-3 mb-3">
                              {amenities.slice(0, 3).map((a) => (
                                <div key={a} className="flex items-center gap-1 text-muted-foreground">
                                  {amenityIcons[a] || null}
                                  <span className="text-xs capitalize">{a}</span>
                                </div>
                              ))}
                              {amenities.length > 3 && (
                                <span className="text-xs text-muted-foreground bg-secondary rounded-full px-2 py-0.5">+{amenities.length - 3}</span>
                              )}
                            </div>
                          )}
                          <div className="flex items-baseline gap-1 pt-2 border-t border-border/50">
                            <span className="font-heading font-bold text-lg text-primary">₹{hostel.price_min.toLocaleString()}</span>
                            <span className="text-xs text-muted-foreground">/ month</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">No properties found matching your criteria.</p>
              <Button variant="outline" className="mt-4" onClick={() => { setSearch(""); setSelectedCity("All Cities"); setSelectedType("All Types"); setSelectedGender("All"); }}>
                Reset Filters
              </Button>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Listings;
