import { Button, ButtonProps } from "./button";
import { Kbd } from "./kbd";
import { AnimatePresence, motion } from "framer-motion";
import { ReactNode, useMemo } from "react";

export function ButtonWithKbd(
  props: ButtonProps & {
    showKbd?: boolean;
    keys: string[];
    kbdSize?: "sm" | "md" | "lg";
  },
) {
  const { variant, children, showKbd = true, keys, kbdSize, ...rest } = props;
  const uniqueId = useMemo(() => Math.random().toString(36).slice(2, 11), []);

  return (
    <Button variant={variant} {...rest}>
      <div className="flex items-center">
        <div className="flex items-center gap-1.5">{children as ReactNode}</div>
        <AnimatePresence initial={false}>
          {showKbd && (
            <motion.div
              key={uniqueId}
              initial={{ width: 0, marginLeft: 0 }}
              animate={{ width: "auto", marginLeft: "0.5rem" }}
              exit={{ width: 0, marginLeft: 0 }}
              className="overflow-hidden"
              transition={{ duration: 0.1 }}
            >
              <Kbd
                keys={keys}
                size={kbdSize}
                variant={
                  variant === "outline" ||
                  variant === "ghost" ||
                  variant === "secondary"
                    ? "dark"
                    : variant === "destructive"
                      ? "white"
                      : "light"
                }
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Button>
  );
}
