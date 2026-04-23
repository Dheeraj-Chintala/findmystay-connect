import { useParams, Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Star, MapPin, BadgeCheck, Heart, Share2, Shield, Users, Wifi, Wind, UtensilsCrossed, Dumbbell, Car, Zap, Waves, Home, ChevronLeft, ChevronRight, X, Loader2 } from "lucide-react";
import VerificationBadge from "@/components/VerificationBadge";
import PropertyMediaGallery from "@/components/PropertyMediaGallery";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState, useEffect, useRef, useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import BookingPanel from "@/components/listing/BookingPanel";

const amenityIconMap: Record<string, React.ReactNode> = {
  WiFi: <Wifi className="w-5 h-5" />, wifi: <Wifi className="w-5 h-5" />,
  AC: <Wind className="w-5 h-5" />, ac: <Wind className="w-5 h-5" />,
  Food: <UtensilsCrossed className="w-5 h-5" />, food: <UtensilsCrossed className="w-5 h-5" />,
  Gym: <Dumbbell className="w-5 h-5" />, gym: <Dumbbell className="w-5 h-5" />,
  Parking: <Car className="w-5 h-5" />, parking: <Car className="w-5 h-5" />,
  "Power Backup": <Zap className="w-5 h-5" />, power_backup: <Zap className="w-5 h-5" />,
  Pool: <Waves className="w-5 h-5" />, pool: <Waves className="w-5 h-5" />,
  Laundry: <Home className="w-5 h-5" />, laundry: <Home className="w-5 h-5" />,
  CCTV: <Shield className="w-5 h-5" />, cctv: <Shield className="w-5 h-5" />,
  Housekeeping: <Home className="w-5 h-5" />, housekeeping: <Home className="w-5 h-5" />,
  "Common Kitchen": <UtensilsCrossed className="w-5 h-5" />, common_kitchen: <UtensilsCrossed className="w-5 h-5" />,
  "Study Room": <Home className="w-5 h-5" />, study_room: <Home className="w-5 h-5" />,
  geyser: <Waves className="w-5 h-5" />, washing_machine: <Home className="w-5 h-5" />,
};

const amenityLabel: Record<string, string> = {
  wifi: "WiFi", ac: "AC", food: "Food", gym: "Gym", parking: "Parking",
  power_backup: "Power Backup", pool: "Pool", laundry: "Laundry", cctv: "CCTV",
  housekeeping: "Housekeeping", common_kitchen: "Common Kitchen", study_room: "Study Room",
  geyser: "Geyser", washing_machine: "Washing Machine",
};

interface DbHostel {
  id: string;
  hostel_name: string;
  location: string;
  city: string;
  description: string | null;
  price_min: number;
  price_max: number;
  rating: number | null;
  review_count: number | null;
  property_type: string;
  gender: string;
  verified_status: string;
  is_active: boolean;
  media_verification_badge: string | null;
  owner_id: string;
  contact_phone: string | null;
  contact_email: string | null;
}

interface ListingReviewRow {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_id: string;
}

interface DbRoom {
  id: string;
  sharing_type: string;
  price_per_month: number;
  available_beds: number;
  total_beds: number;
}

const ListingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [dbHostel, setDbHostel] = useState<DbHostel | null>(null);
  const [dbRooms, setDbRooms] = useState<DbRoom[]>([]);
  const [dbAmenities, setDbAmenities] = useState<string[]>([]);
  const [dbImages, setDbImages] = useState<string[]>([]);
  const [dbPhotos, setDbPhotos] = useState<{ id: string; url: string; uploaded_by: string; type: "photo" }[]>([]);
  const [dbVideos, setDbVideos] = useState<{ id: string; url: string; uploaded_by: string; type: "video" }[]>([]);
  const [ownerName, setOwnerName] = useState("Property Owner");
  const [loading, setLoading] = useState(true);
  const [listingReviews, setListingReviews] = useState<ListingReviewRow[]>([]);
  const [allReviewRatings, setAllReviewRatings] = useState<number[]>([]);

  const [activeImage, setActiveImage] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [liked, setLiked] = useState(false);
  const [savingLike, setSavingLike] = useState(false);

  const bookingRef = useRef<HTMLDivElement>(null);
  const shouldOpenBooking = searchParams.get("book") === "true";

  useEffect(() => {
    if (!id) return;
    const fetchHostel = async () => {
      setLoading(true);
      const [hostelRes, roomsRes, facilitiesRes, imagesRes, videosRes, reviewsRes] = await Promise.all([
        supabase.from("hostels").select("*").eq("id", id).maybeSingle(),
        supabase.from("rooms").select("*").eq("hostel_id", id),
        supabase.from("facilities").select("*").eq("hostel_id", id).maybeSingle(),
        supabase.from("hostel_images").select("*").eq("hostel_id", id).order("display_order"),
        supabase.from("hostel_videos").select("*").eq("hostel_id", id).order("display_order"),
        supabase
          .from("reviews")
          .select("id, rating, comment, created_at, user_id")
          .eq("hostel_id", id)
          .order("created_at", { ascending: false }),
      ]);

      if (hostelRes.data) {
        setDbHostel(hostelRes.data as any);
        // Fetch owner name
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", hostelRes.data.owner_id)
          .maybeSingle();
        if (profile?.full_name) setOwnerName(profile.full_name);
      }
      setDbRooms((roomsRes.data || []) as DbRoom[]);

      // Parse facilities
      if (facilitiesRes.data) {
        const f = facilitiesRes.data as any;
        const amenities: string[] = [];
        Object.entries(f).forEach(([key, val]) => {
          if (val === true && key !== "id" && key !== "hostel_id") amenities.push(key);
        });
        setDbAmenities(amenities);
      }

      const imgs = (imagesRes.data || []).sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0));
      setDbImages(imgs.map((i: any) => i.image_url));
      setDbPhotos(imgs.map((i: any) => ({ id: i.id, url: i.image_url, uploaded_by: i.uploaded_by || "owner", type: "photo" as const })));
      setDbVideos((videosRes.data || []).map((v: any) => ({ id: v.id, url: v.video_url, uploaded_by: v.uploaded_by || "owner", type: "video" as const })));

      const revs = (reviewsRes.data || []) as ListingReviewRow[];
      setListingReviews(revs.slice(0, 2));
      setAllReviewRatings(revs.map((r) => r.rating));

      setLoading(false);
    };
    fetchHostel();
  }, [id]);

  // Check saved status
  useEffect(() => {
    if (!user || !id) return;
    supabase.from("saved_hostels").select("id").eq("user_id", user.id).eq("hostel_id", id).maybeSingle().then(({ data }) => {
      if (data) setLiked(true);
    });
  }, [user, id]);

  // Auto-scroll to booking panel after login redirect
  useEffect(() => {
    if (shouldOpenBooking && bookingRef.current && !loading) {
      setTimeout(() => bookingRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 500);
    }
  }, [shouldOpenBooking, loading]);

  const handleSaveToggle = async () => {
    if (!user) {
      toast.info("Please sign in to save hostels.");
      navigate(`/login?redirect=/listing/${id}`);
      return;
    }
    if (savingLike) return;
    setSavingLike(true);
    try {
      if (liked) {
        await supabase.from("saved_hostels").delete().eq("user_id", user.id).eq("hostel_id", id!);
        setLiked(false);
        toast.success("Removed from saved hostels");
      } else {
        await supabase.from("saved_hostels").insert({ user_id: user.id, hostel_id: id! });
        setLiked(true);
        toast.success("Hostel saved to your favorites!");
      }
    } catch {
      toast.error("Failed to update saved hostels");
    }
    setSavingLike(false);
  };

  const handleContactOwner = () => {
    const phone = dbHostel?.contact_phone?.trim();
    const email = dbHostel?.contact_email?.trim();
    if (phone) {
      window.location.href = `tel:${phone.replace(/\s/g, "")}`;
      return;
    }
    if (email) {
      window.location.href = `mailto:${email}`;
      return;
    }
    toast.info("Owner has not added contact details yet. You can request a stay below.");
    bookingRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const starHistogram = useMemo(() => {
    const b = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    allReviewRatings.forEach((r) => {
      const s = Math.min(5, Math.max(1, Math.round(r))) as keyof typeof b;
      b[s]++;
    });
    const n = allReviewRatings.length || 1;
    return ([5, 4, 3, 2, 1] as const).map((star) => ({
      star,
      pct: Math.round((b[star] / n) * 100),
    }));
  }, [allReviewRatings]);

  const title = dbHostel?.hostel_name || "";
  const location = dbHostel ? `${dbHostel.location}, ${dbHostel.city}` : "";
  const description = dbHostel?.description || "";
  const price = dbHostel?.price_min || 0;
  const rating = dbHostel?.rating || 0;
  const reviewCount = dbHostel?.review_count || 0;
  const images = dbImages;
  const amenities = dbAmenities;
  const verified = dbHostel?.verified_status === "verified";
  const mediaVerBadge = dbHostel?.media_verification_badge;
  const propertyType = dbHostel?.property_type || "hostel";
  const gender = dbHostel?.gender || "co-ed";
  const ownerDisplay = ownerName;
  const hostelId = id || "";
  const isActive = dbHostel?.is_active ?? false;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!dbHostel) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-xl font-heading font-semibold mb-4">Property not found</p>
          <Link to="/listings"><Button>Back to Listings</Button></Link>
        </div>
      </div>
    );
  }

  const nextImage = () => setActiveImage((prev) => (prev + 1) % images.length);
  const prevImage = () => setActiveImage((prev) => (prev - 1 + images.length) % images.length);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Fullscreen Gallery */}
      <AnimatePresence>
        {galleryOpen && images.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-foreground/95 flex items-center justify-center">
            <button onClick={() => setGalleryOpen(false)} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center text-primary-foreground hover:bg-primary-foreground/20">
              <X className="w-5 h-5" />
            </button>
            <button onClick={prevImage} className="absolute left-6 w-12 h-12 rounded-full bg-primary-foreground/10 flex items-center justify-center text-primary-foreground hover:bg-primary-foreground/20">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <img src={images[activeImage]} alt="" className="max-w-[85vw] max-h-[85vh] object-contain rounded-2xl" />
            <button onClick={nextImage} className="absolute right-6 w-12 h-12 rounded-full bg-primary-foreground/10 flex items-center justify-center text-primary-foreground hover:bg-primary-foreground/20">
              <ChevronRight className="w-6 h-6" />
            </button>
            <div className="absolute bottom-6 flex gap-2">
              {images.map((_, i) => (
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
          {images.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 rounded-2xl overflow-hidden">
                <button onClick={() => { setActiveImage(0); setGalleryOpen(true); }} className="md:col-span-2 md:row-span-2 aspect-[16/10] md:aspect-auto relative group overflow-hidden">
                  <img src={images[0]} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors" />
                </button>
                {images.slice(1, 3).map((img, i) => (
                  <button key={i} onClick={() => { setActiveImage(i + 1); setGalleryOpen(true); }} className="hidden md:block aspect-[4/3] relative group overflow-hidden">
                    <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors" />
                  </button>
                ))}
              </div>
              <div className="flex md:hidden gap-2 mt-3 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button key={i} onClick={() => { setActiveImage(i); setGalleryOpen(true); }} className={`shrink-0 w-20 h-16 rounded-xl overflow-hidden border-2 ${activeImage === i ? "border-primary" : "border-transparent"}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Property Media Gallery (DB media with videos) */}
          {(dbPhotos.length > 0 || dbVideos.length > 0) && (
            <div className="mb-8">
              <PropertyMediaGallery photos={dbPhotos} videos={dbVideos} title={title} />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Details */}
            <div className="lg:col-span-2 space-y-8">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {verified && (
                        <Badge className="bg-verified text-verified-foreground gap-1 font-semibold">
                          <BadgeCheck className="w-3 h-3" /> Verified
                        </Badge>
                      )}
                      {mediaVerBadge && (
                        <VerificationBadge type={mediaVerBadge as any} size="md" />
                      )}
                      <Badge variant="secondary" className="capitalize">{propertyType}</Badge>
                      <Badge variant="secondary" className="capitalize">{gender}</Badge>
                    </div>
                    <h1 className="font-heading font-bold text-2xl md:text-3xl">{title}</h1>
                    <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">{location}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={handleSaveToggle}
                      disabled={savingLike}
                      className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${liked ? "bg-destructive/10 border-destructive/30" : "border-border hover:bg-secondary"}`}
                    >
                      <Heart className={`w-4 h-4 transition-all ${liked ? "fill-destructive text-destructive" : "hover:scale-110"}`} />
                    </button>
                    <button className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors">
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {rating > 0 && (
                  <div className="flex items-center gap-4 mt-4">
                    <div className="flex items-center gap-1.5 bg-verified/10 px-3 py-1.5 rounded-lg">
                      <Star className="w-4 h-4 fill-verified text-verified" />
                      <span className="font-heading font-bold text-sm">{rating}</span>
                      <span className="text-muted-foreground text-xs">({reviewCount} reviews)</span>
                    </div>
                  </div>
                )}
              </motion.div>

              <Separator />

              {description && (
                <div>
                  <h2 className="font-heading font-semibold text-lg mb-3">About this place</h2>
                  <p className="text-muted-foreground leading-relaxed">{description}</p>
                </div>
              )}

              {amenities.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h2 className="font-heading font-semibold text-lg mb-4">Amenities</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {amenities.map((a) => {
                        const label = amenityLabel[a] || a;
                        return (
                          <div key={a} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border/50">
                            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                              {amenityIconMap[a] || <Home className="w-5 h-5" />}
                            </div>
                            <span className="text-sm font-medium capitalize">{label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* Room types for DB hostels */}
              {dbRooms.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h2 className="font-heading font-semibold text-lg mb-4">Available Rooms</h2>
                    <div className="space-y-3">
                      {dbRooms.map(room => (
                        <div key={room.id} className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 border border-border/50">
                          <div>
                            <p className="font-medium text-sm capitalize">{room.sharing_type}</p>
                            <p className="text-xs text-muted-foreground">{room.available_beds} of {room.total_beds} beds available</p>
                          </div>
                          <span className="font-heading font-bold text-primary">₹{room.price_per_month.toLocaleString()}/mo</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <Separator />

              {/* Reviews */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-heading font-semibold text-lg">Reviews</h2>
                  <Link to={`/listing/${id}/reviews`}>
                    <Button variant="ghost" size="sm" className="text-primary">See all reviews</Button>
                  </Link>
                </div>

                <div className="bg-secondary/30 rounded-2xl p-6 mb-6 flex items-center gap-8">
                  <div className="text-center">
                    <p className="font-heading font-extrabold text-4xl text-primary">{rating || "—"}</p>
                    <div className="flex gap-0.5 mt-1 justify-center">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`w-4 h-4 ${s <= Math.floor(rating) ? "fill-verified text-verified" : "text-border"}`} />
                      ))}
                    </div>
                    <p className="text-muted-foreground text-xs mt-1">{reviewCount} reviews</p>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {starHistogram.map(({ star, pct }) => (
                      <div key={star} className="flex items-center gap-2 text-xs">
                        <span className="w-3 text-muted-foreground">{star}</span>
                        <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                          <div className="h-full bg-verified rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-8 text-muted-foreground text-right">{pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  {listingReviews.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No reviews yet.</p>
                  ) : (
                    listingReviews.map((review) => (
                      <div key={review.id} className="p-4 rounded-xl border border-border/50 bg-card">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-heading font-bold text-primary text-sm">
                            {review.user_id.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <p className="font-heading font-semibold text-sm">Verified resident</p>
                            <p className="text-muted-foreground text-xs">
                              {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                            </p>
                          </div>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? "fill-verified text-verified" : "text-border"}`} />
                            ))}
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Booking Sidebar */}
            <div>
              <div className="sticky top-28 space-y-4" ref={bookingRef}>
                <BookingPanel
                  hostelId={hostelId}
                  hostelName={title}
                  priceMin={dbHostel!.price_min}
                  priceMax={dbHostel!.price_max}
                  rooms={dbRooms}
                  isActive={isActive}
                />

                <Button
                  onClick={handleSaveToggle}
                  variant="outline"
                  size="lg"
                  className="w-full gap-2 rounded-xl border-primary/30 hover:bg-primary/5"
                  disabled={savingLike}
                >
                  <Heart className={`w-4 h-4 ${liked ? "fill-destructive text-destructive" : "text-primary"}`} />
                  {liked ? "Saved to Favorites" : "Save Hostel"}
                </Button>

                <div className="bg-card rounded-2xl p-5 border border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="font-heading font-semibold text-sm">{ownerDisplay}</p>
                      <p className="text-xs text-muted-foreground">Property Owner · Responds within 2h</p>
                    </div>
                  </div>
                  <Button type="button" variant="outline" size="sm" className="w-full mt-4 rounded-xl" onClick={handleContactOwner}>
                    Contact Owner
                  </Button>
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
