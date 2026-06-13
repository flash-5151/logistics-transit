import * as React from "react";
import { cn } from "../../../lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", leftIcon, rightIcon, disabled, readOnly, ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        {leftIcon && (
          <div className="absolute left-4 text-text-secondary pointer-events-none flex items-center justify-center [&_svg]:size-5">
            {leftIcon}
          </div>
        )}
        <input
          type={type}
          ref={ref}
          disabled={disabled}
          readOnly={readOnly}
          className={cn(
            "w-full h-12 rounded-md border border-border bg-surface text-text-primary px-4 font-sans text-base transition-colors",
            "placeholder:text-text-secondary/60",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary",
            "disabled:opacity-50 disabled:bg-border/10 disabled:cursor-not-allowed",
            "read-only:bg-border/5 read-only:cursor-default",
            // Padding adjustments if icons are present
            leftIcon && "pl-11",
            rightIcon && "pr-11",
            // File input specific styling overrides
            type === "file" && "file:border-0 file:bg-border/20 file:text-text-primary file:mr-4 file:px-4 file:py-1 file:rounded-sm file:font-medium file:cursor-pointer hover:file:bg-border/40 file:transition-colors file:h-8",
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-4 text-text-secondary flex items-center justify-center [&_svg]:size-5">
            {rightIcon}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
