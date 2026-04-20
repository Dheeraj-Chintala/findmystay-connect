import { useState, useEffect } from "react";
import { Star, MessageSquare, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { toast } from "sonner";

const UserReviews = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [selectedHostel, setSelectedHostel] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (user) {
      fetchReviews();
      fetchBookings();
    }
  }, [user]);

  const fetchReviews = async () => {
    const { data, error } = await supabase
      .from("reviews")
      .select("*, hostels(hostel_name)")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    if (error) { toast.error(error.message); setLoading(false); return; }
    setReviews(data || []);
    setLoading(false);
  };

  const fetchBookings = async () => {
    const { data, error } = await supabase
      .from("bookings")
      .select("hostel_id, hostels(hostel_name)")
      .eq("user_id", user!.id)
      .in("status", ["approved", "completed", "checked_in"] as any);
    if (error) { toast.error(error.message); return; }
    setBookings(data || []);
  };

  const reviewedHostelIds = new Set(reviews.map(r => r.hostel_id));
  const eligibleHostels = bookings
    .filter(b => !reviewedHostelIds.has(b.hostel_id))
    .reduce((acc, b) => {
      if (!acc.find((h: any) => h.id === b.hostel_id)) {
        acc.push({ id: b.hostel_id, name: (b.hostels as any)?.hostel_name || "Unknown" });
      }
      return acc;
    }, [] as { id: string; name: string }[]);

  const handleSubmit = async () => {
    if (!selectedHostel || !rating) {
      toast.error("Please select a hostel and rating.");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("reviews").upsert({
        user_id: user!.id,
        hostel_id: selectedHostel,
        rating,
        comment: comment.trim() || null,
      }, { onConflict: "user_id,hostel_id" });
      if (error) throw error;
      toast.success("Review submitted!");
      setShowForm(false);
      setSelectedHostel("");
      setRating(5);
      setComment("");
      fetchReviews();
      fetchBookings();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-xl mb-1 flex items-center gap-2">
            <Star className="w-5 h-5 text-verified" /> My Reviews
          </h2>
          <p className="text-muted-foreground text-sm">{reviews.length} reviews submitted</p>
        </div>
        {eligibleHostels.length > 0 && (
          <Button size="sm" className="gap-1.5 rounded-xl" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4" /> Write Review
          </Button>
        )}
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border/50">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">No reviews submitted yet</p>
          {eligibleHostels.length > 0 && (
            <Button size="sm" variant="outline" className="gap-1.5 rounded-xl" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4" /> Write your first review
            </Button>
          )}
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

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Write a Review</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs">Select Hostel *</Label>
              <Select value={selectedHostel} onValueChange={setSelectedHostel}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Choose a hostel you stayed at" />
                </SelectTrigger>
                <SelectContent>
                  {eligibleHostels.map(h => (
                    <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Rating *</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(v => (
                  <button key={v} type="button" onClick={() => setRating(v)}>
                    <Star className={`w-6 h-6 transition-colors ${v <= rating ? "fill-verified text-verified" : "text-border hover:text-muted-foreground"}`} />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Comment (optional)</Label>
              <Textarea
                placeholder="Share your experience..."
                value={comment}
                onChange={e => setComment(e.target.value)}
                className="rounded-xl min-h-[80px] resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button disabled={submitting || !selectedHostel} onClick={handleSubmit}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Star className="w-4 h-4 mr-1" />}
              Submit Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserReviews;
