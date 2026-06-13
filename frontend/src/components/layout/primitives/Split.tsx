import * as React from "react";
import { cn } from "../../../lib/utils";

export interface SplitProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  align?: "start" | "center" | "end" | "baseline" | "stretch";
  slots: {
    left?: React.ReactNode;
    right?: React.ReactNode;
  };
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

const Split = React.forwardRef<HTMLDivElement, SplitProps>(
  ({ gap = "md", align = "center", slots, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex w-full justify-between",
          alignClasses[align],
          gapClasses[gap],
          className
        )}
        {...props}
      >
        <div className={cn("flex items-center", gapClasses[gap])}>
          {slots.left}
        </div>
        <div className={cn("flex items-center justify-end", gapClasses[gap])}>
          {slots.right}
        </div>
      </div>
    );
  }
);

Split.displayName = "Split";

export { Split };
