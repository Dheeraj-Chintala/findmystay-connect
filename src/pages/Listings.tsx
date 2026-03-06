import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import { listings, cities, propertyTypes, genderOptions } from "@/data/mockListings";

const Listings = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [search, setSearch] = useState(initialQuery);
  const [selectedCity, setSelectedCity] = useState("All Cities");
  const [selectedType, setSelectedType] = useState("All Types");
  const [selectedGender, setSelectedGender] = useState("All");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return listings.filter((l) => {
      const matchSearch = !search || l.title.toLowerCase().includes(search.toLowerCase()) || l.location.toLowerCase().includes(search.toLowerCase()) || l.city.toLowerCase().includes(search.toLowerCase());
      const matchCity = selectedCity === "All Cities" || l.city === selectedCity;
      const matchType = selectedType === "All Types" || l.type === selectedType.toLowerCase();
      const matchGender = selectedGender === "All" || l.gender === selectedGender.toLowerCase();
      return matchSearch && matchCity && matchType && matchGender;
    });
  }, [search, selectedCity, selectedType, selectedGender]);

  const hasFilters = selectedCity !== "All Cities" || selectedType !== "All Types" || selectedGender !== "All";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 lg:pt-24">
        <div className="container mx-auto px-4 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-heading font-bold text-2xl md:text-3xl">Explore Stays</h1>
              <p className="text-muted-foreground text-sm mt-1">{filtered.length} properties found</p>
            </div>
            <Button variant="outline" className="md:hidden gap-2 rounded-full" onClick={() => setShowFilters(!showFilters)}>
              <SlidersHorizontal className="w-4 h-4" /> Filters
            </Button>
          </div>

          {/* Filters */}
          <div className={`${showFilters ? "block" : "hidden"} md:block mb-8`}>
            <div className="flex flex-wrap gap-3">
              {/* Search */}
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="px-4 py-2 rounded-full border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring w-full sm:w-auto"
              />
              {/* City */}
              <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} className="px-4 py-2 rounded-full border border-border bg-card text-sm focus:outline-none">
                {cities.map((c) => <option key={c}>{c}</option>)}
              </select>
              {/* Type */}
              <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="px-4 py-2 rounded-full border border-border bg-card text-sm focus:outline-none">
                {propertyTypes.map((t) => <option key={t}>{t}</option>)}
              </select>
              {/* Gender */}
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

          {/* Grid */}
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((listing, i) => (
                <PropertyCard key={listing.id} listing={listing} index={i} />
              ))}
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
