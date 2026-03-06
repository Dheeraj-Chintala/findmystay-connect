import { useState, useEffect } from "react";
import { Star, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

const UserReviews = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchReviews();
  }, [user]);

  const fetchReviews = async () => {
    const { data } = await supabase
      .from("reviews")
      .select("*, hostels(hostel_name)")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    setReviews(data || []);
    setLoading(false);
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading font-bold text-xl mb-1 flex items-center gap-2">
          <Star className="w-5 h-5 text-verified" /> My Reviews
        </h2>
        <p className="text-muted-foreground text-sm">{reviews.length} reviews submitted</p>
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border/50">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">No reviews submitted yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review, i) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-card rounded-2xl border border-border/50 shadow-card p-5"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-heading font-semibold text-sm">
                  {(review.hostels as any)?.hostel_name || "Unknown"}
                </h4>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star key={idx} className={`w-3 h-3 ${idx < review.rating ? "text-verified fill-verified" : "text-muted-foreground"}`} />
                  ))}
                </div>
              </div>
              {review.comment && <p className="text-sm text-foreground/80">{review.comment}</p>}
              <p className="text-[10px] text-muted-foreground mt-2">{new Date(review.created_at).toLocaleDateString()}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserReviews;
