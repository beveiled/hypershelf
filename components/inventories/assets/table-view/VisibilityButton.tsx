import { Button } from "@/components/ui/button";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { useHypershelf } from "@/stores";
import { AnimatePresence, motion } from "framer-motion";

export function VisibilityButton({
  fieldId,
  isHidden,
}: {
  fieldId: Id<"fields">;
  isHidden: boolean;
}) {
  const toggleVisibility = useHypershelf(state => state.toggleVisibility);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => toggleVisibility(fieldId)}
      className={cn("!size-auto !p-1")}
    >
      <motion.div transition={{ type: "spring", bounce: 0.2, duration: 0.3 }}>
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
          className={!isHidden ? "opacity-50" : ""}
        >
          <motion.path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
          <motion.circle cx="12" cy="12" r="3" />
          <AnimatePresence>
            {!isHidden && (
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
      </motion.div>
    </Button>
  );
}
