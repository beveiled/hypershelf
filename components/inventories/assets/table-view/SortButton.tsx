import { Button } from "@/components/ui/button";
import { Id } from "@/convex/_generated/dataModel";
import { useHypershelf } from "@/stores";
import { AnimatePresence, motion } from "framer-motion";

export function SortButton({
  fieldId,
  isSorted,
}: {
  fieldId: Id<"fields">;
  isSorted: "asc" | "desc" | false;
}) {
  const toggleSorting = useHypershelf(state => state.toggleSorting);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => toggleSorting(fieldId)}
      className="!size-auto !p-1"
    >
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
        className={isSorted ? "" : "opacity-50"}
      >
        <AnimatePresence>
          <motion.g key="up">
            <motion.path
              d="m21 16-4 4-4-4"
              animate={{
                opacity: 1,
                d:
                  isSorted === "desc"
                    ? "m5 12 7-7 7 7"
                    : isSorted === "asc"
                      ? "m19 12-7 7-7-7"
                      : "m21 16-4 4-4-4",
              }}
              transition={{ duration: 0.1 }}
              initial={{ opacity: 0.8 }}
              exit={{ opacity: 0 }}
            />
            <motion.path
              d="M17 20V4"
              animate={{
                opacity: 1,
                d:
                  isSorted === "desc"
                    ? "M12 19V5"
                    : isSorted === "asc"
                      ? "M12 5v14"
                      : "M17 20V4",
              }}
              transition={{ duration: 0.1 }}
              initial={{ opacity: 0.8 }}
              exit={{ opacity: 0 }}
            />
          </motion.g>
          {!isSorted && (
            <motion.g key="down">
              <motion.path
                d="m3 8 4-4 4 4"
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.1 }}
                initial={{ pathLength: 0 }}
                exit={{ pathLength: 0 }}
              />
              <motion.path
                d="M7 4v16"
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.1 }}
                initial={{ pathLength: 0 }}
                exit={{ pathLength: 0 }}
              />
            </motion.g>
          )}
        </AnimatePresence>
      </motion.svg>
    </Button>
  );
}
