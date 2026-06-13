import * as React from "react";
import { cn } from "../../../../lib/utils";
import type { StatCardProps } from "./stat-card.types";

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ title, value, icon, trend, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Layout
          "flex flex-col gap-4 rounded-xl border border-border bg-surface p-6 shadow-card",
          // Hover lift animation
          "hover-lift cursor-default",
          // Subtle border brightens on hover
          "hover:border-border/80",
          className
        )}
        {...props}
      >
        <div className="flex items-center gap-2 text-muted-foreground">
          {icon && (
            <div
              aria-hidden="true"
              className="flex items-center justify-center [&_svg]:size-5 transition-transform duration-200 group-hover:scale-110"
            >
              {icon}
            </div>
          )}
          <p className="text-sm font-medium text-text-secondary">{title}</p>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-2xl font-bold text-text-primary">{value}</h3>
          {trend && <div className="flex items-center">{trend}</div>}
        </div>
      </div>
    );
  }
);

StatCard.displayName = "StatCard";

export { StatCard };
