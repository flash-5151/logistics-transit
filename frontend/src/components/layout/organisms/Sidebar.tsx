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
    { label: "Dashboard", path: "/hospital", icon: LayoutDashboard },
    { label: "Requests", path: "/hospital/requests", icon: Activity },
    { label: "Transfers", path: "/hospital/transfers", icon: Package },
    { label: "Analytics", path: "/analytics", icon: TrendingUp },
  ],
  blood_bank: [
    { label: "Dashboard", path: "/bloodbank", icon: LayoutDashboard },
    { label: "Inventory", path: "/bloodbank/inventory", icon: Package },
    { label: "Log Donation", path: "/bloodbank/donations", icon: HeartHandshake },
    { label: "Analytics", path: "/analytics", icon: TrendingUp },
  ],
  donor: [
    { label: "Dashboard", path: "/donor", icon: LayoutDashboard },
    { label: "Donations & Badges", path: "/donor/donations", icon: HeartHandshake },
    { label: "Analytics", path: "/analytics", icon: TrendingUp },
  ],
  admin: [
    { label: "Analytics Dashboard", path: "/analytics", icon: TrendingUp },
    { label: "Manage Organizations", path: "/admin/organizations", icon: Building },
    { label: "Donor Directory", path: "/admin/donors", icon: Users },
    { label: "Inventory Control", path: "/admin/inventory", icon: Package },
  ],
};

const Sidebar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const routes = user ? roleRoutes[user.role] || [] : [];

  return (
    <aside className="w-64 bg-[#251C1A] flex flex-col text-[#FDFBF7] border-r border-[#EAE3DB]/10 shrink-0 h-screen sticky top-0">
      {/* Sidebar Header */}
      <div className="h-16 px-6 flex items-center border-b border-[#EAE3DB]/10">
        <Link to="/" className="flex items-center gap-2">
          <HeartHandshake className="h-6 w-6 text-[#C14E3A]" />
          <span className="font-bold text-lg tracking-tight font-sans text-[#FDFBF7]">
            BloodLink AI
          </span>
        </Link>
      </div>

      {/* Navigation Links */}
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
                  "flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-all duration-150",
                  "text-[#FDFBF7]/70 hover:text-[#FDFBF7] hover:bg-white/5",
                  isActive && "bg-[#C14E3A] text-white font-semibold hover:bg-[#AA3E2B]"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{route.label}</span>
              </Link>
            );
          })}
        </Stack>
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-[#EAE3DB]/10 bg-black/20">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 px-4 py-3 rounded-md text-sm font-medium text-[#FDFBF7]/70 hover:text-[#FDFBF7] hover:bg-white/5 transition-all duration-150 cursor-pointer"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export { Sidebar };
