import { useState, useEffect, useRef } from "react";
import { Loader2, MapPin } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import PropertyPreviewCard from "./PropertyPreviewCard";
import type { MapHostel } from "./types";

// Default center (Hyderabad)
const DEFAULT_CENTER = { lat: 17.385, lng: 78.4867 };

interface MapContainerProps {
  hostels: MapHostel[];
  selectedHostel: MapHostel | null;
  onSelectHostel: (h: MapHostel | null) => void;
  userLocation: { lat: number; lng: number } | null;
  onMapReady?: () => void;
}

const MapContainer = ({ hostels, selectedHostel, onSelectHostel, userLocation, onMapReady }: MapContainerProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [scriptLoading, setScriptLoading] = useState(true);

  // Load Google Maps script
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn("VITE_GOOGLE_MAPS_API_KEY is not configured. Map will show fallback UI.");
      setScriptLoading(false);
      return;
    }

    if ((window as any).google?.maps) {
      setMapLoaded(true);
      setScriptLoading(false);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker,places&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = () => { setMapLoaded(true); setScriptLoading(false); };
    script.onerror = () => { setScriptLoading(false); };
    document.head.appendChild(script);
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || googleMapRef.current) return;

    const gm = (window as any).google.maps;
    const center = userLocation || DEFAULT_CENTER;
    const map = new gm.Map(mapRef.current, {
      center,
      zoom: 12,
      mapId: "staynest-map",
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      styles: [{ featureType: "poi", stylers: [{ visibility: "off" }] }],
    });

    googleMapRef.current = map;
    onMapReady?.();

    // User location marker
    if (userLocation) {
      const dot = document.createElement("div");
      dot.innerHTML = `<div style="width:14px;height:14px;background:hsl(25,41%,39%);border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`;
      new gm.marker.AdvancedMarkerElement({ map, position: userLocation, content: dot, title: "You" });
    }
  }, [mapLoaded, userLocation]);

  // Pan to user location when it changes
  useEffect(() => {
    if (userLocation && googleMapRef.current) {
      googleMapRef.current.panTo(userLocation);
      googleMapRef.current.setZoom(14);
    }
  }, [userLocation]);

  // Add/update markers
  useEffect(() => {
    if (!googleMapRef.current || !mapLoaded) return;

    // Clear
    markersRef.current.forEach(m => m.map = null);
    markersRef.current = [];

    if (!hostels.length) return;

    const gm = (window as any).google.maps;

    hostels.forEach((hostel) => {
      if (!hostel.latitude || !hostel.longitude) return;

      const el = document.createElement("div");
      el.innerHTML = `<span style="
        background: hsl(25, 41%, 39%);
        color: white;
        padding: 5px 12px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 700;
        font-family: 'Poppins', sans-serif;
        white-space: nowrap;
        box-shadow: 0 2px 8px rgba(139,94,60,0.3);
        cursor: pointer;
        display: inline-block;
        transition: transform 0.15s;
      ">₹${hostel.price_min.toLocaleString()}</span>`;

      el.addEventListener("mouseenter", () => {
        const span = el.querySelector("span");
        if (span) span.style.transform = "scale(1.1)";
      });
      el.addEventListener("mouseleave", () => {
        const span = el.querySelector("span");
        if (span) span.style.transform = "scale(1)";
      });

      const marker = new gm.marker.AdvancedMarkerElement({
        map: googleMapRef.current!,
        position: { lat: hostel.latitude, lng: hostel.longitude },
        content: el,
        title: hostel.hostel_name,
      });

      marker.addListener("click", () => {
        onSelectHostel(hostel);
        googleMapRef.current?.panTo({ lat: hostel.latitude!, lng: hostel.longitude! });
      });

      markersRef.current.push(marker);
    });

    // Fit bounds
    if (hostels.length > 1 && !userLocation) {
      const bounds = new gm.LatLngBounds();
      hostels.forEach(h => {
        if (h.latitude && h.longitude) bounds.extend({ lat: h.latitude, lng: h.longitude });
      });
      googleMapRef.current?.fitBounds(bounds, 60);
    }
  }, [hostels, mapLoaded]);

  // Pan to selected
  useEffect(() => {
    if (selectedHostel?.latitude && selectedHostel?.longitude && googleMapRef.current) {
      googleMapRef.current.panTo({ lat: selectedHostel.latitude, lng: selectedHostel.longitude });
    }
  }, [selectedHostel]);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-card rounded-2xl border border-border">
        <div className="text-center p-8">
          <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-heading font-semibold text-lg mb-2">Map Unavailable</h3>
          <p className="text-muted-foreground text-sm">Please configure Google Maps API to enable map discovery.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-border">
      <div ref={mapRef} className="w-full h-full" />

      {scriptLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-card/80 backdrop-blur-sm">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      <AnimatePresence>
        {selectedHostel && (
          <PropertyPreviewCard
            hostel={selectedHostel}
            onClose={() => onSelectHostel(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MapContainer;
