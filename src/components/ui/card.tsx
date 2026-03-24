"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/* ============================================================
   CARD
   ============================================================ */

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  interactive?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
  variant?: "default" | "elevated" | "outline" | "ghost" | "gradient";
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      hover = false,
      interactive = false,
      padding = "md",
      variant = "default",
      ...props
    },
    ref
  ) => {
    const paddingClasses = {
      none: "",
      sm: "p-3",
      md: "p-4",
      lg: "p-6",
    };

    const variantClasses = {
      default:
        "bg-white border border-[var(--color-border)] shadow-[var(--shadow-card)]",
      elevated:
        "bg-white border border-[var(--color-border)] shadow-[var(--shadow-md)]",
      outline: "bg-transparent border-2 border-[var(--color-border-strong)]",
      ghost: "bg-[var(--color-background)] border border-transparent",
      gradient:
        "bg-gradient-to-br from-white to-slate-50 border border-[var(--color-border)] shadow-[var(--shadow-card)]",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl overflow-hidden",
          variantClasses[variant],
          paddingClasses[padding],
          hover &&
            "transition-all duration-250 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)]",
          interactive &&
            "cursor-pointer transition-all duration-150 active:scale-[0.98] tap-highlight-none select-none",
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-5 pb-0", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-base font-bold leading-tight tracking-tight text-[var(--color-foreground)]",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-[var(--color-muted)]", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-5 pt-3", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center justify-between p-5 pt-0 gap-3",
      className
    )}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

/* ============================================================
   BADGE
   ============================================================ */

