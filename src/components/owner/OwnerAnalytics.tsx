import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, Users, IndianRupee, Calendar, Building2, Clock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const OwnerAnalytics = () => {
  const { user } = useAuth();
  const [bookingsByMonth, setBookingsByMonth] = useState<{ month: string; bookings: number }[]>([]);
  const [occupancyData, setOccupancyData] = useState<{ name: string; occupancy: number }[]>([]);
  const [revenueData, setRevenueData] = useState<{ month: string; revenue: number }[]>([]);
  const [summary, setSummary] = useState({ totalBookings: 0, totalRooms: 0, occupiedBeds: 0, totalBeds: 0, estimatedRevenue: 0 });
  const [loading, setLoading] = useState(true);
  const [hasNoHostels, setHasNoHostels] = useState(false);
  const [pendingOnly, setPendingOnly] = useState(false);

  useEffect(() => {
    if (user) fetchAnalytics();
  }, [user]);

  const fetchAnalytics = async () => {
    const { data: hostels, error: hostelsError } = await supabase
      .from("hostels")
      .select("id, hostel_name, verified_status")
      .eq("owner_id", user!.id);

    if (hostelsError) { toast.error(hostelsError.message); setLoading(false); return; }

    if (!hostels?.length) {
      setHasNoHostels(true);
      setLoading(false);
      return;
    }

    const verifiedHostels = hostels.filter(h => h.verified_status === "verified");
    if (verifiedHostels.length === 0) {
      setPendingOnly(true);
      setLoading(false);
      return;
    }
    const hostelIds = hostels.map(h => h.id);

    // Bookings
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("created_at, status, hostel_id")
      .in("hostel_id", hostelIds);

    if (bookingsError) { toast.error(bookingsError.message); setLoading(false); return; }

    // Rooms
    const { data: rooms, error: roomsError } = await supabase
      .from("rooms")
      .select("hostel_id, total_beds, available_beds, price_per_month")
      .in("hostel_id", hostelIds);

    if (roomsError) { toast.error(roomsError.message); setLoading(false); return; }

    // Process monthly bookings
    const monthMap: Record<string, number> = {};
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    months.forEach(m => { monthMap[m] = 0; });
    
    (bookings || []).forEach(b => {
      const month = months[new Date(b.created_at).getMonth()];
      monthMap[month]++;
    });
    setBookingsByMonth(months.map(m => ({ month: m, bookings: monthMap[m] })));

    // Occupancy per hostel
    const occMap: Record<string, { name: string; occupied: number; total: number }> = {};
    hostels.forEach(h => { occMap[h.id] = { name: h.hostel_name, occupied: 0, total: 0 }; });
    
    (rooms || []).forEach(r => {
      if (occMap[r.hostel_id]) {
        occMap[r.hostel_id].total += r.total_beds;
        occMap[r.hostel_id].occupied += (r.total_beds - r.available_beds);
      }
    });
    setOccupancyData(Object.values(occMap).map(o => ({
      name: o.name.length > 15 ? o.name.substring(0, 15) + "..." : o.name,
      occupancy: o.total > 0 ? Math.round((o.occupied / o.total) * 100) : 0,
    })));

    // Revenue estimate (occupied beds * avg price)
    const totalBeds = (rooms || []).reduce((s, r) => s + r.total_beds, 0);
    const occupiedBeds = (rooms || []).reduce((s, r) => s + (r.total_beds - r.available_beds), 0);
    const avgPrice = (rooms || []).length > 0 ? (rooms || []).reduce((s, r) => s + r.price_per_month, 0) / rooms!.length : 0;
    const estimatedRevenue = occupiedBeds * avgPrice;

    const monthlyRevenue: Record<string, number> = {};
    months.forEach(m => { monthlyRevenue[m] = 0; });
    (bookings || []).forEach(b => {
      if (b.status === "approved" || b.status === "completed" || b.status === "checked_in") {
        const m = months[new Date(b.created_at).getMonth()];
        monthlyRevenue[m] += avgPrice;
      }
    });
    setRevenueData(months.map(m => ({
      month: m,
      revenue: Math.round(monthlyRevenue[m]),
    })));

    setSummary({
      totalBookings: (bookings || []).length,
      totalRooms: (rooms || []).length,
      occupiedBeds,
      totalBeds,
      estimatedRevenue: Math.round(estimatedRevenue),
    });

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (hasNoHostels) {
    return (
      <div className="text-center py-20 bg-card rounded-2xl border border-border/50">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-8 h-8 text-primary" />
        </div>
        <h3 className="font-heading font-bold text-xl mb-2">Welcome to Your Owner Dashboard</h3>
        <p className="text-muted-foreground text-sm max-w-md mx-auto mb-2">
          You haven't added any properties yet. Add your first hostel or PG to get started.
        </p>
        <p className="text-xs text-muted-foreground">
          Click <strong>"+ Add Property"</strong> in the top-right corner.
        </p>
      </div>
    );
  }

  if (pendingOnly) {
    return (
      <div className="text-center py-20 bg-card rounded-2xl border border-border/50">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
        </div>
        <h3 className="font-heading font-bold text-xl mb-2">Property Under Review</h3>
        <p className="text-muted-foreground text-sm max-w-md mx-auto mb-4">
          Your property is pending admin approval. Once approved, it will be visible to users
          and you'll see analytics here.
        </p>
        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
          <Clock className="w-3.5 h-3.5 mr-1" /> Pending Approval
        </Badge>
      </div>
    );
  }

  const occupancyRate = summary.totalBeds > 0 ? Math.round((summary.occupiedBeds / summary.totalBeds) * 100) : 0;

  const summaryCards = [
    { label: "Monthly Bookings", value: summary.totalBookings, icon: Calendar, color: "text-primary" },
    { label: "Occupancy Rate", value: `${occupancyRate}%`, icon: Users, color: "text-accent" },
    { label: "Est. Revenue", value: `₹${(summary.estimatedRevenue / 1000).toFixed(1)}K`, icon: IndianRupee, color: "text-verified" },
    { label: "Total Beds", value: summary.totalBeds, icon: TrendingUp, color: "text-primary" },
  ];

  return (
    <div className="space-y-6">
      {/* Summary cards */}
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

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly Bookings */}
        <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-card">
          <h3 className="font-heading font-semibold text-sm mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" /> Monthly Bookings
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={bookingsByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: 12 }} />
              <Bar dataKey="bookings" fill="hsl(243, 75%, 59%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Trend */}
        <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-card">
          <h3 className="font-heading font-semibold text-sm mb-4 flex items-center gap-2">
            <IndianRupee className="w-4 h-4 text-accent" /> Revenue Estimates
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: 12 }} formatter={(v: number) => [`₹${v.toLocaleString()}`, "Revenue"]} />
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="revenue" stroke="hsl(160, 84%, 39%)" fill="url(#revenueGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Occupancy by Property */}
        {occupancyData.length > 0 && (
          <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-card lg:col-span-2">
            <h3 className="font-heading font-semibold text-sm mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-verified" /> Occupancy by Property
            </h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={occupancyData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `${v}%`} />
                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: 12 }} formatter={(v: number) => [`${v}%`, "Occupancy"]} />
                <Bar dataKey="occupancy" fill="hsl(38, 92%, 50%)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerAnalytics;
