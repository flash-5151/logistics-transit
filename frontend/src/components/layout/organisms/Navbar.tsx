import * as React from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { Split } from "@/components/layout/primitives/Split";
import { UserMenu } from "@/components/ui/molecules/user-menu";
import { Avatar, AvatarFallback } from "@/components/ui/atoms/avatar";

interface NavbarProps {
  title?: string;
}

const Navbar: React.FC<NavbarProps> = ({ title = "Dashboard" }) => {
  const { user, token, setUser } = useAuthStore();
  const navigate = useNavigate();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const handleRoleChange = (role: string) => {
    if (user) {
      setUser({ ...user, role: role as any });
      navigate("/");
    }
  };

  const name = user?.name || user?.email || "User";
  const initials = getInitials(name);

  const leftSlot = (
    <h1 className="text-xl font-semibold text-text-primary tracking-tight">
      {title}
    </h1>
  );

  const rightSlot = (
    <div className="flex items-center gap-4">
      {/* Dev Role Switcher */}
      {token === "mock-bypass-token" && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-semibold mr-2 select-none">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
          <span>Bypass Mode:</span>
          <select
            value={user?.role || "hospital"}
            onChange={(e) => handleRoleChange(e.target.value)}
            className="bg-transparent border-none text-amber-500 font-semibold focus:outline-none cursor-pointer pr-1 text-xs"
          >
            <option value="hospital" className="text-text-primary bg-surface font-semibold">Hospital</option>
            <option value="blood_bank" className="text-text-primary bg-surface font-semibold">Blood Bank</option>
            <option value="donor" className="text-text-primary bg-surface font-semibold">Donor</option>
            <option value="admin" className="text-text-primary bg-surface font-semibold">Admin</option>
          </select>
        </div>
      )}

      {/* Notifications trigger */}
      <button
        className="relative p-2 rounded-full text-text-secondary hover:bg-border/30 hover:text-text-primary transition-colors cursor-pointer"
        aria-label="View notifications"
      >
        <Bell className="h-5 w-5" />
        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
      </button>

      {/* User profile dropdown molecule */}
      <UserMenu
        name={name}
        subtitle={user?.role.replace("_", " ")}
        avatar={
          <Avatar size="sm">
            <AvatarFallback className="bg-primary/10 text-primary border border-primary/20 font-semibold text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
        }
      />
    </div>
  );

  return (
    <header className="h-16 px-6 bg-surface border-b border-border flex items-center w-full sticky top-0 z-sticky">
      <Split slots={{ left: leftSlot, right: rightSlot }} />
    </header>
  );
};

export { Navbar };
