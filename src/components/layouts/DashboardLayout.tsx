import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import DashboardSidebar, { SidebarNavItem } from "./DashboardSidebar";

interface DashboardLayoutProps {
  title: string;
  subtitle: string;
  groups: {
    label: string;
    items: SidebarNavItem[];
  }[];
  children: ReactNode;
  headerRight?: ReactNode;
  pageTitle?: string;
}

const DashboardLayout = ({ title, subtitle, groups, children, headerRight, pageTitle }: DashboardLayoutProps) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar title={title} subtitle={subtitle} groups={groups} />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border bg-card/50 backdrop-blur-sm px-4 sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground" />
              {pageTitle && (
                <h1 className="font-heading font-bold text-lg truncate">{pageTitle}</h1>
              )}
            </div>
            {headerRight && <div>{headerRight}</div>}
          </header>
          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
