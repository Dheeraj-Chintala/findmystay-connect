import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Star, MapPin, BadgeCheck, Heart, Share2, Shield, Calendar, IndianRupee, Users, Wifi, Wind, UtensilsCrossed, Dumbbell, Car, Zap, Waves, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { listings } from "@/data/mockListings";
import { useState } from "react";
import { toast } from "sonner";

const amenityIconMap: Record<string, React.ReactNode> = {
  WiFi: <Wifi className="w-5 h-5" />,
  AC: <Wind className="w-5 h-5" />,
  Food: <UtensilsCrossed className="w-5 h-5" />,
  Gym: <Dumbbell className="w-5 h-5" />,
  Parking: <Car className="w-5 h-5" />,
  "Power Backup": <Zap className="w-5 h-5" />,
  Pool: <Waves className="w-5 h-5" />,
  Laundry: <Home className="w-5 h-5" />,
};

const ListingDetail = () => {
  const { id } = useParams();
  const listing = listings.find((l) => l.id === id);
  const [activeImage, setActiveImage] = useState(0);

  if (!listing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-heading font-semibold mb-4">Property not found</p>
          <Link to="/listings"><Button>Back to Listings</Button></Link>
        </div>
      </div>
    );
  }

  const handleBooking = () => {
    toast.success("Booking request sent! The owner will contact you shortly.");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 lg:pt-24">
        <div className="container mx-auto px-4 lg:px-8 py-6">
          {/* Back */}
          <Link to="/listings" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to listings
          </Link>

          {/* Image Gallery */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded-2xl overflow-hidden">
              <div className="md:col-span-2 aspect-[16/10] md:aspect-auto">
                <img src={listing.images[activeImage]} alt={listing.title} className="w-full h-full object-cover" />
              </div>
              <div className="hidden md:grid grid-rows-2 gap-3">
                {listing.images.slice(1, 3).map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i + 1)}
                    className={`overflow-hidden ${activeImage === i + 1 ? "ring-2 ring-primary" : ""}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                  </button>
                ))}
              </div>
            </div>
            {/* Thumbnails on mobile */}
            <div className="flex md:hidden gap-2 mt-3 overflow-x-auto">
              {listing.images.map((img, i) => (
                <button key={i} onClick={() => setActiveImage(i)} className={`shrink-0 w-20 h-16 rounded-lg overflow-hidden ${activeImage === i ? "ring-2 ring-primary" : ""}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Details */}
            <div className="lg:col-span-2 space-y-8">
              {/* Title */}
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {listing.verified && (
                        <Badge className="bg-verified text-verified-foreground gap-1">
                          <BadgeCheck className="w-3 h-3" /> Verified
                        </Badge>
                      )}
                      <Badge variant="secondary" className="capitalize">{listing.type}</Badge>
                      <Badge variant="secondary" className="capitalize">{listing.gender}</Badge>
                    </div>
                    <h1 className="font-heading font-bold text-2xl md:text-3xl">{listing.title}</h1>
                    <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">{listing.location}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors">
                      <Heart className="w-4 h-4" />
                    </button>
                    <button className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors">
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 fill-accent text-accent" />
                    <span className="font-semibold">{listing.rating}</span>
                    <span className="text-muted-foreground text-sm">({listing.reviewCount} reviews)</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Description */}
              <div>
                <h2 className="font-heading font-semibold text-lg mb-3">About this place</h2>
                <p className="text-muted-foreground leading-relaxed">{listing.description}</p>
              </div>

              {/* Highlights */}
              <div>
                <h2 className="font-heading font-semibold text-lg mb-3">Highlights</h2>
                <div className="flex flex-wrap gap-2">
                  {listing.highlights.map((h) => (
                    <Badge key={h} variant="secondary" className="py-1.5 px-3">{h}</Badge>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Amenities */}
              <div>
                <h2 className="font-heading font-semibold text-lg mb-4">Amenities</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {listing.amenities.map((a) => (
                    <div key={a} className="flex items-center gap-3 text-foreground">
                      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground">
                        {amenityIconMap[a] || <Home className="w-5 h-5" />}
                      </div>
                      <span className="text-sm font-medium">{a}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Reviews Placeholder */}
              <div>
                <h2 className="font-heading font-semibold text-lg mb-4">Reviews</h2>
                <div className="bg-secondary/50 rounded-2xl p-8 text-center">
                  <Star className="w-10 h-10 text-accent mx-auto mb-3" />
                  <p className="font-heading font-semibold text-2xl">{listing.rating} out of 5</p>
                  <p className="text-muted-foreground text-sm mt-1">Based on {listing.reviewCount} reviews</p>
                </div>
              </div>
            </div>

            {/* Right: Booking Card */}
            <div>
              <div className="sticky top-28">
                <div className="bg-card rounded-2xl shadow-card-hover p-6 border border-border">
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="font-heading font-bold text-2xl">₹{listing.price.toLocaleString()}</span>
                    <span className="text-muted-foreground">/ month</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">Occupancy: {listing.occupancy}</p>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> Available from
                      </span>
                      <span className="font-medium">{listing.availableFrom}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <IndianRupee className="w-4 h-4" /> Security Deposit
                      </span>
                      <span className="font-medium">₹{listing.deposit.toLocaleString()}</span>
                    </div>
                  </div>

                  <Button onClick={handleBooking} className="w-full rounded-xl h-12 text-base font-semibold">
                    Request Booking
                  </Button>

                  <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Secure booking · No charges yet</span>
                  </div>
                </div>

                {/* Owner */}
                <div className="mt-4 bg-card rounded-2xl p-5 border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-heading font-semibold text-sm">{listing.ownerName}</p>
                      <p className="text-xs text-muted-foreground">Property Owner</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ListingDetail;
