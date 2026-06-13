import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Activity,
  Package,
  HeartHandshake,
  Users,
  TrendingUp,
  LogOut,
  Building,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { Stack } from "@/components/layout/primitives/Stack";

interface SidebarRoute {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const roleRoutes: Record<string, SidebarRoute[]> = {
  hospital: [
    { label: "Dashboard",  path: "/hospital",           icon: LayoutDashboard },
    { label: "Requests",   path: "/hospital/requests",  icon: Activity },
    { label: "Transfers",  path: "/hospital/transfers", icon: Package },
    { label: "Analytics",  path: "/analytics",          icon: TrendingUp },
  ],
  blood_bank: [
    { label: "Dashboard",    path: "/bloodbank",            icon: LayoutDashboard },
    { label: "Inventory",    path: "/bloodbank/inventory",  icon: Package },
    { label: "Log Donation", path: "/bloodbank/donations",  icon: HeartHandshake },
    { label: "Analytics",    path: "/analytics",            icon: TrendingUp },
  ],
  donor: [
    { label: "Dashboard",         path: "/donor",           icon: LayoutDashboard },
    { label: "Donations & Badges",path: "/donor/donations", icon: HeartHandshake },
    { label: "Analytics",         path: "/analytics",       icon: TrendingUp },
  ],
  admin: [
    { label: "Analytics Dashboard",  path: "/analytics",           icon: TrendingUp },
    { label: "Manage Organizations", path: "/admin/organizations", icon: Building },
    { label: "Donor Directory",      path: "/admin/donors",        icon: Users },
    { label: "Inventory Control",    path: "/admin/inventory",     icon: Package },
  ],
};

const Sidebar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const routes = user ? roleRoutes[user.role] || [] : [];

  return (
    <aside className="w-64 bg-[#251C1A] flex flex-col text-[#FDFBF7] border-r border-[#EAE3DB]/10 shrink-0 h-screen sticky top-0">

      {/* Brand header */}
      <div className="h-16 px-6 flex items-center border-b border-[#EAE3DB]/10">
        <Link
          to="/"
          className="flex items-center gap-2 group"
        >
          <HeartHandshake className="h-6 w-6 text-[#C14E3A] transition-transform duration-200 group-hover:scale-110" />
          <span className="font-bold text-lg tracking-tight font-sans text-[#FDFBF7] transition-opacity duration-200 group-hover:opacity-90">
            BloodLink AI
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto">
        <Stack gap="xs">
          {routes.map((route) => {
            const isActive = location.pathname === route.path;
            const Icon = route.icon;
            return (
              <Link
                key={route.path}
                to={route.path}
                className={cn(
                  // Base layout + transition
                  "relative flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium overflow-hidden",
                  "transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
                  // Active left-bar indicator via pseudo-element
                  "before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2",
                  "before:w-[3px] before:h-[60%] before:rounded-r-full before:bg-[#C14E3A]",
                  "before:transition-transform before:duration-200 before:ease-[cubic-bezier(0.22,1,0.36,1)]",
                  // Inactive state
                  !isActive && [
                    "text-[#FDFBF7]/60 hover:text-[#FDFBF7] hover:bg-white/5",
                    "before:scale-y-0",
                    // Icon dims slightly when inactive
                    "[&_svg]:opacity-70 hover:[&_svg]:opacity-100 [&_svg]:transition-opacity [&_svg]:duration-200",
                  ],
                  // Active state
                  isActive && [
                    "bg-[#C14E3A]/15 text-[#FDFBF7] font-semibold",
                    "before:scale-y-100",
                    "hover:bg-[#C14E3A]/20",
                  ]
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 shrink-0 transition-transform duration-200",
                    isActive && "scale-[1.08]"
                  )}
                />
                <span className="truncate">{route.label}</span>
              </Link>
            );
          })}
        </Stack>
      </nav>

      {/* Footer logout */}
      <div className="p-4 border-t border-[#EAE3DB]/10 bg-black/20">
        <button
          onClick={logout}
          className={cn(
            "flex w-full items-center gap-3 px-4 py-3 rounded-md text-sm font-medium cursor-pointer",
            "text-[#FDFBF7]/60 hover:text-[#FDFBF7] hover:bg-white/8",
            "transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
            "[&_svg]:transition-transform [&_svg]:duration-200 hover:[&_svg]:translate-x-0.5",
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export { Sidebar };
