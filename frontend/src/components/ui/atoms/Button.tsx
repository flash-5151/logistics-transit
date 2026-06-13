import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../../lib/utils";

const buttonVariants = cva(
  // Base — all buttons share these
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap font-sans font-medium rounded-md",
    "select-none cursor-pointer",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
    // Smooth multi-property transition on every button
    "transition-all duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
    // Press micro-feedback
    "active:scale-[0.97]",
  ].join(" "),
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-surface hover:bg-primary-hover hover:shadow-[0_4px_16px_rgba(193,78,58,0.35)] hover:-translate-y-px",
        secondary:
          "bg-border/20 text-text-primary border border-border hover:bg-border/40 hover:shadow-soft hover:-translate-y-px",
        outline:
          "border border-border bg-transparent text-text-primary hover:bg-border/20 hover:border-border/70 hover:-translate-y-px",
        ghost:
          "text-text-primary hover:bg-border/20",
        danger:
          "bg-danger text-surface hover:bg-danger/85 hover:shadow-[0_4px_16px_rgba(155,46,30,0.30)] hover:-translate-y-px",
        link:
          "text-primary underline-offset-4 hover:underline bg-transparent p-0 active:scale-100",
      },
      size: {
        sm:      "h-10 px-4 text-sm [&_svg]:size-4",
        default: "h-12 px-6 text-base [&_svg]:size-5",
        lg:      "h-14 px-8 text-base [&_svg]:size-5",
        icon:    "h-12 w-12 p-0 [&_svg]:size-5",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      loading = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      type = "button",
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-disabled={disabled || loading ? "true" : undefined}
        aria-busy={loading ? "true" : undefined}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {/* Loading Spinner */}
        {loading && (
          <svg
            className="animate-spin text-current shrink-0"
            style={{
              width: size === "sm" ? "16px" : "20px",
              height: size === "sm" ? "16px" : "20px",
            }}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}

        {/* Left Icon (only render if not loading to avoid content shifting) */}
        {!loading && leftIcon && (
          <span className="inline-flex shrink-0 items-center justify-center">
            {leftIcon}
          </span>
        )}

        {/* Children (text/content) */}
        {children && (
          <span className={cn("inline-flex items-center", loading && "opacity-90")}>
            {children}
          </span>
        )}

        {/* Right Icon */}
        {!loading && rightIcon && (
          <span className="inline-flex shrink-0 items-center justify-center">
            {rightIcon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
