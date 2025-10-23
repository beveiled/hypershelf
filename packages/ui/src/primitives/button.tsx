import type { VariantProps } from "class-variance-authority";
import type { HTMLMotionProps } from "framer-motion";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { motion } from "framer-motion";

import { cn } from "@hypershelf/lib/utils";

const buttonVariants = cva(
  "gap-2 text-sm font-medium [&_svg:not([class*='size-'])]:size-4 inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md whitespace-nowrap transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "shadow-xs bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-red-500 shadow-xs hover:bg-red-500/90 focus-visible:ring-red-500/20 dark:bg-red-500/60 dark:focus-visible:ring-red-500/40 text-foreground",
        outline:
          "shadow-xs border bg-background hover:bg-accent hover:text-accent-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "shadow-xs bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "py-1 gap-1.5 px-3 has-[>svg]:px-2.5 rounded-md",
        lg: "h-10 px-6 has-[>svg]:px-4 rounded-md",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    className?: string;
  };

function Button(props: ButtonProps) {
  const { className, variant, size, asChild, ...rest } = props;

  if (asChild) {
    return (
      <Slot
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }))}
        {...rest}
      />
    );
  }

  return (
    <motion.button
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      initial={{ translateZ: 0, transformPerspective: 1500 }}
      whileTap={{ translateZ: -50, transformPerspective: 1500 }}
      whileHover={{ translateZ: 50, transformPerspective: 1500 }}
      transition={{ type: "spring", bounce: 0.2, duration: 0.2 }}
      {...(rest as unknown as HTMLMotionProps<"button">)}
    />
  );
}

function IconButton({
  children,
  selected,
  onClick,
  className,
  ...props
}: HTMLMotionProps<"button"> & { selected: boolean; onClick: () => void } & {
  children: React.ReactNode;
}) {
  return (
    <motion.button
      className={cn(
        "group p-1 ease-in-out relative aspect-square cursor-pointer overflow-x-hidden rounded-md text-muted-foreground outline-0 transition-colors duration-200 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50",
        className,
      )}
      {...props}
      onClick={onClick}
      initial={{ scale: 1 }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: "spring", bounce: 0.3, duration: 0.3 }}
    >
      {children}
      <div
        className={cn(
          "bottom-0.5 left-0 absolute h-[1px] w-full origin-left scale-x-0 transform bg-brand transition-transform duration-100",
          !selected && "group-hover:scale-x-100",
        )}
      />
    </motion.button>
  );
}

export { Button, IconButton, buttonVariants };
