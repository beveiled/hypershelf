import type { VariantProps } from "class-variance-authority";
import * as React from "react";
import { cva } from "class-variance-authority";

import { cn } from "@hypershelf/lib/utils";

const alertVariants = cva(
  "gap-y-0.5 px-4 py-3 text-sm has-[>svg]:gap-x-3 [&>svg]:size-4 [&>svg]:translate-y-0.5 relative grid w-full grid-cols-[0_1fr] items-start rounded-lg border has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] [&>svg]:text-current",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        destructive:
          "bg-card text-destructive *:data-[slot=alert-description]:text-destructive/90 [&>svg]:text-current",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "min-h-4 font-medium tracking-tight col-start-2 line-clamp-1",
        className,
      )}
      {...props}
    />
  );
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "gap-1 text-sm [&_p]:leading-relaxed col-start-2 grid justify-items-start text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription };
