import { Link } from "react-router-dom";
import { Star, Heart, MapPin, BadgeCheck, Wifi, Wind, UtensilsCrossed } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import type { Listing } from "@/data/mockListings";

const amenityIcons: Record<string, React.ReactNode> = {
  WiFi: <Wifi className="w-3.5 h-3.5" />,
  AC: <Wind className="w-3.5 h-3.5" />,
  Food: <UtensilsCrossed className="w-3.5 h-3.5" />,
};

interface PropertyCardProps {
  listing: Listing;
  index?: number;
}

const PropertyCard = ({ listing, index = 0 }: PropertyCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      <Link to={`/listing/${listing.id}`} className="group block">
        <div className="bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 group-hover:-translate-y-1">
          {/* Image */}
          <div className="relative aspect-[4/3] overflow-hidden">
            <img
              src={listing.image}
              alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {/* Overlays */}
            <div className="absolute top-3 left-3 flex gap-2">
              {listing.verified && (
                <Badge className="bg-verified text-verified-foreground gap-1 text-xs font-medium">
                  <BadgeCheck className="w-3 h-3" /> Verified
                </Badge>
              )}
              <Badge variant="secondary" className="text-xs capitalize">{listing.type}</Badge>
            </div>
            <button
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors"
              onClick={(e) => { e.preventDefault(); }}
            >
              <Heart className="w-4 h-4 text-muted-foreground" />
            </button>
            {/* Gender badge */}
            <div className="absolute bottom-3 left-3">
              <Badge variant="secondary" className="bg-card/90 backdrop-blur-sm text-xs capitalize">
                {listing.gender}
              </Badge>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-heading font-semibold text-card-foreground line-clamp-1">{listing.title}</h3>
              <div className="flex items-center gap-1 shrink-0">
                <Star className="w-4 h-4 fill-accent text-accent" />
                <span className="text-sm font-semibold">{listing.rating}</span>
                <span className="text-xs text-muted-foreground">({listing.reviewCount})</span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-muted-foreground mb-3">
              <MapPin className="w-3.5 h-3.5" />
              <span className="text-sm line-clamp-1">{listing.location}</span>
            </div>

            {/* Amenities */}
            <div className="flex items-center gap-3 mb-3">
              {listing.amenities.slice(0, 3).map((a) => (
                <div key={a} className="flex items-center gap-1 text-muted-foreground">
                  {amenityIcons[a] || null}
                  <span className="text-xs">{a}</span>
                </div>
              ))}
              {listing.amenities.length > 3 && (
                <span className="text-xs text-muted-foreground">+{listing.amenities.length - 3}</span>
              )}
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-1">
              <span className="font-heading font-bold text-lg text-foreground">₹{listing.price.toLocaleString()}</span>
              <span className="text-sm text-muted-foreground">/ month</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default PropertyCard;