import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
  [
    "inline-flex items-center gap-1",
    "px-2.5 py-0.5",
    "rounded-full",
    "text-[11px] font-semibold tracking-wide whitespace-nowrap",
    "leading-relaxed",
    "transition-colors duration-150",
  ],
  {
    variants: {
      variant: {
        default: "bg-blue-100 text-blue-800",
        secondary: "bg-slate-100 text-slate-700",
        destructive: "bg-red-100 text-red-800",
        outline: "bg-transparent border border-[var(--color-border-strong)] text-[var(--color-foreground)]",
        success: "bg-emerald-100 text-emerald-800",
        warning: "bg-amber-100 text-amber-800",
        info: "bg-sky-100 text-sky-800",
        purple: "bg-purple-100 text-purple-800",
        pending: "bg-yellow-100 text-yellow-800",
        verified: "bg-emerald-100 text-emerald-800",
        rejected: "bg-red-100 text-red-800",
        approved: "bg-emerald-100 text-emerald-800",
        draft: "bg-slate-100 text-slate-600",
        submitted: "bg-sky-100 text-sky-800",
        reviewed: "bg-emerald-100 text-emerald-800",
        revision: "bg-amber-100 text-amber-800",
        active: "bg-emerald-100 text-emerald-800",
        inactive: "bg-slate-100 text-slate-600",
        urgent: "bg-red-100 text-red-800",
        event: "bg-purple-100 text-purple-800",
        reminder: "bg-amber-100 text-amber-800",
        general: "bg-blue-100 text-blue-800",
        sick: "bg-red-100 text-red-700",
        permission: "bg-blue-100 text-blue-700",
        emergency: "bg-orange-100 text-orange-800",
        other: "bg-slate-100 text-slate-700",
      },
      size: {
        sm: "text-[10px] px-2 py-px",
        default: "text-[11px] px-2.5 py-0.5",
        lg: "text-xs px-3 py-1",
      },
      dot: {
        true: "pl-1.5",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      dot: false,
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

function Badge({ className, variant, size, dot = false, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant, size, dot, className }))}
      {...props}
    >
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full bg-current opacity-80 flex-shrink-0"
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

/* ============================================================
   INPUT
   ============================================================ */

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconClick?: () => void;
  containerClassName?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      onRightIconClick,
      containerClassName,
      id,
      type = "text",
      ...props
    },
    ref
  ) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className={cn("form-group", containerClassName)}>
        {label && (
          <label htmlFor={inputId} className="form-label">
            {label}
            {props.required && (
              <span className="text-red-500 ml-1" aria-hidden="true">*</span>
            )}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3.5 text-[var(--color-muted)] flex-shrink-0 pointer-events-none">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            type={type}
            className={cn(
              "input-base",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              error && "input-error",
              className
            )}
            aria-invalid={!!error}
            aria-describedby={
              error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
            }
            {...props}
          />
          {rightIcon && (
            <span
              className={cn(
                "absolute right-3.5 text-[var(--color-muted)] flex-shrink-0",
                onRightIconClick && "cursor-pointer hover:text-[var(--color-foreground)] transition-colors"
              )}
              onClick={onRightIconClick}
              role={onRightIconClick ? "button" : undefined}
              tabIndex={onRightIconClick ? 0 : undefined}
            >
              {rightIcon}
            </span>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="form-error" role="alert">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <circle cx="6" cy="6" r="5.5" stroke="currentColor" />
              <path d="M6 3.5v3M6 8.5v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="form-hint">
            {hint}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

/* ============================================================
   TEXTAREA
   ============================================================ */

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  showCount?: boolean;
  maxLength?: number;
  containerClassName?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      hint,
      showCount = false,
      maxLength,
      containerClassName,
      id,
      value,
      defaultValue,
      onChange,
      ...props
    },
    ref
  ) => {
    const [charCount, setCharCount] = React.useState(
      String(value ?? defaultValue ?? "").length
    );
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharCount(e.target.value.length);
      onChange?.(e);
    };

    return (
      <div className={cn("form-group", containerClassName)}>
        {label && (
          <div className="flex items-center justify-between">
            <label htmlFor={inputId} className="form-label">
              {label}
              {props.required && (
                <span className="text-red-500 ml-1" aria-hidden="true">*</span>
              )}
            </label>
            {showCount && maxLength && (
              <span
                className={cn(
                  "text-xs tabular-nums",
                  charCount >= maxLength
                    ? "text-red-500"
                    : charCount >= maxLength * 0.8
                    ? "text-amber-500"
                    : "text-[var(--color-muted)]"
                )}
              >
                {charCount}/{maxLength}
              </span>
            )}
          </div>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            "input-base h-auto resize-none py-3 rounded-2xl",
            "min-h-[96px]",
            error && "input-error",
            className
          )}
          maxLength={maxLength}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          aria-invalid={!!error}
          {...props}
        />
        {error && (
          <p className="form-error" role="alert">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <circle cx="6" cy="6" r="5.5" stroke="currentColor" />
              <path d="M6 3.5v3M6 8.5v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            {error}
          </p>
        )}
        {hint && !error && <p className="form-hint">{hint}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

/* ============================================================
   LABEL
   ============================================================ */

import * as LabelPrimitive from "@radix-ui/react-label";

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(
      "text-sm font-semibold text-[var(--color-foreground)]",
      "leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
      className
    )}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

/* ============================================================
   AVATAR
   ============================================================ */

import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { getInitials, stringToAvatarColor } from "@/lib/utils";

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

const avatarSizeMap: Record<AvatarSize, string> = {
  xs: "avatar-xs",
  sm: "avatar-sm",
  md: "avatar-md",
  lg: "avatar-lg",
  xl: "avatar-xl",
  "2xl": "avatar-2xl",
};

interface AvatarRootProps
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> {
  size?: AvatarSize;
  name?: string;
  src?: string;
  online?: boolean;
}

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  AvatarRootProps
>(({ className, size = "md", name, src, online, ...props }, ref) => {
  const colorClass = name ? stringToAvatarColor(name) : "bg-slate-400";

  return (
    <div className="relative inline-flex flex-shrink-0">
      <AvatarPrimitive.Root
        ref={ref}
        className={cn(
          "avatar",
          avatarSizeMap[size],
          className
        )}
        {...props}
      >
        {src && (
          <AvatarPrimitive.Image
            src={src}
            alt={name ?? "Avatar"}
            className="w-full h-full object-cover"
          />
        )}
        <AvatarPrimitive.Fallback
          className={cn(
            "w-full h-full flex items-center justify-center text-white font-bold",
            colorClass
          )}
          delayMs={300}
        >
          {name ? getInitials(name) : "?"}
        </AvatarPrimitive.Fallback>
      </AvatarPrimitive.Root>
      {online !== undefined && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-2 border-white",
            size === "xs" || size === "sm" ? "w-2 h-2" : "w-2.5 h-2.5",
            online ? "bg-emerald-500" : "bg-slate-300"
          )}
          aria-label={online ? "Online" : "Offline"}
        />
      )}
    </div>
  );
});
Avatar.displayName = "Avatar";

