import { AnimatePresence, motion } from "framer-motion";

import { useHypershelf } from "@hypershelf/lib/stores";
import { Button } from "@hypershelf/ui/primitives/button";

export function ToggleHiding() {
  const hiding = useHypershelf((state) => state.hiding);
  const toggleHiding = useHypershelf((state) => state.toggleHiding);

  return (
    <Button size="sm" variant="ghost" onClick={toggleHiding}>
      <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="opacity-50"
      >
        <motion.path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
        <motion.circle cx="12" cy="12" r="3" />
        <AnimatePresence>
          {!hiding && (
            <motion.path
              d="m2 2 20 20"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              exit={{ pathLength: 0 }}
              transition={{ duration: 0.1 }}
            />
          )}
        </AnimatePresence>
      </motion.svg>
      {hiding ? "Показать скрытые поля" : "Не показывать скрытые поля"}
    </Button>
  );
}
