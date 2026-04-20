import { useState, useEffect } from "react";
import { Copy, Share2, Gift, Users, Wallet, Trophy, CheckCircle, ArrowDownToLine, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/sonner";
import { motion } from "framer-motion";

const ReferAndEarn = () => {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState("");
  const [wallet, setWallet] = useState({ reward_points: 0, cash_value: 0 });
  const [referrals, setReferrals] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({
    accountHolder: "", bankName: "", accountNumber: "", ifscCode: "", upiId: "", amount: "",
  });

  useEffect(() => {
    if (user) initReferral();
  }, [user]);

  const initReferral = async () => {
    // Generate or fetch referral code
    const code = `SN${user!.id.replace(/-/g, "").slice(0, 10).toUpperCase()}`;
    setReferralCode(code);

    // Ensure referral row exists
    const { data: existing } = await supabase
      .from("referrals")
      .select("*")
      .eq("referrer_user_id", user!.id)
      .eq("referral_code", code)
      .maybeSingle();

    if (!existing) {
      const { error: insertError } = await supabase.from("referrals").insert({
        referrer_user_id: user!.id,
        referral_code: code,
        reward_points: 0,
        status: "active",
      });
      if (insertError && insertError.code !== "23505") {
        toast.error(insertError.message || "Failed to initialize referral code");
      }
    }

    // Fetch all referrals
    const { data: refs } = await supabase
      .from("referrals")
      .select("*")
      .eq("referrer_user_id", user!.id)
      .order("created_at", { ascending: false });

    setReferrals(refs || []);

    // Fetch or create wallet
    const { data: w } = await supabase
      .from("user_wallet")
      .select("*")
      .eq("user_id", user!.id)
      .maybeSingle();

    if (w) {
      setWallet(w);
    } else {
      await supabase.from("user_wallet").insert({
        user_id: user!.id,
        reward_points: 0,
        cash_value: 0,
      });
    }
    setLoading(false);
  };

  const referralLink = `https://staynest.app/signup?ref=${referralCode}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareVia = (platform: string) => {
    const msg = encodeURIComponent(`Join StayNest and find your perfect hostel! Use my referral link: ${referralLink}`);
    const urls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${msg}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${msg}`,
      email: `mailto:?subject=Join StayNest&body=${msg}`,
    };
    window.open(urls[platform], "_blank");
  };

  const stats = [
    { label: "Total Invites", value: referrals.length, icon: Users, color: "text-primary" },
    { label: "Points Earned", value: wallet.reward_points, icon: Trophy, color: "text-accent" },
    { label: "Wallet Balance", value: `₹${Number(wallet.cash_value).toFixed(0)}`, icon: Wallet, color: "text-verified" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-primary via-primary/90 to-accent rounded-2xl p-6 text-primary-foreground relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-foreground/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary-foreground/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Gift className="w-5 h-5" />
            <h3 className="font-heading font-bold text-lg">Refer & Earn</h3>
          </div>
          <p className="text-sm opacity-80 mb-4">Invite friends & earn rewards. 100 points = ₹10!</p>

          {/* Referral Code */}
          <div className="bg-primary-foreground/15 backdrop-blur-sm rounded-xl p-3 flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] uppercase tracking-wider opacity-60">Your Referral Code</p>
              <p className="font-heading font-extrabold text-lg tracking-wider">{referralCode}</p>
            </div>
            <Button
              size="sm"
              variant="hero-outline"
              className="gap-1.5 text-xs"
              onClick={copyLink}
            >
              {copied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy Link"}
            </Button>
          </div>

          {/* Share Buttons */}
          <div className="flex gap-2">
            <Button size="sm" variant="hero-outline" className="text-xs flex-1" onClick={() => shareVia("whatsapp")}>
              WhatsApp
            </Button>
            <Button size="sm" variant="hero-outline" className="text-xs flex-1" onClick={() => shareVia("telegram")}>
              Telegram
            </Button>
            <Button size="sm" variant="hero-outline" className="text-xs flex-1" onClick={() => shareVia("email")}>
              Email
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-card rounded-2xl p-4 border border-border/50 shadow-card text-center"
          >
            <stat.icon className={`w-5 h-5 mx-auto mb-2 ${stat.color}`} />
            <p className="font-heading font-extrabold text-xl">{stat.value}</p>
            <p className="text-muted-foreground text-[11px]">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Withdraw Button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          className="gap-2 rounded-xl"
          disabled={Number(wallet.cash_value) < 100}
          onClick={() => setShowWithdraw(true)}
        >
          <ArrowDownToLine className="w-4 h-4" />
          {Number(wallet.cash_value) < 100 ? `Withdraw (min ₹100)` : "Withdraw"}
        </Button>
      </div>

      {/* Reward Tiers */}
      <div className="bg-card rounded-2xl border border-border/50 shadow-card p-4">
        <h4 className="font-heading font-semibold text-sm mb-3 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-accent" /> Reward Tiers
        </h4>
        <div className="space-y-2 text-xs">
          {[
            { action: "Friend joins StayNest", points: "+50 pts" },
            { action: "Referred user books hostel", points: "+200 pts" },
            { action: "Owner registers via referral", points: "+500 pts" },
          ].map((tier) => (
            <div key={tier.action} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
              <span className="text-muted-foreground">{tier.action}</span>
              <Badge className="bg-accent/10 text-accent border-accent/30 text-[10px]">{tier.points}</Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Referral History */}
      {referrals.length > 1 && (
        <div className="bg-card rounded-2xl border border-border/50 shadow-card p-4">
          <h4 className="font-heading font-semibold text-sm mb-3">Referral History</h4>
          <div className="space-y-2 text-xs">
            {referrals.slice(0, 10).map((ref) => (
              <div key={ref.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                <span className="text-muted-foreground">{ref.referral_code}</span>
                <div className="flex items-center gap-2">
                  <Badge variant={ref.status === "active" ? "default" : "secondary"} className="text-[10px]">
                    {ref.status}
                  </Badge>
                  <span className="font-heading font-semibold text-primary">+{ref.reward_points}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={showWithdraw} onOpenChange={setShowWithdraw}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Withdraw Funds</DialogTitle>
            <DialogDescription>
              Available balance: <strong>₹{Number(wallet.cash_value).toFixed(0)}</strong>. Fill in your bank details below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs">Account Holder Name *</Label>
              <Input className="rounded-xl" value={withdrawForm.accountHolder} onChange={e => setWithdrawForm({ ...withdrawForm, accountHolder: e.target.value })} placeholder="Full name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Bank Name *</Label>
                <Input className="rounded-xl" value={withdrawForm.bankName} onChange={e => setWithdrawForm({ ...withdrawForm, bankName: e.target.value })} placeholder="Bank name" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">IFSC Code *</Label>
                <Input className="rounded-xl" value={withdrawForm.ifscCode} onChange={e => setWithdrawForm({ ...withdrawForm, ifscCode: e.target.value })} placeholder="IFSC code" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Account Number *</Label>
              <Input className="rounded-xl" value={withdrawForm.accountNumber} onChange={e => setWithdrawForm({ ...withdrawForm, accountNumber: e.target.value })} placeholder="Account number" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">UPI ID (optional)</Label>
              <Input className="rounded-xl" value={withdrawForm.upiId} onChange={e => setWithdrawForm({ ...withdrawForm, upiId: e.target.value })} placeholder="name@upi" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Amount to Withdraw *</Label>
              <Input className="rounded-xl" type="number" min={100} max={wallet.cash_value} value={withdrawForm.amount} onChange={e => setWithdrawForm({ ...withdrawForm, amount: e.target.value })} placeholder={`Max ₹${Number(wallet.cash_value).toFixed(0)}`} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWithdraw(false)}>Cancel</Button>
            <Button
              disabled={!withdrawForm.accountHolder || !withdrawForm.bankName || !withdrawForm.accountNumber || !withdrawForm.ifscCode || !withdrawForm.amount || Number(withdrawForm.amount) < 100 || Number(withdrawForm.amount) > wallet.cash_value}
              onClick={async () => {
                const { error } = await supabase.from("withdrawal_requests").insert({
                  user_id: user!.id,
                  amount: Number(withdrawForm.amount),
                  payment_method: withdrawForm.upiId ? "upi" : "bank_transfer",
                  payment_details: {
                    account_holder: withdrawForm.accountHolder,
                    bank_name: withdrawForm.bankName,
                    account_number: withdrawForm.accountNumber,
                    ifsc_code: withdrawForm.ifscCode,
                    upi_id: withdrawForm.upiId || undefined,
                  },
                });
                if (error) {
                  toast.error(error.message || "Failed to submit withdrawal request");
                  return;
                }
                toast.success("Withdrawal request submitted! Your funds will be transferred within 3-5 business days.");
                setShowWithdraw(false);
                setWithdrawForm({ accountHolder: "", bankName: "", accountNumber: "", ifscCode: "", upiId: "", amount: "" });
              }}
            >
              <ArrowDownToLine className="w-4 h-4 mr-1" /> Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReferAndEarn;
