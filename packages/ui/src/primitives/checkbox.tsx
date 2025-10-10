"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { AnimatePresence, motion } from "framer-motion";

import { cn } from "@hypershelf/lib/utils";

function Checkbox(props: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  const { className, checked, ...rest } = props;
  const [internal, setInternal] = React.useState<boolean>(false);
  const isControlled = checked !== undefined;
  const value = isControlled ? Boolean(checked) : internal;
  const handleChange = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setInternal(next);
      props.onCheckedChange?.(next);
    },
    [isControlled, props],
  );
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      checked={value}
      onCheckedChange={handleChange}
      {...rest}
      asChild
    >
      <motion.div
        className={cn(
          "peer size-4 shadow-xs shrink-0 cursor-pointer rounded-[4px] border border-input transition-shadow outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:bg-input/30 dark:aria-invalid:ring-destructive/40 dark:data-[state=checked]:bg-primary",
          className,
        )}
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", bounce: 0.2, duration: 0.2 }}
      >
        <CheckboxPrimitive.Indicator
          data-slot="checkbox-indicator"
          className="flex items-center justify-center text-current transition-none"
          forceMount
        >
          <AnimatePresence>
            {value && (
              <motion.svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-3.5"
              >
                <motion.path
                  initial={{ pathLength: 0, pathOffset: 1 }}
                  animate={{ pathLength: 1, pathOffset: 0 }}
                  exit={{ pathLength: 0, pathOffset: 1 }}
                  transition={{ duration: 0.15 }}
                  d="M20 6 9 17l-5-5"
                />
              </motion.svg>
            )}
          </AnimatePresence>
        </CheckboxPrimitive.Indicator>
      </motion.div>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
