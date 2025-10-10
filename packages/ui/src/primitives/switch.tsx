"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";

import { cn } from "@hypershelf/lib/utils";

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer w-8 shadow-xs has-[span[data-state=checked]]:bg-green-500 inline-flex h-[1.15rem] shrink-0 items-center rounded-full border border-transparent bg-input transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "size-4 data-[state=unchecked]:translate-x-0 pointer-events-none block rounded-full bg-foreground ring-0 transition-transform data-[state=checked]:translate-x-[calc(100%-2px)]",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
