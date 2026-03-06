import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, MapPin, Building2, Users, IndianRupee, Loader2, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";

const COLORS = ["hsl(243, 75%, 59%)", "hsl(160, 84%, 39%)", "hsl(38, 92%, 50%)", "hsl(0, 84%, 60%)", "hsl(200, 70%, 50%)", "hsl(280, 60%, 55%)"];

const AdminAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalUsers: 0, totalHostels: 0, activeListings: 0, totalBookings: 0, totalReviews: 0 });
  const [bookingTrend, setBookingTrend] = useState<any[]>([]);
  const [cityData, setCityData] = useState<any[]>([]);
  const [typeData, setTypeData] = useState<any[]>([]);

  useEffect(() => { fetchAnalytics(); }, []);

  const fetchAnalytics = async () => {
    const [usersRes, hostelsRes, activeRes, bookingsRes, reviewsRes] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("hostels").select("id", { count: "exact", head: true }),
      supabase.from("hostels").select("id", { count: "exact", head: true }).eq("is_active", true).eq("verified_status", "verified"),
      supabase.from("bookings").select("id", { count: "exact", head: true }),
      supabase.from("reviews").select("id", { count: "exact", head: true }),
    ]);

    setStats({
      totalUsers: usersRes.count || 0,
      totalHostels: hostelsRes.count || 0,
      activeListings: activeRes.count || 0,
      totalBookings: bookingsRes.count || 0,
      totalReviews: reviewsRes.count || 0,
    });

    // Booking trends
    const { data: bookings } = await supabase.from("bookings").select("created_at, status");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthMap: Record<string, { approved: number; pending: number; rejected: number }> = {};
    months.forEach(m => { monthMap[m] = { approved: 0, pending: 0, rejected: 0 }; });
    (bookings || []).forEach(b => {
      const m = months[new Date(b.created_at).getMonth()];
      if (b.status === "approved") monthMap[m].approved++;
      else if (b.status === "rejected") monthMap[m].rejected++;
      else monthMap[m].pending++;
    });
    setBookingTrend(months.map(m => ({ month: m, ...monthMap[m] })));

    // City distribution
    const { data: hostels } = await supabase.from("hostels").select("city, property_type");
    const cityMap: Record<string, number> = {};
    const typeMap: Record<string, number> = {};
    (hostels || []).forEach(h => {
      cityMap[h.city] = (cityMap[h.city] || 0) + 1;
      typeMap[h.property_type] = (typeMap[h.property_type] || 0) + 1;
    });
    setCityData(Object.entries(cityMap).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([city, count]) => ({ city, count })));
    setTypeData(Object.entries(typeMap).map(([type, count]) => ({ name: type, value: count })));

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const summaryCards = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-primary" },
    { label: "Total Hostels", value: stats.totalHostels, icon: Building2, color: "text-accent" },
    { label: "Active Listings", value: stats.activeListings, icon: TrendingUp, color: "text-verified" },
    { label: "Total Bookings", value: stats.totalBookings, icon: Calendar, color: "text-primary" },
  ];

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summaryCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-card rounded-2xl p-4 border border-border/50 shadow-card"
          >
            <div className={`w-9 h-9 rounded-xl bg-secondary flex items-center justify-center ${stat.color} mb-2`}>
              <stat.icon className="w-4 h-4" />
            </div>
            <p className="font-heading font-extrabold text-xl">{stat.value}</p>
            <p className="text-muted-foreground text-[11px]">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Booking Trends */}
        <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-card">
          <h3 className="font-heading font-semibold text-sm mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" /> Booking Trends
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={bookingTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: 11 }} />
              <defs>
                <linearGradient id="approvedG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="pendingG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="approved" stroke="hsl(160, 84%, 39%)" fill="url(#approvedG)" strokeWidth={2} name="Approved" />
              <Area type="monotone" dataKey="pending" stroke="hsl(38, 92%, 50%)" fill="url(#pendingG)" strokeWidth={2} name="Pending" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* High Demand Locations */}
        <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-card">
          <h3 className="font-heading font-semibold text-sm mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-accent" /> High Demand Locations
          </h3>
          {cityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={cityData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis dataKey="city" type="category" width={80} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: 11 }} />
                <Bar dataKey="count" fill="hsl(243, 75%, 59%)" radius={[0, 6, 6, 0]} name="Listings" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No location data yet</p>
          )}
        </div>

        {/* Property Type Distribution */}
        {typeData.length > 0 && (
          <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-card lg:col-span-2">
            <h3 className="font-heading font-semibold text-sm mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-verified" /> Property Type Distribution
            </h3>
            <div className="flex items-center gap-8">
              <ResponsiveContainer width="50%" height={180}>
                <PieChart>
                  <Pie data={typeData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="value">
                    {typeData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {typeData.map((t, i) => (
                  <div key={t.name} className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="capitalize">{t.name}</span>
                    <span className="text-muted-foreground ml-auto">{t.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAnalytics;
