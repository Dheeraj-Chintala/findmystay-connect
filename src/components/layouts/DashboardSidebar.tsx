import { useLocation, useNavigate } from "react-router-dom";
import { Building2, LogOut, ChevronLeft } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

export interface SidebarNavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  badge?: string | number;
}

interface DashboardSidebarProps {
  title: string;
  subtitle: string;
  groups: {
    label: string;
    items: SidebarNavItem[];
  }[];
}

const DashboardSidebar = ({ title, subtitle, groups }: DashboardSidebarProps) => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <div
          className="flex items-center gap-2.5 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-sm shrink-0">
            <Building2 className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="font-heading font-extrabold text-sm truncate">{title}</p>
              <p className="text-[10px] text-muted-foreground truncate">{subtitle}</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-3">
              {!collapsed && group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = location.pathname === item.url;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          end
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                            isActive
                              ? "bg-primary/10 text-primary font-semibold"
                              : "text-sidebar-foreground hover:bg-sidebar-accent"
                          }`}
                          activeClassName=""
                        >
                          <item.icon className={`w-4 h-4 shrink-0 ${isActive ? "text-primary" : ""}`} />
                          {!collapsed && (
                            <>
                              <span className="flex-1 truncate">{item.title}</span>
                              {item.badge !== undefined && (
                                <span className="text-[10px] bg-destructive text-destructive-foreground rounded-full px-1.5 py-0.5 font-mono">
                                  {item.badge}
                                </span>
                              )}
                            </>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive rounded-xl"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span className="text-sm">Sign Out</span>}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground rounded-xl"
          onClick={() => navigate("/")}
        >
          <ChevronLeft className="w-4 h-4" />
          {!collapsed && <span className="text-sm">Back to Home</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};

export default DashboardSidebar;
