import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Star, MapPin, BadgeCheck, Heart, Share2, Shield, Calendar, IndianRupee, Users, Wifi, Wind, UtensilsCrossed, Dumbbell, Car, Zap, Waves, Home, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { listings } from "@/data/mockListings";
import { useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const amenityIconMap: Record<string, React.ReactNode> = {
  WiFi: <Wifi className="w-5 h-5" />,
  AC: <Wind className="w-5 h-5" />,
  Food: <UtensilsCrossed className="w-5 h-5" />,
  Gym: <Dumbbell className="w-5 h-5" />,
  Parking: <Car className="w-5 h-5" />,
  "Power Backup": <Zap className="w-5 h-5" />,
  Pool: <Waves className="w-5 h-5" />,
  Laundry: <Home className="w-5 h-5" />,
  CCTV: <Shield className="w-5 h-5" />,
  Housekeeping: <Home className="w-5 h-5" />,
  "Common Kitchen": <UtensilsCrossed className="w-5 h-5" />,
  "Study Room": <Home className="w-5 h-5" />,
};

const mockReviews = [
  { name: "Arjun S.", rating: 5, date: "2 weeks ago", comment: "Excellent place! Clean rooms, great food, and very helpful staff. Highly recommended for students.", avatar: "A" },
  { name: "Priya M.", rating: 4, date: "1 month ago", comment: "Good location and amenities. WiFi could be better during peak hours, but overall a great stay.", avatar: "P" },
  { name: "Rohit K.", rating: 5, date: "2 months ago", comment: "Best PG I've stayed in. The community vibe is amazing and the facilities are top-notch.", avatar: "R" },
];

const ListingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const listing = listings.find((l) => l.id === id);
  const [activeImage, setActiveImage] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [liked, setLiked] = useState(false);

  if (!listing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-xl font-heading font-semibold mb-4">Property not found</p>
          <Link to="/listings"><Button>Back to Listings</Button></Link>
        </div>
      </div>
    );
  }

  const nextImage = () => setActiveImage((prev) => (prev + 1) % listing.images.length);
  const prevImage = () => setActiveImage((prev) => (prev - 1 + listing.images.length) % listing.images.length);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Fullscreen Gallery */}
      <AnimatePresence>
        {galleryOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-foreground/95 flex items-center justify-center"
          >
            <button onClick={() => setGalleryOpen(false)} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center text-primary-foreground hover:bg-primary-foreground/20">
              <X className="w-5 h-5" />
            </button>
            <button onClick={prevImage} className="absolute left-6 w-12 h-12 rounded-full bg-primary-foreground/10 flex items-center justify-center text-primary-foreground hover:bg-primary-foreground/20">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <img src={listing.images[activeImage]} alt="" className="max-w-[85vw] max-h-[85vh] object-contain rounded-2xl" />
            <button onClick={nextImage} className="absolute right-6 w-12 h-12 rounded-full bg-primary-foreground/10 flex items-center justify-center text-primary-foreground hover:bg-primary-foreground/20">
              <ChevronRight className="w-6 h-6" />
            </button>
            <div className="absolute bottom-6 flex gap-2">
              {listing.images.map((_, i) => (
                <button key={i} onClick={() => setActiveImage(i)} className={`w-2.5 h-2.5 rounded-full transition-all ${activeImage === i ? "bg-primary-foreground scale-125" : "bg-primary-foreground/30"}`} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pt-20 lg:pt-24">
        <div className="container mx-auto px-4 lg:px-8 py-6">
          <Link to="/listings" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to listings
          </Link>

          {/* Image Gallery */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 rounded-2xl overflow-hidden">
              <button onClick={() => { setActiveImage(0); setGalleryOpen(true); }} className="md:col-span-2 md:row-span-2 aspect-[16/10] md:aspect-auto relative group overflow-hidden">
                <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors" />
              </button>
              {listing.images.slice(1, 3).map((img, i) => (
                <button key={i} onClick={() => { setActiveImage(i + 1); setGalleryOpen(true); }} className="hidden md:block aspect-[4/3] relative group overflow-hidden">
                  <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors" />
                </button>
              ))}
            </div>
            <div className="flex md:hidden gap-2 mt-3 overflow-x-auto pb-1">
              {listing.images.map((img, i) => (
                <button key={i} onClick={() => { setActiveImage(i); setGalleryOpen(true); }} className={`shrink-0 w-20 h-16 rounded-xl overflow-hidden border-2 ${activeImage === i ? "border-primary" : "border-transparent"}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Details */}
            <div className="lg:col-span-2 space-y-8">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {listing.verified && (
                        <Badge className="bg-verified text-verified-foreground gap-1 font-semibold">
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
                    <button
                      onClick={() => setLiked(!liked)}
                      className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${liked ? "bg-destructive/10 border-destructive/30" : "border-border hover:bg-secondary"}`}
                    >
                      <Heart className={`w-4 h-4 ${liked ? "fill-destructive text-destructive" : ""}`} />
                    </button>
                    <button className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors">
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center gap-1.5 bg-verified/10 px-3 py-1.5 rounded-lg">
                    <Star className="w-4 h-4 fill-verified text-verified" />
                    <span className="font-heading font-bold text-sm">{listing.rating}</span>
                    <span className="text-muted-foreground text-xs">({listing.reviewCount} reviews)</span>
                  </div>
                </div>
              </motion.div>

              <Separator />

              <div>
                <h2 className="font-heading font-semibold text-lg mb-3">About this place</h2>
                <p className="text-muted-foreground leading-relaxed">{listing.description}</p>
              </div>

              <div>
                <h2 className="font-heading font-semibold text-lg mb-3">Highlights</h2>
                <div className="flex flex-wrap gap-2">
                  {listing.highlights.map((h) => (
                    <Badge key={h} variant="secondary" className="py-2 px-4 rounded-xl text-sm">{h}</Badge>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <h2 className="font-heading font-semibold text-lg mb-4">Amenities</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {listing.amenities.map((a) => (
                    <div key={a} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border/50">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        {amenityIconMap[a] || <Home className="w-5 h-5" />}
                      </div>
                      <span className="text-sm font-medium">{a}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Reviews */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-heading font-semibold text-lg">Reviews</h2>
                  <Link to={`/listing/${listing.id}/reviews`}>
                    <Button variant="ghost" size="sm" className="text-primary">See all reviews</Button>
                  </Link>
                </div>

                <div className="bg-secondary/30 rounded-2xl p-6 mb-6 flex items-center gap-8">
                  <div className="text-center">
                    <p className="font-heading font-extrabold text-4xl text-primary">{listing.rating}</p>
                    <div className="flex gap-0.5 mt-1 justify-center">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`w-4 h-4 ${s <= Math.floor(listing.rating) ? "fill-verified text-verified" : "text-border"}`} />
                      ))}
                    </div>
                    <p className="text-muted-foreground text-xs mt-1">{listing.reviewCount} reviews</p>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const pct = star === 5 ? 72 : star === 4 ? 20 : star === 3 ? 5 : 2;
                      return (
                        <div key={star} className="flex items-center gap-2 text-xs">
                          <span className="w-3 text-muted-foreground">{star}</span>
                          <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                            <div className="h-full bg-verified rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="w-8 text-muted-foreground text-right">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                  {mockReviews.slice(0, 2).map((review) => (
                    <div key={review.name} className="p-4 rounded-xl border border-border/50 bg-card">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-heading font-bold text-primary text-sm">{review.avatar}</div>
                        <div className="flex-1">
                          <p className="font-heading font-semibold text-sm">{review.name}</p>
                          <p className="text-muted-foreground text-xs">{review.date}</p>
                        </div>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? "fill-verified text-verified" : "text-border"}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Booking Sidebar */}
            <div>
              <div className="sticky top-28 space-y-4">
                <div className="bg-card rounded-2xl shadow-card-hover p-6 border border-border/50">
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="font-heading font-extrabold text-3xl text-primary">₹{listing.price.toLocaleString()}</span>
                    <span className="text-muted-foreground text-sm">/ month</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">Occupancy: {listing.occupancy}</p>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between text-sm p-3 rounded-xl bg-secondary/50">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" /> Available from
                      </span>
                      <span className="font-semibold">{listing.availableFrom}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm p-3 rounded-xl bg-secondary/50">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <IndianRupee className="w-4 h-4 text-primary" /> Security Deposit
                      </span>
                      <span className="font-semibold">₹{listing.deposit.toLocaleString()}</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => navigate(`/booking/${listing.id}`)}
                    variant="hero"
                    size="lg"
                    className="w-full"
                  >
                    Request Booking
                  </Button>

                  <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
                    <Shield className="w-3.5 h-3.5 text-accent" />
                    <span>Secure booking · No charges yet</span>
                  </div>
                </div>

                <div className="bg-card rounded-2xl p-5 border border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="font-heading font-semibold text-sm">{listing.ownerName}</p>
                      <p className="text-xs text-muted-foreground">Property Owner · Responds within 2h</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-4 rounded-xl">Contact Owner</Button>
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
