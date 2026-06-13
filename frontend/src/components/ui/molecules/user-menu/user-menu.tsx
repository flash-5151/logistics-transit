import * as React from "react";
import { cn } from "../../../../lib/utils";
import type { UserMenuProps } from "./user-menu.types";

const UserMenu = React.forwardRef<HTMLDivElement, UserMenuProps>(
  ({ name, subtitle, avatar, menu, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex items-center gap-3", className)}
        {...props}
      >
        {avatar && (
          <div aria-hidden="true" className="shrink-0">
            {avatar}
          </div>
        )}
        <div className="flex flex-col">
          <p className="text-sm font-medium text-foreground">{name}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {menu}
      </div>
    );
  }
);

UserMenu.displayName = "UserMenu";

export { UserMenu };
