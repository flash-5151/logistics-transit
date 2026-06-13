import * as React from "react";
import { cn } from "../../../../lib/utils";
import type { EmptyStateProps } from "./empty-state.types";

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ title, description, icon, action, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center gap-6 text-center p-8",
          className
        )}
        {...props}
      >
        <div className="flex flex-col items-center justify-center gap-4">
          {icon && (
            <div
              className="text-muted-foreground [&_svg]:size-12"
              aria-hidden="true"
            >
              {icon}
            </div>
          )}
          <div className="flex flex-col items-center justify-center gap-2">
            <h3 className="text-lg font-semibold text-foreground">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
        {action}
      </div>
    );
  }
);

EmptyState.displayName = "EmptyState";

export { EmptyState };