const AvatarImage = AvatarPrimitive.Image;
const AvatarFallback = AvatarPrimitive.Fallback;

/* ============================================================
   SKELETON
   ============================================================ */

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("skeleton", className)}
      aria-hidden="true"
      {...props}
    />
  );
}

function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-4", i === lines - 1 ? "w-3/4" : "w-full")}
        />
      ))}
    </div>
  );
}

function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("card-base p-4 space-y-3", className)} aria-hidden="true">
      <div className="flex items-center gap-3">
        <Skeleton className="w-11 h-11 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/5" />
          <Skeleton className="h-3 w-2/5" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
    </div>
  );
}

function SkeletonAvatar({ size = "md" }: { size?: AvatarSize }) {
  const sizeMap: Record<AvatarSize, string> = {
    xs: "w-7 h-7",
    sm: "w-9 h-9",
    md: "w-11 h-11",
    lg: "w-14 h-14",
    xl: "w-18 h-18",
    "2xl": "w-24 h-24",
  };
  return (
    <Skeleton className={cn("rounded-full flex-shrink-0", sizeMap[size])} aria-hidden="true" />
  );
}

function SkeletonListItem({ className }: { className?: string }) {
  return (
    <div
      className={cn("flex items-center gap-3 p-4", className)}
      aria-hidden="true"
    >
      <SkeletonAvatar size="md" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  );
}

/* ============================================================
   SEPARATOR
   ============================================================ */

import * as SeparatorPrimitive from "@radix-ui/react-separator";

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(({ className, orientation = "horizontal", decorative = true, ...props }, ref) => (
  <SeparatorPrimitive.Root
    ref={ref}
    decorative={decorative}
    orientation={orientation}
    className={cn(
      "shrink-0 bg-[var(--color-border)]",
      orientation === "horizontal" ? "h-px w-full my-1" : "h-full w-px mx-1",
      className
    )}
    {...props}
  />
));
Separator.displayName = SeparatorPrimitive.Root.displayName;

/* ============================================================
   PROGRESS
   ============================================================ */

import * as ProgressPrimitive from "@radix-ui/react-progress";

interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  value?: number;
  color?: "primary" | "secondary" | "accent" | "danger" | "success";
  showLabel?: boolean;
  size?: "sm" | "default" | "lg";
  animated?: boolean;
}

const progressColorMap = {
  primary: "progress-fill-primary",
  secondary: "progress-fill-secondary",
  accent: "progress-fill-accent",
  danger: "progress-fill-danger",
  success: "bg-gradient-to-r from-emerald-500 to-emerald-600",
};

const progressSizeMap = {
  sm: "h-1.5",
  default: "h-2",
  lg: "h-3",
};

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(
  (
    {
      className,
      value = 0,
      color = "primary",
      showLabel = false,
      size = "default",
      animated = true,
      ...props
    },
    ref
  ) => {
    const clampedValue = Math.min(100, Math.max(0, value));

    return (
      <div className="w-full space-y-1">
        {showLabel && (
          <div className="flex justify-between items-center">
            <span className="text-xs text-[var(--color-muted)]">Progress</span>
            <span className="text-xs font-bold text-[var(--color-foreground)]">
              {clampedValue}%
            </span>
          </div>
        )}
        <ProgressPrimitive.Root
          ref={ref}
          className={cn(
            "progress-track overflow-hidden",
            progressSizeMap[size],
            className
          )}
          value={clampedValue}
          {...props}
        >
          <ProgressPrimitive.Indicator
            className={cn(
              "progress-fill",
              progressColorMap[color],
              animated && "transition-[width] duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]"
            )}
            style={{ width: `${clampedValue}%` }}
          />
        </ProgressPrimitive.Root>
      </div>
    );
  }
);
Progress.displayName = ProgressPrimitive.Root.displayName;

/* ============================================================
   SWITCH
   ============================================================ */

import * as SwitchPrimitive from "@radix-ui/react-switch";

