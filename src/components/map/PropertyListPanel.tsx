import { Star, IndianRupee, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import type { MapHostel } from "./types";

interface PropertyListPanelProps {
  hostels: MapHostel[];
  selectedId: string | null;
  onSelect: (hostel: MapHostel) => void;
  loading: boolean;
}

const PropertyListPanel = ({ hostels, selectedId, onSelect, loading }: PropertyListPanelProps) => {
  if (loading) {
    return (
      <div className="space-y-3 p-1">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-card rounded-xl border border-border p-3 animate-pulse">
            <div className="h-4 bg-secondary rounded w-3/4 mb-2" />
            <div className="h-3 bg-secondary rounded w-1/2 mb-2" />
            <div className="h-3 bg-secondary rounded w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  if (hostels.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <MapPin className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No properties found matching your filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-1">
      <p className="text-xs text-muted-foreground font-medium px-1">{hostels.length} properties found</p>
      {hostels.map((hostel, i) => (
        <motion.div
          key={hostel.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.03 }}
        >
          <button
            onClick={() => onSelect(hostel)}
            className={`w-full text-left bg-card rounded-xl border p-3 transition-all hover:shadow-[var(--shadow-card-hover)] ${
              selectedId === hostel.id ? "border-primary ring-1 ring-primary/20" : "border-border"
            }`}
          >
            <div className="flex gap-3">
              {hostel.image_url && (
                <img
                  src={hostel.image_url}
                  alt={hostel.hostel_name}
                  className="w-16 h-16 rounded-lg object-cover shrink-0"
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <h4 className="font-heading font-semibold text-xs truncate">{hostel.hostel_name}</h4>
                  {hostel.verified_status === "verified" && (
                    <Badge className="bg-verified text-verified-foreground text-[8px] px-1.5 py-0 shrink-0">✓</Badge>
                  )}
                </div>
                <p className="text-muted-foreground text-[10px] truncate mb-1">{hostel.location}</p>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="font-heading font-bold text-primary flex items-center">
                    <IndianRupee className="w-2.5 h-2.5" />
                    {hostel.price_min.toLocaleString()}
                  </span>
                  {hostel.rating && hostel.rating > 0 && (
                    <span className="flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 fill-accent text-accent" />
                      {hostel.rating}
                    </span>
                  )}
                  <Badge variant="secondary" className="text-[8px] capitalize px-1.5 py-0">{hostel.property_type}</Badge>
                </div>
              </div>
            </div>
          </button>
        </motion.div>
      ))}
    </div>
  );
};

export default PropertyListPanel;
