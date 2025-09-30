import { Button } from "@/components/ui/button";
import { useHypershelf } from "@/stores";
import { AnimatePresence, motion } from "framer-motion";
import { isEqual } from "lodash";
import { ArrowRight } from "lucide-react";
import { useStoreWithEqualityFn } from "zustand/traditional";

export function LinksList() {
  const links = useStoreWithEqualityFn(
    useHypershelf,
    state =>
      state.links
        .filter(
          link =>
            state.selectedVmNodesNetworkTopologyView[link.from] ||
            state.selectedVmNodesNetworkTopologyView[link.to],
        )
        .map(l => ({
          fromLabel: state.vms.find(v => v.id === l.from)?.hostname || l.from,
          toLabel: state.vms.find(v => v.id === l.to)?.hostname || l.to,
          ...l,
        })),
    isEqual,
  );
  const setHighlightLink = useHypershelf(state => state.setHighlightLink);
  const highlightLink = useStoreWithEqualityFn(
    useHypershelf,
    state => state.highlightLink,
    isEqual,
  );

  return (
    <AnimatePresence>
      {links.length > 0 && (
        <div className="flex gap-2 items-start">
          {highlightLink &&
            highlightLink.label &&
            (!Array.isArray(highlightLink.label) ||
              highlightLink.label.length > 0) && (
              <motion.div
                className="origin-right bg-black/10 rounded-md p-1.5 backdrop-blur-lg border border-border"
                initial={{
                  opacity: 0.4,
                  scaleX: 0.2,
                  scaleY: 0,
                  rotateX: 0,
                  rotateY: -36,
                  transformPerspective: 600,
                }}
                animate={{
                  opacity: 1,
                  scaleX: 1,
                  scaleY: 1,
                  rotateX: 0,
                  rotateY: 0,
                }}
                exit={{
                  opacity: 0.4,
                  scaleX: 0.2,
                  scaleY: 0,
                  rotateX: 0,
                  rotateY: -36,
                  transformPerspective: 600,
                  transition: {
                    type: "spring",
                    duration: 0.3,
                    bounce: 0.2,
                    opacity: { duration: 0.1 },
                    scaleX: { duration: 0.2 },
                    scaleY: { duration: 0.2 },
                  },
                }}
              >
                <div className="text-xs flex flex-col gap-0.5">
                  {Array.isArray(highlightLink.label) ? (
                    highlightLink.label.map((l, i) => <div key={i}>{l}</div>)
                  ) : (
                    <div>{highlightLink.label}</div>
                  )}
                </div>
              </motion.div>
            )}
          <motion.div
            key="links-list-overlay"
            className="flex flex-col bg-black/10 rounded-md p-1.5 backdrop-blur-lg border border-border origin-top-right"
            initial={{
              opacity: 0.4,
              scaleX: 0.2,
              scaleY: 0,
              rotateX: 36,
              rotateY: 18,
              transformPerspective: 600,
            }}
            animate={{
              opacity: 1,
              scaleX: 1,
              scaleY: 1,
              rotateX: 0,
              rotateY: 0,
            }}
            exit={{
              opacity: 0.4,
              scaleX: 0.2,
              scaleY: 0,
              rotateX: 36,
              rotateY: 18,
              transformPerspective: 600,
              transition: {
                type: "spring",
                duration: 0.3,
                bounce: 0.2,
                opacity: { duration: 0.1 },
                scaleX: { duration: 0.2 },
                scaleY: { duration: 0.2 },
              },
            }}
            transition={{
              type: "spring",
              duration: 0.3,
              bounce: 0.2,
              opacity: { duration: 0.1 },
            }}
          >
            {links.map(link => (
              <Button
                key={`l-${link.from}-${link.to}`}
                size="sm"
                variant="ghost"
                className="h-auto py-1 !px-2 justify-start text-xs"
                onMouseOver={() => setHighlightLink(link)}
                onMouseOut={() => setHighlightLink(null)}
              >
                {link.fromLabel} <ArrowRight className="size-3" />{" "}
                {link.toLabel}
              </Button>
            ))}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