interface SwitchProps extends React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> {
  label?: string;
  description?: string;
}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  SwitchProps
>(({ className, label, description, id, ...props }, ref) => {
  const switchId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex items-center justify-between gap-4">
      {(label || description) && (
        <div className="flex flex-col gap-0.5 flex-1">
          {label && (
            <label
              htmlFor={switchId}
              className="text-sm font-semibold text-[var(--color-foreground)] cursor-pointer"
            >
              {label}
            </label>
          )}
          {description && (
            <p className="text-xs text-[var(--color-muted)]">{description}</p>
          )}
        </div>
      )}
      <SwitchPrimitive.Root
        ref={ref}
        id={switchId}
        className={cn(
          "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full",
          "border-2 border-transparent transition-colors duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "data-[state=checked]:bg-[var(--color-primary)]",
          "data-[state=unchecked]:bg-slate-200",
          className
        )}
        {...props}
      >
        <SwitchPrimitive.Thumb
          className={cn(
            "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-md",
            "ring-0 transition-transform duration-200",
            "data-[state=checked]:translate-x-5",
            "data-[state=unchecked]:translate-x-0"
          )}
        />
      </SwitchPrimitive.Root>
    </div>
  );
});
Switch.displayName = SwitchPrimitive.Root.displayName;

/* ============================================================
   CHECKBOX
   ============================================================ */

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";

interface CheckboxProps
  extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  label?: string;
  description?: string;
}

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, label, description, id, ...props }, ref) => {
  const checkId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex items-start gap-3">
      <CheckboxPrimitive.Root
        ref={ref}
        id={checkId}
        className={cn(
          "peer h-5 w-5 shrink-0 rounded-md",
          "border-2 border-[var(--color-border-strong)]",
          "transition-colors duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-1",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "data-[state=checked]:bg-[var(--color-primary)] data-[state=checked]:border-[var(--color-primary)]",
          "mt-0.5",
          className
        )}
        {...props}
      >
        <CheckboxPrimitive.Indicator className="flex items-center justify-center text-white">
          <Check className="h-3.5 w-3.5 stroke-[3]" />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      {(label || description) && (
        <div className="flex flex-col gap-0.5">
          {label && (
            <label
              htmlFor={checkId}
              className="text-sm font-medium text-[var(--color-foreground)] cursor-pointer leading-tight"
            >
              {label}
            </label>
          )}
          {description && (
            <p className="text-xs text-[var(--color-muted)]">{description}</p>
          )}
        </div>
      )}
    </div>
  );
});
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

/* ============================================================
   SCROLL AREA
   ============================================================ */

import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={cn("relative overflow-hidden", className)}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      orientation="vertical"
      className="flex touch-none select-none transition-colors w-1.5 p-px"
    >
      <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-[var(--color-subtle)]" />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
));
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

/* ============================================================
   TOOLTIP
   ============================================================ */

import * as TooltipPrimitive from "@radix-ui/react-tooltip";

const TooltipProvider = TooltipPrimitive.Provider;
const TooltipRoot = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 overflow-hidden rounded-lg",
      "bg-slate-900 px-3 py-1.5",
      "text-xs font-medium text-white",
      "shadow-md",
      "animate-fade-in-scale",
      className
    )}
    {...props}
  />
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

function Tooltip({
  children,
  content,
  side = "top",
}: {
  children: React.ReactNode;
  content: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
}) {
  return (
    <TooltipProvider>
      <TooltipRoot>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side}>
          {content}
          <TooltipPrimitive.Arrow className="fill-slate-900" />
        </TooltipContent>
      </TooltipRoot>
    </TooltipProvider>
  );
}

/* ============================================================
   EXPORTS
   ============================================================ */

export {
  // Card
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  // Badge
  Badge,
  badgeVariants,
  // Input
  Input,
  Textarea,
  // Label
  Label,
  // Avatar
  Avatar,
  AvatarImage,
  AvatarFallback,
  // Skeleton
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonAvatar,
  SkeletonListItem,
  // Separator
  Separator,
  // Progress
  Progress,
  // Switch
  Switch,
  // Checkbox
  Checkbox,
  // ScrollArea
  ScrollArea,
  // Tooltip
  Tooltip,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
  TooltipContent,
};
