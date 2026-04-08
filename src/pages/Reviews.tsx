import { useParams, Link } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { ArrowLeft, Star, ThumbsUp, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface ReviewRow {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  helpful_count: number | null;
  user_id: string;
}

const Reviews = () => {
  const { id } = useParams();
  const [hostelName, setHostelName] = useState("");
  const [avgRating, setAvgRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      const { data: hostel, error: hErr } = await supabase
        .from("hostels")
        .select("hostel_name, rating, review_count")
        .eq("id", id)
        .maybeSingle();

      if (hErr || !hostel) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setHostelName(hostel.hostel_name);
      setAvgRating(typeof hostel.rating === "number" ? hostel.rating : 0);
      setReviewCount(hostel.review_count ?? 0);

      const { data: revs } = await supabase
        .from("reviews")
        .select("id, rating, comment, created_at, helpful_count, user_id")
        .eq("hostel_id", id)
        .order("created_at", { ascending: false });

      setReviews((revs || []) as ReviewRow[]);
      setLoading(false);
    };
    load();
  }, [id]);

  const starBuckets = useMemo(() => {
    const b = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const s = Math.min(5, Math.max(1, Math.round(r.rating))) as keyof typeof b;
      b[s]++;
    });
    const total = reviews.length || 1;
    return ([5, 4, 3, 2, 1] as const).map((star) => ({
      star,
      pct: Math.round((b[star] / total) * 100),
    }));
  }, [reviews]);

  if (notFound && !loading) {
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
          {loading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <Link to={`/listing/${id}`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm">
                <ArrowLeft className="w-4 h-4" /> Back to {hostelName}
              </Link>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="font-heading font-bold text-2xl mb-2">Reviews for {hostelName}</h1>

                <div className="bg-secondary/30 rounded-2xl p-6 mb-8 flex items-center gap-8">
                  <div className="text-center">
                    <p className="font-heading font-extrabold text-5xl text-primary">
                      {avgRating > 0 ? avgRating.toFixed(1) : "—"}
                    </p>
                    <div className="flex gap-0.5 mt-2 justify-center">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-4 h-4 ${s <= Math.floor(avgRating) ? "fill-verified text-verified" : "text-border"}`}
                        />
                      ))}
                    </div>
                    <p className="text-muted-foreground text-sm mt-1">{reviewCount} reviews</p>
                  </div>
                  <div className="flex-1 space-y-2">
                    {starBuckets.map(({ star, pct }) => (
                      <div key={star} className="flex items-center gap-3 text-sm">
                        <span className="w-3 text-muted-foreground font-medium">{star}</span>
                        <Star className="w-3.5 h-3.5 fill-verified text-verified" />
                        <div className="flex-1 h-2.5 bg-border rounded-full overflow-hidden">
                          <div className="h-full bg-verified rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-10 text-muted-foreground text-right text-xs">{pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  {reviews.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-8">No reviews yet.</p>
                  ) : (
                    reviews.map((review, i) => (
                      <motion.div
                        key={review.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="p-5 rounded-2xl border border-border/50 bg-card"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center font-heading font-bold text-primary text-sm">
                            {review.user_id.replace(/-/g, "").slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <p className="font-heading font-semibold text-sm">Verified resident</p>
                            <p className="text-muted-foreground text-xs">
                              {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                            </p>
                          </div>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3.5 h-3.5 ${s <= review.rating ? "fill-verified text-verified" : "text-border"}`}
                              />
                            ))}
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-muted-foreground leading-relaxed mb-3">{review.comment}</p>
                        )}
                        {typeof review.helpful_count === "number" && review.helpful_count > 0 && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <ThumbsUp className="w-3.5 h-3.5" />
                            Helpful ({review.helpful_count})
                          </div>
                        )}
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Reviews;
