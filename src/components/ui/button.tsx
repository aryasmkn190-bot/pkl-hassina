"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "font-semibold text-sm tracking-wide",
    "rounded-xl border border-transparent",
    "transition-all duration-200 ease-in-out",
    "select-none cursor-pointer",
    "-webkit-tap-highlight-color-transparent",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    "disabled:opacity-50 disabled:pointer-events-none",
    "active:scale-[0.96]",
  ],
  {
    variants: {
      variant: {
        default: [
          "bg-primary text-white border-primary",
          "hover:bg-primary-dark hover:border-primary-dark",
          "focus-visible:ring-primary",
          "shadow-sm hover:shadow-md",
        ],
        destructive: [
          "bg-red-600 text-white border-red-600",
          "hover:bg-red-700 hover:border-red-700",
          "focus-visible:ring-red-500",
          "shadow-sm hover:shadow-md",
        ],
        outline: [
          "bg-transparent text-foreground",
          "border border-[var(--color-border-strong)]",
          "hover:bg-[var(--color-background)]",
          "focus-visible:ring-[var(--color-primary)]",
        ],
        secondary: [
          "bg-[var(--color-secondary)] text-white border-[var(--color-secondary)]",
          "hover:bg-[var(--color-secondary-dark)]",
          "focus-visible:ring-[var(--color-secondary)]",
          "shadow-sm hover:shadow-md",
        ],
        ghost: [
          "bg-transparent text-[var(--color-foreground)]",
          "hover:bg-[var(--color-background)]",
          "focus-visible:ring-[var(--color-primary)]",
        ],
        link: [
          "bg-transparent text-[var(--color-primary)]",
          "underline-offset-4 hover:underline",
          "focus-visible:ring-[var(--color-primary)]",
          "h-auto p-0",
        ],
        success: [
          "bg-emerald-600 text-white border-emerald-600",
          "hover:bg-emerald-700",
          "focus-visible:ring-emerald-500",
          "shadow-sm hover:shadow-md",
        ],
        warning: [
          "bg-amber-500 text-white border-amber-500",
          "hover:bg-amber-600",
          "focus-visible:ring-amber-400",
          "shadow-sm",
        ],
        soft: [
          "bg-[var(--color-primary-light)] text-[var(--color-primary)]",
          "hover:bg-blue-100",
          "focus-visible:ring-[var(--color-primary)]",
        ],
      },
      size: {
        default: "h-11 px-5 py-2.5 text-sm",
        sm: "h-9 px-4 py-2 text-xs rounded-lg",
        lg: "h-13 px-7 py-3 text-base rounded-2xl",
        xl: "h-14 px-8 py-3.5 text-base rounded-2xl",
        icon: "h-10 w-10 p-0 rounded-xl",
        "icon-sm": "h-8 w-8 p-0 rounded-lg text-xs",
        "icon-lg": "h-12 w-12 p-0 rounded-2xl",
        full: "h-12 w-full px-6 py-3 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
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
      asChild = false,
      loading = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <span
              className="spinner"
              style={{ width: 16, height: 16, borderWidth: 2 }}
              aria-hidden="true"
            />
            <span>Memuat...</span>
          </>
        ) : (
          <>
            {leftIcon && (
              <span className="flex-shrink-0" aria-hidden="true">
                {leftIcon}
              </span>
            )}
            {children}
            {rightIcon && (
              <span className="flex-shrink-0" aria-hidden="true">
                {rightIcon}
              </span>
            )}
          </>
        )}
      </Comp>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
