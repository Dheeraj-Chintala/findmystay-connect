import { useState } from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { motion, AnimatePresence } from "framer-motion";

interface MapFiltersProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  priceRange: [number, number];
  onPriceRangeChange: (r: [number, number]) => void;
  minRating: number;
  onMinRatingChange: (r: number) => void;
  selectedFacilities: string[];
  onFacilitiesChange: (f: string[]) => void;
  selectedGender: string;
  onGenderChange: (g: string) => void;
  radius: number;
  onRadiusChange: (r: number) => void;
  onDiscoverNearby: () => void;
  locating: boolean;
}

const FACILITIES = ["WiFi", "Laundry", "Food", "AC", "Parking", "Gym", "CCTV", "Power Backup"];
const GENDERS = ["All", "Boys", "Girls", "Co-living"];
const RADII = [2, 5, 10];

const MapFilters = ({
  searchQuery, onSearchChange,
  priceRange, onPriceRangeChange,
  minRating, onMinRatingChange,
  selectedFacilities, onFacilitiesChange,
  selectedGender, onGenderChange,
  radius, onRadiusChange,
  onDiscoverNearby, locating,
}: MapFiltersProps) => {
  const [expanded, setExpanded] = useState(false);

  const toggleFacility = (f: string) => {
    onFacilitiesChange(
      selectedFacilities.includes(f)
        ? selectedFacilities.filter(x => x !== f)
        : [...selectedFacilities, f]
    );
  };

  const hasActiveFilters = minRating > 0 || selectedFacilities.length > 0 || selectedGender !== "All" || priceRange[0] > 1000 || priceRange[1] < 30000;

  const clearAll = () => {
    onSearchChange("");
    onPriceRangeChange([1000, 30000]);
    onMinRatingChange(0);
    onFacilitiesChange([]);
    onGenderChange("All");
  };

  return (
    <div className="space-y-3">
      {/* Search + Discover */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search area, city, hostel..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-10 rounded-xl"
          />
          {searchQuery && (
            <button onClick={() => onSearchChange("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
        <Button
          onClick={onDiscoverNearby}
          disabled={locating}
          className="shrink-0 rounded-xl gap-1.5"
          size="sm"
        >
          {locating ? "Locating..." : "Discover Nearby"}
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="shrink-0 h-10 w-10 rounded-xl relative"
          onClick={() => setExpanded(!expanded)}
        >
          <SlidersHorizontal className="w-4 h-4" />
          {hasActiveFilters && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-accent" />
          )}
        </Button>
      </div>

      {/* Radius pills */}
      <div className="flex gap-2 items-center">
        <span className="text-xs text-muted-foreground font-medium">Radius:</span>
        {RADII.map(r => (
          <button
            key={r}
            onClick={() => onRadiusChange(r)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              radius === r
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {r} km
          </button>
        ))}
      </div>

      {/* Expanded filters */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-card rounded-xl border border-border p-4 space-y-4">
              {/* Price Range */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">
                  Price Range: ₹{priceRange[0].toLocaleString()} – ₹{priceRange[1].toLocaleString()}
                </label>
                <Slider
                  min={1000}
                  max={30000}
                  step={500}
                  value={priceRange}
                  onValueChange={(v) => onPriceRangeChange(v as [number, number])}
                  className="mt-2"
                />
              </div>

              {/* Rating */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">
                  Minimum Rating: {minRating > 0 ? `${minRating}+` : "Any"}
                </label>
                <div className="flex gap-2">
                  {[0, 3, 3.5, 4, 4.5].map(r => (
                    <button
                      key={r}
                      onClick={() => onMinRatingChange(r)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        minRating === r
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      }`}
                    >
                      {r === 0 ? "Any" : `${r}★`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Facilities */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Facilities</label>
                <div className="flex flex-wrap gap-2">
                  {FACILITIES.map(f => (
                    <label key={f} className="flex items-center gap-1.5 cursor-pointer">
                      <Checkbox
                        checked={selectedFacilities.includes(f)}
                        onCheckedChange={() => toggleFacility(f)}
                      />
                      <span className="text-xs">{f}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Gender */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Gender Type</label>
                <div className="flex gap-2">
                  {GENDERS.map(g => (
                    <button
                      key={g}
                      onClick={() => onGenderChange(g)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        selectedGender === g
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" className="text-destructive gap-1" onClick={clearAll}>
                  <X className="w-3 h-3" /> Clear All Filters
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MapFilters;
