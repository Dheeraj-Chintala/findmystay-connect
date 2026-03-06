import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Star, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { listings } from "@/data/mockListings";
import { motion } from "framer-motion";

const allReviews = [
  { name: "Arjun S.", rating: 5, date: "2 weeks ago", comment: "Excellent place! Clean rooms, great food, and very helpful staff. Highly recommended for students. The WiFi speed is amazing and the location is very convenient.", avatar: "A", helpful: 12 },
  { name: "Priya M.", rating: 4, date: "1 month ago", comment: "Good location and amenities. WiFi could be better during peak hours, but overall a great stay. The food quality is consistently good.", avatar: "P", helpful: 8 },
  { name: "Rohit K.", rating: 5, date: "2 months ago", comment: "Best PG I've stayed in. The community vibe is amazing and the facilities are top-notch. Maintenance team is responsive.", avatar: "R", helpful: 15 },
  { name: "Sneha T.", rating: 4, date: "3 months ago", comment: "Clean and well-maintained rooms. The staff is friendly and accommodating. Would recommend to anyone looking for accommodation in this area.", avatar: "S", helpful: 6 },
  { name: "Karan P.", rating: 5, date: "3 months ago", comment: "Moved in last quarter and couldn't be happier. The gym is well-equipped, parking is ample, and the overall vibe is professional yet friendly.", avatar: "K", helpful: 10 },
  { name: "Divya R.", rating: 3, date: "4 months ago", comment: "Decent place for the price. Some rooms need renovation but the management is working on it. Food could use more variety.", avatar: "D", helpful: 4 },
];

const Reviews = () => {
  const { id } = useParams();
  const listing = listings.find((l) => l.id === id);

  if (!listing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p>Property not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 lg:pt-24">
        <div className="container mx-auto px-4 lg:px-8 py-8 max-w-3xl">
          <Link to={`/listing/${listing.id}`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to {listing.title}
          </Link>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-heading font-bold text-2xl mb-2">Reviews for {listing.title}</h1>

            {/* Summary */}
            <div className="bg-secondary/30 rounded-2xl p-6 mb-8 flex items-center gap-8">
              <div className="text-center">
                <p className="font-heading font-extrabold text-5xl text-primary">{listing.rating}</p>
                <div className="flex gap-0.5 mt-2 justify-center">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`w-4 h-4 ${s <= Math.floor(listing.rating) ? "fill-verified text-verified" : "text-border"}`} />
                  ))}
                </div>
                <p className="text-muted-foreground text-sm mt-1">{listing.reviewCount} reviews</p>
              </div>
              <div className="flex-1 space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const pct = star === 5 ? 72 : star === 4 ? 20 : star === 3 ? 5 : star === 2 ? 2 : 1;
                  return (
                    <div key={star} className="flex items-center gap-3 text-sm">
                      <span className="w-3 text-muted-foreground font-medium">{star}</span>
                      <Star className="w-3.5 h-3.5 fill-verified text-verified" />
                      <div className="flex-1 h-2.5 bg-border rounded-full overflow-hidden">
                        <div className="h-full bg-verified rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-10 text-muted-foreground text-right text-xs">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Review list */}
            <div className="space-y-4">
              {allReviews.map((review, i) => (
                <motion.div
                  key={review.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-5 rounded-2xl border border-border/50 bg-card"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center font-heading font-bold text-primary">{review.avatar}</div>
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
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">{review.comment}</p>
                  <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <ThumbsUp className="w-3.5 h-3.5" />
                    Helpful ({review.helpful})
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Reviews;
