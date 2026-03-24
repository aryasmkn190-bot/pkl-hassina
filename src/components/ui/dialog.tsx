"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Drawer as DrawerPrimitive } from "vaul";
import { X, Check, ChevronDown, ChevronUp, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

/* ============================================================
   DIALOG (Modal)
   ============================================================ */

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50",
      "bg-black/45 backdrop-blur-sm",
      "data-[state=open]:animate-fade-in",
      "data-[state=closed]:animate-fade-out",
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  showClose?: boolean;
  size?: "sm" | "default" | "lg" | "full";
}

const dialogSizeMap = {
  sm: "max-w-sm",
  default: "max-w-md",
  lg: "max-w-lg",
  full: "max-w-full min-h-[90dvh] rounded-t-3xl rounded-b-none bottom-0 top-auto translate-y-0",
};

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, showClose = true, size = "default", ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed z-50 w-full",
        "bg-white rounded-3xl",
        "shadow-[var(--shadow-xl)]",
        "p-6",
        // Centered on desktop, bottom sheet on mobile
        "left-[50%] -translate-x-1/2",
        "top-[50%] -translate-y-1/2",
        "max-h-[90dvh] overflow-y-auto",
        "focus:outline-none",
        "data-[state=open]:animate-fade-in-scale",
        "data-[state=closed]:opacity-0 data-[state=closed]:scale-95",
        "transition-all duration-200",
        dialogSizeMap[size],
        // Mobile: slide up from bottom
        "max-sm:top-auto max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:translate-x-0 max-sm:-translate-y-0 max-sm:rounded-b-none max-sm:rounded-t-3xl max-sm:max-w-full",
        "max-sm:data-[state=open]:animate-slide-up",
        className
      )}
      {...props}
    >
      {showClose && (
        <DialogPrimitive.Close
          className={cn(
            "absolute right-4 top-4 z-10",
            "rounded-xl p-1.5",
            "text-slate-400 hover:text-slate-700",
            "bg-slate-100 hover:bg-slate-200",
            "transition-colors duration-150",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
            "disabled:pointer-events-none"
          )}
          aria-label="Tutup"
        >
          <X className="h-4 w-4" />
        </DialogPrimitive.Close>
      )}
      {children}
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col gap-1.5 mb-5 pr-8", className)}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6",
      className
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-bold leading-tight text-slate-900",
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-slate-500 leading-relaxed", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

/* ============================================================
   CONFIRM DIALOG
   ============================================================ */

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  onConfirm: () => void;
  loading?: boolean;
  icon?: React.ReactNode;
}

function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Konfirmasi",
  cancelLabel = "Batal",
  variant = "default",
  onConfirm,
  loading = false,
  icon,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm" showClose={false}>
        <DialogHeader>
          {icon && (
            <div
              className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center mb-2",
                variant === "destructive" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
              )}
            >
              {icon}
            </div>
          )}
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className={cn(
              "flex-1 h-11 rounded-xl font-semibold text-sm",
              "bg-slate-100 text-slate-700 hover:bg-slate-200",
              "transition-colors duration-150",
              "disabled:opacity-50 disabled:pointer-events-none"
            )}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              "flex-1 h-11 rounded-xl font-semibold text-sm",
              "text-white transition-colors duration-150",
              "disabled:opacity-50 disabled:pointer-events-none",
              "flex items-center justify-center gap-2",
              variant === "destructive"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-blue-600 hover:bg-blue-700"
            )}
          >
            {loading && (
              <span
                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                aria-hidden="true"
              />
            )}
            {confirmLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ============================================================
   DRAWER (Bottom Sheet) — uses vaul
   ============================================================ */

interface DrawerProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  shouldScaleBackground?: boolean;
}

function Drawer({ shouldScaleBackground = true, ...props }: DrawerProps) {
  return (
    <DrawerPrimitive.Root
      shouldScaleBackground={shouldScaleBackground}
      {...props}
    />
  );
}
Drawer.displayName = "Drawer";

const DrawerTrigger = DrawerPrimitive.Trigger;
const DrawerPortal = DrawerPrimitive.Portal;
const DrawerClose = DrawerPrimitive.Close;

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/45 backdrop-blur-sm",
      className
    )}
    {...props}
  />
));
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName;

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DrawerPortal>
    <DrawerOverlay />
    <DrawerPrimitive.Content
      ref={ref}
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "flex flex-col",
        "rounded-t-[28px]",
        "bg-white",
        "shadow-[0_-4px_32px_rgba(0,0,0,0.12)]",
        "pb-safe",
        "max-h-[92dvh]",
        "focus:outline-none",
        className
      )}
      {...props}
    >
      {/* Drag handle */}
      <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
        <div className="w-10 h-1 rounded-full bg-slate-200" aria-hidden="true" />
      </div>
      <div className="overflow-y-auto flex-1">{children}</div>
    </DrawerPrimitive.Content>
  </DrawerPortal>
));
DrawerContent.displayName = "DrawerContent";

const DrawerHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col gap-1.5 px-5 pt-2 pb-4", className)}
    {...props}
  />
);
DrawerHeader.displayName = "DrawerHeader";

const DrawerFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col gap-3 px-5 pt-3 pb-5 border-t border-slate-100",
      className
    )}
    {...props}
  />
);
DrawerFooter.displayName = "DrawerFooter";

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    className={cn("text-lg font-bold text-slate-900", className)}
    {...props}
  />
));
DrawerTitle.displayName = DrawerPrimitive.Title.displayName;

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description
    ref={ref}
    className={cn("text-sm text-slate-500", className)}
    {...props}
  />
));
DrawerDescription.displayName = DrawerPrimitive.Description.displayName;

/* ============================================================
   TABS
   ============================================================ */

const tabsListVariants = cva(
  "inline-flex items-center",
  {
    variants: {
      variant: {
        default: [
          "bg-slate-100 rounded-xl p-1 gap-0.5",
        ],
        pills: [
          "gap-2 flex-wrap",
        ],
        underline: [
          "border-b border-slate-200 gap-0 w-full",
        ],
        segment: [
          "bg-slate-100 rounded-2xl p-1 w-full gap-1",
        ],
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const tabsTriggerVariants = cva(
  [
    "inline-flex items-center justify-center gap-1.5 whitespace-nowrap",
    "text-sm font-medium",
    "transition-all duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
    "disabled:pointer-events-none disabled:opacity-50",
    "select-none cursor-pointer",
    "-webkit-tap-highlight-color-transparent",
  ],
  {
    variants: {
      variant: {
        default: [
          "rounded-lg px-3.5 py-1.5",
          "text-slate-500 hover:text-slate-700",
          "data-[state=active]:bg-white data-[state=active]:text-slate-900",
          "data-[state=active]:shadow-sm data-[state=active]:font-semibold",
        ],
        pills: [
          "rounded-full px-4 py-1.5",
          "text-slate-500 hover:text-slate-700",
          "border border-slate-200 hover:border-slate-300",
          "data-[state=active]:bg-blue-600 data-[state=active]:text-white",
          "data-[state=active]:border-blue-600 data-[state=active]:font-semibold",
        ],
        underline: [
          "rounded-none px-4 py-2.5 border-b-2 border-transparent -mb-px",
          "text-slate-500 hover:text-slate-700",
          "data-[state=active]:border-blue-600 data-[state=active]:text-blue-600",
          "data-[state=active]:font-semibold",
        ],
        segment: [
          "flex-1 rounded-xl px-3 py-1.5",
          "text-slate-500 hover:text-slate-700",
          "data-[state=active]:bg-white data-[state=active]:text-slate-900",
          "data-[state=active]:shadow-sm data-[state=active]:font-semibold",
        ],
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface TabsContextValue {
  variant?: "default" | "pills" | "underline" | "segment";
}
const TabsContext = React.createContext<TabsContextValue>({});

interface TabsProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root> {
  variant?: "default" | "pills" | "underline" | "segment";
}

function Tabs({ variant = "default", children, ...props }: TabsProps) {
  return (
    <TabsContext.Provider value={{ variant }}>
      <TabsPrimitive.Root {...props}>{children}</TabsPrimitive.Root>
    </TabsContext.Provider>
  );
}

interface TabsListProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>,
    VariantProps<typeof tabsListVariants> {}

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, variant, ...props }, ref) => {
  const ctx = React.useContext(TabsContext);
  const v = variant ?? ctx.variant ?? "default";

  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(tabsListVariants({ variant: v }), className)}
      {...props}
    />
  );
});
TabsList.displayName = TabsPrimitive.List.displayName;

interface TabsTriggerProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>,
    VariantProps<typeof tabsTriggerVariants> {
  badge?: number | string;
  icon?: React.ReactNode;
}

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ className, variant, badge, icon, children, ...props }, ref) => {
  const ctx = React.useContext(TabsContext);
  const v = variant ?? ctx.variant ?? "default";

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(tabsTriggerVariants({ variant: v }), className)}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
      {badge !== undefined && badge !== 0 && (
        <span
          className={cn(
            "inline-flex items-center justify-center",
            "min-w-[18px] h-[18px] px-1",
            "rounded-full text-[10px] font-bold leading-none",
            "bg-red-500 text-white"
          )}
        >
          {badge}
        </span>
      )}
    </TabsPrimitive.Trigger>
  );
});
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-3",
      "focus-visible:outline-none",
      "data-[state=active]:animate-fade-in",
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

/* ============================================================
   DROPDOWN MENU
   ============================================================ */

