import { useState } from "react";
import { Search, MapPin, IndianRupee, Star, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const UserSearch = () => {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [gender, setGender] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    setSearched(true);
    let q = supabase
      .from("hostels")
      .select("id, hostel_name, city, location, price_min, price_max, rating, review_count, gender, property_type, verified_status, media_verification_badge")
      .eq("is_active", true)
      .eq("verified_status", "verified");

    if (query) q = q.or(`hostel_name.ilike.%${query}%,location.ilike.%${query}%`);
    if (city) q = q.ilike("city", `%${city}%`);
    if (priceMax) {
      const budget = parseInt(priceMax);
      if (!isNaN(budget) && budget > 0) q = q.lte("price_min", budget);
    }
    if (gender && gender !== "all") q = q.eq("gender", gender);

    const { data, error } = await q.order("rating", { ascending: false }).limit(20);
    if (error) { toast.error(error.message); setLoading(false); return; }
    setResults(data || []);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading font-bold text-xl mb-1">Search Hostels</h2>
        <p className="text-muted-foreground text-sm">Find the perfect accommodation</p>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-2xl border border-border/50 shadow-card p-5">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or area..."
              className="pl-10 rounded-xl"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="City..."
              className="pl-10 rounded-xl"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
          <div className="relative">
            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Max budget..."
              className="pl-10 rounded-xl"
              type="number"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
            />
          </div>
          <Select value={gender} onValueChange={setGender}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="co-ed">Co-ed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleSearch} className="gap-2 rounded-xl" disabled={loading}>
          <Search className="w-4 h-4" /> {loading ? "Searching..." : "Search"}
        </Button>
      </div>

      {/* Results */}
      {searched && (
        <div>
          <p className="text-sm text-muted-foreground mb-4">{results.length} results found</p>
          {results.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
              <Building2 className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">No hostels found. Try different filters.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((hostel) => (
                <Link key={hostel.id} to={`/listing/${hostel.id}`}>
                  <div className="bg-card rounded-2xl border border-border/50 shadow-card hover:shadow-card-hover transition-all p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-heading font-semibold text-sm truncate flex-1">{hostel.hostel_name}</h4>
                      <Badge variant="secondary" className="text-[9px] capitalize ml-2">{hostel.property_type}</Badge>
                    </div>
                    <p className="text-muted-foreground text-xs flex items-center gap-1 mb-1">
                      <MapPin className="w-3 h-3" /> {hostel.location}, {hostel.city}
                    </p>
                    <p className="text-muted-foreground text-[10px] capitalize mb-3">{hostel.gender}</p>
                    <div className="flex items-center justify-between">
                      <span className="font-heading font-bold text-sm text-primary">
                        ₹{hostel.price_min?.toLocaleString()}<span className="text-xs font-normal text-muted-foreground">/mo</span>
                      </span>
                      <span className="flex items-center gap-1 text-xs">
                        <Star className="w-3 h-3 text-verified fill-verified" /> {hostel.rating || "New"}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserSearch;
