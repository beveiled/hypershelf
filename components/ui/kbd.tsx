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
import { useOS } from "@/lib/useOS";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import {
  ArrowBigUp,
  ArrowRightToLine,
  Command,
  CornerDownLeft,
  Delete,
  Option
} from "lucide-react";
import { useMemo } from "react";

const kbdVariants = cva(
  "inline-flex items-center rounded border font-mono font-medium shadow-[0_1px_2px_rgba(0,0,0,0.1)] text-muted-foreground",
  {
    variants: {
      variant: {
        light: "border-background/20",
        dark: "border-input",
        white: "border-input bg-white"
      },
      size: {
        sm: "px-1 text-[10px]",
        md: "px-1 py-0.5 text-xs",
        lg: "px-1.5 py-0.5 text-sm"
      }
    },
    defaultVariants: {
      variant: "dark",
      size: "md"
    }
  }
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
      tab: ArrowRightToLine
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
                lg: "1rem"
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