const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
const DropdownMenuGroup = DropdownMenuPrimitive.Group;
const DropdownMenuPortal = DropdownMenuPrimitive.Portal;
const DropdownMenuSub = DropdownMenuPrimitive.Sub;
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-pointer select-none items-center gap-2 rounded-xl px-3 py-2",
      "text-sm font-medium text-slate-700",
      "outline-none",
      "focus:bg-slate-100 data-[state=open]:bg-slate-100",
      "transition-colors duration-100",
      inset && "pl-8",
      className
    )}
    {...props}
  >
    {children}
    <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
  </DropdownMenuPrimitive.SubTrigger>
));
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName;

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[10rem] overflow-hidden",
      "bg-white rounded-2xl border border-slate-100 shadow-[var(--shadow-lg)]",
      "p-1.5",
      "data-[state=open]:animate-fade-in-scale",
      className
    )}
    {...props}
  />
));
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName;

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-[10rem] overflow-hidden",
        "bg-white rounded-2xl border border-slate-100",
        "shadow-[var(--shadow-xl)]",
        "p-1.5",
        "data-[state=open]:animate-fade-in-scale",
        "data-[state=closed]:opacity-0 data-[state=closed]:scale-95",
        "transition-all duration-150",
        "origin-[var(--radix-dropdown-menu-content-transform-origin)]",
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean;
    destructive?: boolean;
    icon?: React.ReactNode;
  }
>(({ className, inset, destructive, icon, children, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center gap-2.5",
      "rounded-xl px-3 py-2.5",
      "text-sm font-medium",
      "outline-none",
      "transition-colors duration-100",
      "focus:bg-slate-100",
      "[&_svg]:h-4 [&_svg]:w-4 [&_svg]:flex-shrink-0",
      destructive
        ? "text-red-600 focus:bg-red-50"
        : "text-slate-700 focus:text-slate-900",
      inset && "pl-8",
      "disabled:pointer-events-none disabled:opacity-50",
      className
    )}
    {...props}
  >
    {icon && (
      <span
        className={cn(
          "flex-shrink-0 opacity-70",
          destructive ? "text-red-500" : "text-slate-500"
        )}
      >
        {icon}
      </span>
    )}
    {children}
  </DropdownMenuPrimitive.Item>
));
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center gap-2",
      "rounded-xl py-2.5 pl-8 pr-3",
      "text-sm font-medium text-slate-700",
      "outline-none transition-colors duration-100",
      "focus:bg-slate-100 focus:text-slate-900",
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-3 flex h-4 w-4 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="h-4 w-4 text-blue-600" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
));
DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName;

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center gap-2",
      "rounded-xl py-2.5 pl-8 pr-3",
      "text-sm font-medium text-slate-700",
      "outline-none transition-colors duration-100",
      "focus:bg-slate-100",
      className
    )}
    {...props}
  >
    <span className="absolute left-3 flex h-4 w-4 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="h-2.5 w-2.5 fill-blue-600 text-blue-600" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
));
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      "px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider",
      inset && "pl-8",
      className
    )}
    {...props}
  />
));
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("mx-2 my-1 h-px bg-slate-100", className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cn("ml-auto text-xs tracking-widest text-slate-400", className)}
    {...props}
  />
);
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";

/* ============================================================
   SELECT
   ============================================================ */

const SelectRoot = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

interface SelectProps extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Root> {
  label?: string;
  error?: string;
  hint?: string;
  placeholder?: string;
  containerClassName?: string;
  id?: string;
}

function Select({
  label,
  error,
  hint,
  placeholder = "Pilih opsi...",
  containerClassName,
  id,
  children,
  ...props
}: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className={cn("form-group", containerClassName)}>
      {label && (
        <label htmlFor={selectId} className="form-label">
          {label}
        </label>
      )}
      <SelectRoot {...props}>
        <SelectTrigger id={selectId} error={!!error}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </SelectRoot>
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

interface SelectTriggerProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> {
  error?: boolean;
}

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  SelectTriggerProps
>(({ className, children, error, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "input-base flex items-center justify-between gap-2",
      "cursor-pointer",
      "[&>span]:line-clamp-1 [&>span]:text-left",
      "focus:outline-none",
      error && "input-error",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 flex-shrink-0 text-slate-400 transition-transform duration-200 group-data-[state=open]:rotate-180" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronUp className="h-4 w-4 text-slate-400" />
  </SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4 text-slate-400" />
  </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 max-h-[280px] min-w-[8rem] overflow-hidden",
        "bg-white rounded-2xl border border-slate-100",
        "shadow-[var(--shadow-xl)]",
        "data-[state=open]:animate-fade-in-scale",
        "data-[state=closed]:opacity-0",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "p-1.5",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn(
      "px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider",
      className
    )}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-pointer select-none items-center",
      "rounded-xl py-2.5 pl-8 pr-3",
      "text-sm font-medium text-slate-700",
      "outline-none",
      "transition-colors duration-100",
      "focus:bg-slate-100 focus:text-slate-900",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-3 flex h-4 w-4 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4 text-blue-600" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("mx-2 my-1 h-px bg-slate-100", className)}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

/* ============================================================
   EXPORTS
   ============================================================ */

export {
  // Dialog
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
  ConfirmDialog,

  // Drawer
  Drawer,
  DrawerTrigger,
  DrawerPortal,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,

  // Tabs
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,

  // Dropdown Menu
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,

  // Select
  Select,
  SelectRoot,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};
