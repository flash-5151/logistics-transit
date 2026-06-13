import * as React from "react";
import { cn } from "../../../lib/utils";

export interface RowProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  align?: "start" | "center" | "end" | "baseline" | "stretch";
}

const gapClasses = {
  none: "gap-0",
  xs: "gap-1",   // 4px
  sm: "gap-2",   // 8px
  md: "gap-4",   // 16px
  lg: "gap-6",   // 24px
  xl: "gap-8",   // 32px
  "2xl": "gap-12", // 48px
  "3xl": "gap-16", // 64px
};

const alignClasses = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  baseline: "items-baseline",
  stretch: "items-stretch",
};

const Row = React.forwardRef<HTMLDivElement, RowProps>(
  ({ gap = "md", align = "center", className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-row justify-start",
          alignClasses[align],
          gapClasses[gap],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Row.displayName = "Row";

export { Row };
