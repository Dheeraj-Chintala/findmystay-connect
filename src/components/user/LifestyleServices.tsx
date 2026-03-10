import { useState, useEffect } from "react";
import { ExternalLink, Zap, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/sonner";
import { motion } from "framer-motion";

interface ServiceItem {
  name: string;
  url: string;
  category: string;
  points: number;
  emoji: string;
}

const services: ServiceItem[] = [
  { name: "Swiggy", url: "https://www.swiggy.com", category: "Food", points: 5, emoji: "🍕" },
  { name: "Zomato", url: "https://www.zomato.com", category: "Food", points: 5, emoji: "🍔" },
  { name: "Rapido", url: "https://rapido.bike", category: "Transportation", points: 6, emoji: "🏍️" },
  { name: "Ola", url: "https://www.olacabs.com", category: "Transportation", points: 6, emoji: "🚕" },
  { name: "AbhiBus", url: "https://www.abhibus.com", category: "Travel", points: 8, emoji: "🚌" },
  { name: "RedBus", url: "https://www.redbus.in", category: "Travel", points: 8, emoji: "🚎" },
  { name: "BookMyShow", url: "https://in.bookmyshow.com", category: "Entertainment", points: 5, emoji: "🎬" },
  { name: "Zepto", url: "https://www.zeptonow.com", category: "Groceries", points: 6, emoji: "🛒" },
  { name: "Blinkit", url: "https://blinkit.com", category: "Groceries", points: 6, emoji: "⚡" },
  { name: "Nykaa", url: "https://www.nykaa.com", category: "Cosmetics", points: 4, emoji: "💄" },
];

const levels = [
  { name: "Bronze Explorer", min: 0, max: 200, color: "text-amber-600" },
  { name: "Silver Voyager", min: 200, max: 500, color: "text-slate-400" },
  { name: "Gold Adventurer", min: 500, max: 1000, color: "text-yellow-500" },
  { name: "Platinum Elite", min: 1000, max: Infinity, color: "text-cyan-400" },
];

const LifestyleServices = () => {
  const { user } = useAuth();
  const [activityScore, setActivityScore] = useState(0);
  const [todayPoints, setTodayPoints] = useState(0);

  useEffect(() => {
    if (user) fetchScore();
  }, [user]);

  const fetchScore = async () => {
    // Total score
    const { data } = await supabase
      .from("lifestyle_clicks")
      .select("points_awarded")
      .eq("user_id", user!.id);

    const total = (data || []).reduce((sum, r) => sum + r.points_awarded, 0);
    setActivityScore(total);

    // Today's points
    const today = new Date().toISOString().split("T")[0];
    const todayData = (data || []).filter((r: any) => r.created_at?.startsWith(today));
    setTodayPoints(todayData.reduce((sum, r) => sum + r.points_awarded, 0));
  };

  const handleServiceClick = async (service: ServiceItem) => {
    if (!user) {
      window.open(service.url, "_blank");
      return;
    }

    // Check daily limit (100 points max)
    if (todayPoints >= 100) {
      toast.info("Daily points limit reached (100/day). You can still use services!");
      window.open(service.url, "_blank");
      return;
    }

    const pointsToAward = Math.min(service.points, 100 - todayPoints);

    // Log click & award points
    await supabase.from("lifestyle_clicks").insert({
      user_id: user.id,
      service_name: service.name,
      redirect_url: service.url,
      points_awarded: pointsToAward,
    });

    // Update wallet
    const { data: w } = await supabase
      .from("user_wallet")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (w) {
      const newPoints = w.reward_points + pointsToAward;
      await supabase.from("user_wallet").update({
        reward_points: newPoints,
        cash_value: newPoints / 10,
        updated_at: new Date().toISOString(),
      }).eq("user_id", user.id);
    } else {
      await supabase.from("user_wallet").insert({
        user_id: user.id,
        reward_points: pointsToAward,
        cash_value: pointsToAward / 10,
      });
    }

    setActivityScore((s) => s + pointsToAward);
    setTodayPoints((t) => t + pointsToAward);

    if (pointsToAward > 0) {
      toast.success(`+${pointsToAward} pts earned!`, { duration: 1500 });
    }

    window.open(service.url, "_blank");
  };

  const currentLevel = levels.find((l) => activityScore >= l.min && activityScore < l.max) || levels[0];
  const nextLevel = levels[levels.indexOf(currentLevel) + 1];
  const progress = nextLevel
    ? ((activityScore - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100
    : 100;

  return (
    <div className="space-y-4">
      {/* Activity Score Badge */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl border border-border/50 shadow-card p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-accent" />
            <h4 className="font-heading font-semibold text-sm">Activity Score</h4>
          </div>
          <Badge className="bg-accent/10 text-accent border-accent/30 text-[10px] gap-1">
            <Award className="w-3 h-3" />
            {currentLevel.name}
          </Badge>
        </div>
        <div className="flex items-end gap-2 mb-2">
          <span className="font-heading font-extrabold text-2xl text-primary">{activityScore}</span>
          <span className="text-muted-foreground text-xs mb-1">points</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2 mb-1">
          <motion.div
            className="bg-gradient-to-r from-primary to-accent h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progress, 100)}%` }}
            transition={{ duration: 0.8 }}
          />
        </div>
        {nextLevel && (
          <p className="text-muted-foreground text-[10px]">
            {nextLevel.min - activityScore} pts to {nextLevel.name}
          </p>
        )}
      </motion.div>

      {/* Service Grid */}
      <div>
        <h3 className="font-heading font-semibold text-lg flex items-center gap-2 mb-4">
          <ExternalLink className="w-4 h-4 text-primary" /> Lifestyle Services
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {services.map((service, i) => (
            <motion.button
              key={service.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ scale: 1.06, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleServiceClick(service)}
              className="bg-card rounded-2xl border border-border/50 shadow-card hover:shadow-card-hover p-4 flex flex-col items-center gap-2 transition-all group cursor-pointer"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">{service.emoji}</span>
              <span className="text-xs font-medium text-foreground truncate w-full text-center">{service.name}</span>
              <Badge variant="secondary" className="text-[9px] px-1.5 py-0">+{service.points} pts</Badge>
            </motion.button>
          ))}
        </div>
        <p className="text-muted-foreground text-[10px] mt-2 text-center">
          Max 100 points/day from lifestyle services • Today: {todayPoints}/100
        </p>
      </div>
    </div>
  );
};

export default LifestyleServices;
