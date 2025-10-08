import { useOS } from "@/lib/hooks/useOS";
import { cn } from "@/lib/utils";
import { type VariantProps, cva } from "class-variance-authority";
import {
  ArrowBigUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowRightToLine,
  ArrowUp,
  Command,
  CornerDownLeft,
  Delete,
  Option,
} from "lucide-react";
import { useMemo } from "react";

const kbdVariants = cva(
  "inline-flex items-center rounded border font-medium shadow-[0_1px_2px_rgba(0,0,0,0.1)] text-muted-foreground",
  {
    variants: {
      variant: {
        light: "border-background/20",
        dark: "border-input",
        white: "border-input bg-white",
      },
      size: {
        sm: "px-1 text-[10px]",
        md: "px-1 py-0.5 text-xs",
        lg: "px-1.5 py-0.5 text-sm",
      },
    },
    defaultVariants: {
      variant: "dark",
      size: "md",
    },
  },
);

export function Kbd({
  keys,
  className,
  variant,
  size,
  ...props
}: {
  keys: string[];
} & Omit<React.HTMLAttributes<HTMLElement>, "children"> &
  VariantProps<typeof kbdVariants>) {
  const os = useOS();

  const icons = useMemo(() => {
    return {
      enter: CornerDownLeft,
      meta: os === "macos" ? Command : "Ctrl",
      option: os === "macos" ? Option : "Alt",
      backspace: Delete,
      shift: ArrowBigUp,
      tab: ArrowRightToLine,
      arrowleft: ArrowLeft,
      arrowright: ArrowRight,
      arrowdown: ArrowDown,
      arrowup: ArrowUp,
    };
  }, [os]);

  return (
    <div className="flex gap-0.5">
      {keys.map((key, index) => (
        <kbd
          key={index}
          className={cn(kbdVariants({ variant, size, className }))}
          {...props}
        >
          {(() => {
            const lowerKey = key.toLowerCase();
            if (lowerKey in icons) {
              const IconComponent = icons[lowerKey as keyof typeof icons];
              if (typeof IconComponent === "string") {
                return <span className="select-none">{IconComponent}</span>;
              }
              const iconSize = {
                sm: "0.625rem",
                md: "0.75rem",
                lg: "1rem",
              }[size || "md"];
              return (
                <IconComponent style={{ width: iconSize, height: iconSize }} />
              );
            }
            return <span className="select-none">{key}</span>;
          })()}
        </kbd>
      ))}
    </div>
  );
}
