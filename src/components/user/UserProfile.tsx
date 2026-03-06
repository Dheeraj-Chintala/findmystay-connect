import { useState, useEffect } from "react";
import { User, Mail, Phone, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const UserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState({ full_name: "", email: "", phone: "" });
  const [preferences, setPreferences] = useState({ preferred_city: "", preferred_gender: "", budget_min: "", budget_max: "", preferred_sharing: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    const [profileRes, prefsRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user!.id).single(),
      supabase.from("user_preferences").select("*").eq("user_id", user!.id).maybeSingle(),
    ]);
    if (profileRes.data) {
      setProfile({ full_name: profileRes.data.full_name || "", email: profileRes.data.email || "", phone: profileRes.data.phone || "" });
    }
    if (prefsRes.data) {
      setPreferences({
        preferred_city: prefsRes.data.preferred_city || "",
        preferred_gender: prefsRes.data.preferred_gender || "",
        budget_min: prefsRes.data.budget_min?.toString() || "",
        budget_max: prefsRes.data.budget_max?.toString() || "",
        preferred_sharing: prefsRes.data.preferred_sharing || "",
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await supabase.from("profiles").update({ full_name: profile.full_name, phone: profile.phone }).eq("user_id", user!.id);
    await supabase.from("user_preferences").upsert({
      user_id: user!.id,
      preferred_city: preferences.preferred_city || null,
      preferred_gender: preferences.preferred_gender || null,
      budget_min: preferences.budget_min ? parseInt(preferences.budget_min) : null,
      budget_max: preferences.budget_max ? parseInt(preferences.budget_max) : null,
      preferred_sharing: preferences.preferred_sharing || null,
    }, { onConflict: "user_id" });
    setSaving(false);
    toast.success("Profile updated!");
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="font-heading font-bold text-xl mb-1 flex items-center gap-2">
          <User className="w-5 h-5 text-primary" /> My Profile
        </h2>
        <p className="text-muted-foreground text-sm">Manage your personal info & preferences</p>
      </div>

      {/* Personal Info */}
      <div className="bg-card rounded-2xl border border-border/50 shadow-card p-5 space-y-4">
        <h3 className="font-heading font-semibold text-sm">Personal Information</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs">Full Name</Label>
            <Input value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Email</Label>
            <Input value={profile.email} disabled className="rounded-xl bg-secondary/50" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Phone</Label>
            <Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="rounded-xl" placeholder="+91..." />
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-card rounded-2xl border border-border/50 shadow-card p-5 space-y-4">
        <h3 className="font-heading font-semibold text-sm">Preferences</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs">Preferred City</Label>
            <Input value={preferences.preferred_city} onChange={(e) => setPreferences({ ...preferences, preferred_city: e.target.value })} className="rounded-xl" placeholder="e.g. Bangalore" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Gender Preference</Label>
            <Select value={preferences.preferred_gender} onValueChange={(v) => setPreferences({ ...preferences, preferred_gender: v })}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Any" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="co-ed">Co-ed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Min Budget (₹/month)</Label>
            <Input type="number" value={preferences.budget_min} onChange={(e) => setPreferences({ ...preferences, budget_min: e.target.value })} className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Max Budget (₹/month)</Label>
            <Input type="number" value={preferences.budget_max} onChange={(e) => setPreferences({ ...preferences, budget_max: e.target.value })} className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Sharing Preference</Label>
            <Select value={preferences.preferred_sharing} onValueChange={(v) => setPreferences({ ...preferences, preferred_sharing: v })}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Any" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single</SelectItem>
                <SelectItem value="double">Double</SelectItem>
                <SelectItem value="triple">Triple</SelectItem>
                <SelectItem value="dormitory">Dormitory</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="gap-2 rounded-xl">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save Changes
      </Button>
    </div>
  );
};

export default UserProfile;
