import { useState, useEffect } from "react";
import { Star, MessageSquare, Loader2, Trash2, Eye, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface ReviewWithDetails {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  is_verified: boolean | null;
  hostel_id: string;
  user_id: string;
  hostels: { hostel_name: string };
  profiles: { full_name: string } | null;
}

const AdminReviewModeration = () => {
  const [reviews, setReviews] = useState<ReviewWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => { fetchReviews(); }, []);

  const fetchReviews = async () => {
    const { data } = await supabase
      .from("reviews")
      .select("*, hostels!inner(hostel_name)")
      .order("created_at", { ascending: false })
      .limit(100);

    if (data) {
      const userIds = [...new Set(data.map((r: any) => r.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      setReviews(data.map((r: any) => ({ ...r, profiles: profileMap.get(r.user_id) || null })));
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    setProcessing(id);
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (error) { toast.error(error.message); setProcessing(null); return; }
    toast.success("Review removed");
    fetchReviews();
    setProcessing(null);
  };

  const toggleVerified = async (id: string, current: boolean | null) => {
    setProcessing(id);
    const { error } = await supabase.from("reviews").update({ is_verified: !current }).eq("id", id);
    if (error) { toast.error(error.message); setProcessing(null); return; }
    toast.success(!current ? "Marked as verified" : "Verification removed");
    fetchReviews();
    setProcessing(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-semibold text-lg flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-verified" /> Review Moderation
        </h2>
        <Badge variant="secondary" className="font-mono">{reviews.length}</Badge>
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
          <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No reviews to moderate</p>
        </div>
      ) : (
        <div className="space-y-2">
          {reviews.map((review, i) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.02 }}
              className="bg-card rounded-xl border border-border/50 p-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-heading font-bold text-primary text-xs shrink-0">
                  {(review.profiles?.full_name || "?")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="font-heading font-semibold text-xs">{review.profiles?.full_name || "Anonymous"}</p>
                    <span className="text-muted-foreground text-[10px]">on {review.hostels.hostel_name}</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className={`w-2.5 h-2.5 ${s <= review.rating ? "fill-verified text-verified" : "text-border"}`} />
                      ))}
                    </div>
                    {review.is_verified && <Badge className="bg-verified/10 text-verified text-[9px]">Verified</Badge>}
                  </div>
                  {review.comment && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{review.comment}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-1">{new Date(review.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => toggleVerified(review.id, review.is_verified)} disabled={processing === review.id}>
                    <CheckCircle2 className={`w-3.5 h-3.5 ${review.is_verified ? "text-verified" : "text-muted-foreground"}`} />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDelete(review.id)} disabled={processing === review.id}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminReviewModeration;
