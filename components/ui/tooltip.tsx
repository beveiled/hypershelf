"use client";

import { cn } from "@/lib/utils";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { AnimatePresence, motion } from "framer-motion";
import * as React from "react";

const TooltipOpenContext = React.createContext(false);
export const useTooltipOpen = () => React.useContext(TooltipOpenContext);

function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  );
}

function Tooltip({
  open,
  defaultOpen,
  onOpenChange,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  const [internal, setInternal] = React.useState<boolean>(defaultOpen ?? false);
  const isControlled = open !== undefined;
  const value = isControlled ? Boolean(open) : internal;
  const handleChange = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setInternal(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  return (
    <TooltipProvider>
      <TooltipOpenContext.Provider value={value}>
        <TooltipPrimitive.Root
          data-slot="tooltip"
          open={open}
          defaultOpen={defaultOpen}
          onOpenChange={handleChange}
          {...props}
        >
          {children}
        </TooltipPrimitive.Root>
      </TooltipOpenContext.Provider>
    </TooltipProvider>
  );
}

function TooltipTrigger({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

function TooltipContentNoPortal({
  className,
  align = "center",
  side = "top",
  sideOffset = 4,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  const open = useTooltipOpen();
  const intensity = 1.2;
  const initial = {
    opacity: 0.4,
    scaleX: 0.2,
    scaleY: 0,
    rotateX:
      side === "left" || side === "right"
        ? align === "start"
          ? -15 * intensity
          : align === "end"
            ? 15 * intensity
            : 0
        : side === "bottom"
          ? 30 * intensity
          : -30 * intensity,
    rotateY:
      side === "bottom" || side === "top"
        ? align === "start"
          ? -15 * intensity
          : align === "end"
            ? 15 * intensity
            : 0
        : side === "left"
          ? 30 * intensity
          : -30 * intensity,
    transformPerspective: 600,
  };
  const transition = {
    type: "spring",
    duration: 0.3,
    bounce: 0.2,
    opacity: { duration: 0.1 },
  } as const;

  return (
    <AnimatePresence>
      {open && (
        <TooltipPrimitive.Content
          data-slot="tooltip-content"
          align={align}
          side={side}
          sideOffset={sideOffset}
          forceMount
          {...props}
          asChild
        >
          <motion.div
            key="tooltip-content"
            initial={initial}
            animate={{
              opacity: 1,
              scaleX: 1,
              scaleY: 1,
              rotateX: 0,
              rotateY: 0,
            }}
            exit={{
              ...initial,
              transition: {
                ...transition,
                scaleX: { duration: 0.2 },
                scaleY: { duration: 0.2 },
              },
            }}
            transition={transition}
            style={{ willChange: "transform, opacity" }}
            className={cn(
              "text-popover-foreground bg-background/60 relative z-50 w-72 origin-(--radix-tooltip-content-transform-origin) rounded-md border p-4 shadow-md outline-hidden backdrop-blur-lg",
              className,
            )}
          >
            {children}
            <TooltipPrimitive.Arrow className="fill-background/60 z-50 size-2.5 drop-shadow-[0_1px_1px_rgba(0,0,0,0.04)]" />
          </motion.div>
        </TooltipPrimitive.Content>
      )}
    </AnimatePresence>
  );
}

function TooltipContent({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal forceMount>
      <TooltipContentNoPortal {...props} />
    </TooltipPrimitive.Portal>
  );
}

function TooltipArrow({
  className,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Arrow>) {
  return (
    <TooltipPrimitive.Arrow
      className={cn("fill-background/60", className)}
      {...props}
    />
  );
}

export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipContentNoPortal,
  TooltipProvider,
  TooltipArrow,
};
