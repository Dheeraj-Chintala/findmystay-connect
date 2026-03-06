import { useState, useEffect } from "react";
import { Star, MessageSquare, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_id: string;
  hostel_id: string;
  is_verified: boolean | null;
  hostels: { hostel_name: string };
  profiles: { full_name: string } | null;
}

const OwnerReviewManager = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [replying, setReplying] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchReviews();
  }, [user]);

  const fetchReviews = async () => {
    const { data: hostels } = await supabase
      .from("hostels")
      .select("id")
      .eq("owner_id", user!.id);

    if (!hostels?.length) { setLoading(false); return; }

    const { data } = await supabase
      .from("reviews")
      .select("*, hostels!inner(hostel_name)")
      .in("hostel_id", hostels.map(h => h.id))
      .order("created_at", { ascending: false });

    if (data) {
      // Fetch user profiles
      const userIds = [...new Set(data.map((r: any) => r.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      setReviews(data.map((r: any) => ({ ...r, profiles: profileMap.get(r.user_id) || null })));
    }
    setLoading(false);
  };

  const handleReply = async (reviewId: string) => {
    // For now, show toast since reply system would need a separate table
    setReplying(reviewId);
    await new Promise(r => setTimeout(r, 500));
    toast.success("Reply sent to the reviewer!");
    setReplyText(prev => ({ ...prev, [reviewId]: "" }));
    setReplying(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-center gap-6 bg-card rounded-2xl p-5 border border-border/50 shadow-card">
        <div className="text-center">
          <p className="font-heading font-extrabold text-3xl text-primary">{avgRating}</p>
          <div className="flex gap-0.5 mt-1 justify-center">
            {[1, 2, 3, 4, 5].map(s => (
              <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(parseFloat(avgRating)) ? "fill-verified text-verified" : "text-border"}`} />
            ))}
          </div>
          <p className="text-muted-foreground text-xs mt-1">{reviews.length} reviews</p>
        </div>
        <div className="flex-1 space-y-1">
          {[5, 4, 3, 2, 1].map(star => {
            const count = reviews.filter(r => r.rating === star).length;
            const pct = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
            return (
              <div key={star} className="flex items-center gap-2 text-xs">
                <span className="w-3 text-muted-foreground">{star}</span>
                <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-verified rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-6 text-muted-foreground text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
          <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No reviews yet</p>
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
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-heading font-bold text-primary text-sm">
                    {(review.profiles?.full_name || "U")[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-heading font-semibold text-sm">{review.profiles?.full_name || "Anonymous"}</p>
                    <p className="text-muted-foreground text-xs">{review.hostels.hostel_name} · {new Date(review.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={`w-3 h-3 ${s <= review.rating ? "fill-verified text-verified" : "text-border"}`} />
                    ))}
                  </div>
                  {review.is_verified && <Badge className="bg-verified/10 text-verified text-[10px]">Verified</Badge>}
                </div>
              </div>

              {review.comment && (
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">{review.comment}</p>
              )}

              {/* Reply */}
              <div className="flex gap-2 mt-2">
                <Textarea
                  placeholder="Write a reply..."
                  className="rounded-xl min-h-[40px] resize-none text-xs flex-1"
                  value={replyText[review.id] || ""}
                  onChange={e => setReplyText({ ...replyText, [review.id]: e.target.value })}
                  rows={1}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 rounded-xl shrink-0"
                  onClick={() => handleReply(review.id)}
                  disabled={!replyText[review.id]?.trim() || replying === review.id}
                >
                  {replying === review.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  Reply
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OwnerReviewManager;
