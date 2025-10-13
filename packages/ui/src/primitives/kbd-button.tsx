import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";

import type { ButtonProps } from "./button";
import { Button } from "./button";
import { Kbd } from "./kbd";

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
        <div className="gap-1.5 flex items-center">{children}</div>
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
                variant={variant === "link" ? "outline" : variant}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Button>
  );
}
