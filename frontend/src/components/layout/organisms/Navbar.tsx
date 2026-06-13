import * as React from "react";
import { Bell } from "lucide-react";

import { useAuthStore } from "@/store/authStore";
import { Split } from "@/components/layout/primitives/Split";
import { UserMenu } from "@/components/ui/molecules/user-menu";
import { Avatar, AvatarFallback } from "@/components/ui/atoms/avatar";

interface NavbarProps {
  title?: string;
}

const Navbar: React.FC<NavbarProps> = ({ title = "Dashboard" }) => {
  const { user } = useAuthStore();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
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
