import { useState, useEffect } from "react";
import { Users, Loader2, Shield, Search, MoreHorizontal, UserCheck, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface UserWithRoles {
  user_id: string;
  full_name: string;
  email: string | null;
  created_at: string;
  roles: string[];
}

const AdminUserManagement = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, email, created_at")
      .order("created_at", { ascending: false });

    if (profiles) {
      const { data: roles } = await supabase.from("user_roles").select("user_id, role");
      const roleMap = new Map<string, string[]>();
      (roles || []).forEach(r => {
        const existing = roleMap.get(r.user_id) || [];
        existing.push(r.role);
        roleMap.set(r.user_id, existing);
      });

      setUsers(profiles.map(p => ({
        ...p,
        roles: roleMap.get(p.user_id) || ["user"],
      })));
    }
    setLoading(false);
  };

  const toggleRole = async (userId: string, role: string, hasRole: boolean) => {
    setProcessing(userId);
    try {
      if (hasRole) {
        await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role as any);
      } else {
        await supabase.from("user_roles").insert({ user_id: userId, role: role as any });
      }
      toast.success(`Role ${hasRole ? "removed" : "added"}: ${role}`);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message);
    }
    setProcessing(null);
  };

  const filtered = search
    ? users.filter(u => u.full_name.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()))
    : users;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const roleBadge = (role: string) => {
    const styles: Record<string, string> = {
      admin: "bg-destructive/10 text-destructive",
      owner: "bg-verified/10 text-verified",
      user: "bg-muted text-muted-foreground",
    };
    return <Badge key={role} className={`${styles[role] || styles.user} text-[10px]`}>{role}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-semibold text-lg flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" /> User Management
        </h2>
        <Badge variant="secondary" className="font-mono">{users.length} users</Badge>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search users..." className="pl-10 rounded-xl" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="space-y-2">
        {filtered.slice(0, 50).map((u, i) => (
          <motion.div
            key={u.user_id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.02 }}
            className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border/50"
          >
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-heading font-bold text-primary text-xs shrink-0">
              {u.full_name[0]?.toUpperCase() || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-heading font-semibold text-sm truncate">{u.full_name || "Unnamed"}</p>
              <p className="text-muted-foreground text-xs truncate">{u.email}</p>
            </div>
            <div className="flex items-center gap-1.5">
              {u.roles.map(r => roleBadge(r))}
            </div>
            <p className="text-muted-foreground text-[10px] shrink-0 hidden sm:block">{new Date(u.created_at).toLocaleDateString()}</p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={processing === u.user_id}>
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => toggleRole(u.user_id, "owner", u.roles.includes("owner"))} className="gap-2 text-xs">
                  <UserCheck className="w-3.5 h-3.5" /> {u.roles.includes("owner") ? "Remove Owner" : "Make Owner"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleRole(u.user_id, "admin", u.roles.includes("admin"))} className="gap-2 text-xs">
                  <Shield className="w-3.5 h-3.5" /> {u.roles.includes("admin") ? "Remove Admin" : "Make Admin"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AdminUserManagement;
