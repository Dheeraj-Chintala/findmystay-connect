import { useState, useEffect, useCallback, useMemo } from "react";
import { Map, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MapContainer from "@/components/map/MapContainer";
import MapFilters from "@/components/map/MapFilters";
import PropertyListPanel from "@/components/map/PropertyListPanel";
import type { MapHostel } from "@/components/map/types";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea } from "@/components/ui/scroll-area";

// Default center (Hyderabad)
const DEFAULT_CENTER = { lat: 17.385, lng: 78.4867 };

const MapView = () => {
  const isMobile = useIsMobile();
  const [mobileView, setMobileView] = useState<"map" | "list">("map");
  const [hostels, setHostels] = useState<MapHostel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHostel, setSelectedHostel] = useState<MapHostel | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [priceRange, setPriceRange] = useState<[number, number]>([1000, 30000]);
  const [minRating, setMinRating] = useState(0);
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  const [selectedGender, setSelectedGender] = useState("All");
  const [radius, setRadius] = useState(5);

  // Fetch hostels
  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("hostels")
        .select(`
          id, hostel_name, location, city, price_min, price_max, rating, review_count,
          latitude, longitude, property_type, verified_status, media_verification_badge, gender,
          hostel_images(image_url, display_order),
          facilities(wifi, ac, food, laundry, gym, parking, power_backup, cctv)
        `)
        .eq("is_active", true)
        .eq("verified_status", "verified");

      if (data) {
        const mapped = data.map((h: any) => ({
          ...h,
          image_url: h.hostel_images?.sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0))?.[0]?.image_url || null,
          _facilities: Array.isArray(h.facilities) ? h.facilities[0] : h.facilities,
        }));
        setHostels(mapped as any);
      }
      setLoading(false);
    };
    fetch();
  }, []);

  // Ask for location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {} // denied, use default
      );
    }
  }, []);

  // Discover nearby
  const discoverNearby = useCallback(() => {
    setLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocating(false);
        },
        () => setLocating(false)
      );
    } else {
      setLocating(false);
    }
  }, []);

  // Haversine distance
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // Filtered hostels
  const filtered = useMemo(() => {
    return hostels.filter(h => {
      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!h.hostel_name.toLowerCase().includes(q) && !h.city.toLowerCase().includes(q) && !h.location.toLowerCase().includes(q)) return false;
      }
      // Price
      if (h.price_min > priceRange[1] || h.price_max < priceRange[0]) return false;
      // Rating
      if (minRating > 0 && (!h.rating || h.rating < minRating)) return false;
      // Gender
      if (selectedGender !== "All") {
        const gMap: Record<string, string> = { Boys: "male", Girls: "female", "Co-living": "co-ed" };
        if (h.gender !== gMap[selectedGender]) return false;
      }
      // Facilities
      if (selectedFacilities.length > 0) {
        const fac = (h as any)._facilities;
        if (!fac) return false;
        const facilityMap: Record<string, string> = {
          WiFi: "wifi", Laundry: "laundry", Food: "food", AC: "ac",
          Parking: "parking", Gym: "gym", CCTV: "cctv", "Power Backup": "power_backup",
        };
        for (const sf of selectedFacilities) {
          const key = facilityMap[sf];
          if (key && !fac[key]) return false;
        }
      }
      // Radius (only if user location known)
      if (userLocation && h.latitude && h.longitude) {
        const dist = getDistance(userLocation.lat, userLocation.lng, h.latitude, h.longitude);
        if (dist > radius) return false;
      }
      return true;
    });
  }, [hostels, searchQuery, priceRange, minRating, selectedGender, selectedFacilities, radius, userLocation]);

  const handleSelectFromList = (hostel: MapHostel) => {
    setSelectedHostel(hostel);
    if (isMobile) setMobileView("map");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="pt-20 lg:pt-24 flex-1 flex flex-col">
        <div className="container mx-auto px-4 lg:px-8 py-4 flex flex-col flex-1">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-heading font-bold text-2xl md:text-3xl">Discover Nearby</h1>
              <p className="text-muted-foreground text-sm">Find hostels and PGs on the map</p>
            </div>
            {/* Mobile toggle */}
            {isMobile && (
              <div className="flex gap-1 bg-secondary rounded-xl p-1">
                <Button
                  variant={mobileView === "map" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-lg gap-1 h-8"
                  onClick={() => setMobileView("map")}
                >
                  <Map className="w-3.5 h-3.5" /> Map
                </Button>
                <Button
                  variant={mobileView === "list" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-lg gap-1 h-8"
                  onClick={() => setMobileView("list")}
                >
                  <List className="w-3.5 h-3.5" /> List
                </Button>
              </div>
            )}
          </div>

          {/* Filters */}
          <MapFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            priceRange={priceRange}
            onPriceRangeChange={setPriceRange}
            minRating={minRating}
            onMinRatingChange={setMinRating}
            selectedFacilities={selectedFacilities}
            onFacilitiesChange={setSelectedFacilities}
            selectedGender={selectedGender}
            onGenderChange={setSelectedGender}
            radius={radius}
            onRadiusChange={setRadius}
            onDiscoverNearby={discoverNearby}
            locating={locating}
          />

          {/* Main content */}
          <div className="flex-1 mt-4 min-h-0">
            {isMobile ? (
              /* Mobile: toggle views */
              <div className="h-[60vh]">
                {mobileView === "map" ? (
                  <MapContainer
                    hostels={filtered}
                    selectedHostel={selectedHostel}
                    onSelectHostel={setSelectedHostel}
                    userLocation={userLocation}
                  />
                ) : (
                  <ScrollArea className="h-full">
                    <PropertyListPanel
                      hostels={filtered}
                      selectedId={selectedHostel?.id || null}
                      onSelect={handleSelectFromList}
                      loading={loading}
                    />
                  </ScrollArea>
                )}
              </div>
            ) : (
              /* Desktop: side by side */
              <div className="flex gap-4 h-[65vh]">
                <div className="w-80 shrink-0">
                  <ScrollArea className="h-full rounded-2xl border border-border bg-card/50 p-3">
                    <PropertyListPanel
                      hostels={filtered}
                      selectedId={selectedHostel?.id || null}
                      onSelect={(h) => setSelectedHostel(h)}
                      loading={loading}
                    />
                  </ScrollArea>
                </div>
                <div className="flex-1">
                  <MapContainer
                    hostels={filtered}
                    selectedHostel={selectedHostel}
                    onSelectHostel={setSelectedHostel}
                    userLocation={userLocation}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default MapView;
