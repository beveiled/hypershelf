/*
https://github.com/beveiled/hypershelf
Copyright (C) 2025  Daniil Gazizullin

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/
"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

const PopoverOpenContext = React.createContext(false);
export const usePopoverOpen = () => React.useContext(PopoverOpenContext);

function Popover({
  open,
  defaultOpen,
  onOpenChange,
  children,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  const [internal, setInternal] = React.useState<boolean>(defaultOpen ?? false);
  const isControlled = open !== undefined;
  const value = isControlled ? Boolean(open) : internal;
  const handleChange = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setInternal(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange]
  );

  return (
    <PopoverOpenContext.Provider value={value}>
      <PopoverPrimitive.Root
        open={open}
        defaultOpen={defaultOpen}
        onOpenChange={handleChange}
        {...props}
        data-slot="popover"
      >
        {children}
      </PopoverPrimitive.Root>
    </PopoverOpenContext.Provider>
  );
}

function PopoverTrigger({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

function PopoverContent({
  className,
  align = "center",
  side = "bottom",
  sideOffset = 4,
  children,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  const open = usePopoverOpen();
  const intensity = 1.2;
  const initial = {
    opacity: 0.4,
    scaleX: 0,
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
    transformPerspective: 600
  };

  return (
    <PopoverPrimitive.Portal forceMount>
      <AnimatePresence>
        {open && (
          <PopoverPrimitive.Content
            data-slot="popover-content"
            align={align}
            sideOffset={sideOffset}
            side={side}
            {...props}
            asChild
          >
            <motion.div
              key="select-content"
              initial={initial}
              animate={{
                opacity: 1,
                scaleX: 1,
                scaleY: 1,
                rotateX: 0,
                rotateY: 0,
                transformPerspective: 600
              }}
              exit={{
                ...initial,
                transition: {
                  scaleX: { duration: 0.2 },
                  scaleY: { duration: 0.2 }
                }
              }}
              transition={{
                type: "spring",
                duration: 0.3,
                bounce: 0.2,
                rotateX: { duration: 0.3 },
                rotateY: { duration: 0.3 }
              }}
              style={{ willChange: "transform, opacity" }}
              className={cn(
                "text-popover-foreground bg-background/60 z-50 w-72 origin-(--radix-popover-content-transform-origin) rounded-md border p-4 shadow-md outline-hidden backdrop-blur-lg",
                className
              )}
            >
              {children}
            </motion.div>
          </PopoverPrimitive.Content>
        )}
      </AnimatePresence>
    </PopoverPrimitive.Portal>
  );
}

function PopoverAnchor({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />;
}

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor };
