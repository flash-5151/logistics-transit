import * as React from "react";
import { cn } from "../../../lib/utils";

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
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

const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  ({ gap = "md", className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col justify-start items-stretch",
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

Stack.displayName = "Stack";

export { Stack };
