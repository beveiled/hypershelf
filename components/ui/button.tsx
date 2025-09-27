import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import { type VariantProps, cva } from "class-variance-authority";
import { HTMLMotionProps, motion } from "framer-motion";
import * as React from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-red-500 text-white shadow-xs hover:bg-red-500/90 focus-visible:ring-red-500/20 dark:focus-visible:ring-red-500/40 dark:bg-red-500/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
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
      initial={{ scale: 1 }}
      whileTap={{ scale: 0.98 }}
      whileHover={{ scale: 1.03 }}
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
        "group relative overflow-x-hidden cursor-pointer aspect-square transition-colors duration-200 ease-in-out text-muted-foreground hover:text-foreground outline-0 focus-visible:ring-2 focus-visible:ring-ring/50 p-1 rounded-md",
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
          "bg-brand absolute bottom-0.5 left-0 h-[1px] w-full origin-left scale-x-0 transform transition-transform duration-100",
          !selected && "group-hover:scale-x-100",
        )}
      />
    </motion.button>
  );
}

export { Button, IconButton, buttonVariants };
