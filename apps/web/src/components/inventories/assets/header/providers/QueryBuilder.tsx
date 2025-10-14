import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ListFilter, Power, RotateCcw } from "lucide-react";

import { useHypershelf } from "@hypershelf/lib/stores";
import { cn } from "@hypershelf/lib/utils";
import { Button } from "@hypershelf/ui/primitives/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@hypershelf/ui/primitives/popover";

import { HyperQueryBuilder } from "~/components/query-builder";

export function QueryBuilder() {
  const [open, setOpen] = useState(false);
  const isFiltering = useHypershelf((s) => s.isFiltering);
  const setIsFiltering = useHypershelf((s) => s.setIsFiltering);
  const resetFilters = useHypershelf((s) => s.resetFilters);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="!p-1 !size-auto">
          <ListFilter
            className={cn("size-4", isFiltering ? "text-brand" : "opacity-50")}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="gap-1 p-2 backdrop-blur-lg z-[9999] flex max-h-[80vh] w-fit max-w-[90vw] flex-col items-start overflow-scroll text-center"
        side="bottom"
        collisionPadding={8}
        sideOffset={8}
      >
        <div className="mb-2 gap-2 flex">
          <Button
            variant="ghost"
            size="sm"
            className="px-2 py-1 h-auto"
            onClick={() => setIsFiltering(!isFiltering)}
          >
            <Power />
            {isFiltering ? "Выключить" : "Включить"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="px-2 py-1 h-auto"
            onClick={() => resetFilters()}
          >
            <RotateCcw />
            Сбросить
          </Button>
        </div>
        <AnimatePresence>
          {!isFiltering && (
            <motion.div
              className="text-xs text-red-400/60 w-full text-center"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.1 }}
            >
              Сейчас фильтры выключены
            </motion.div>
          )}
        </AnimatePresence>
        <div
          className={cn(
            "ease-in-out rounded-md transition-shadow duration-100",
            !isFiltering && "ring-red-400/60 ring-1",
          )}
        >
          <HyperQueryBuilder />
        </div>
      </PopoverContent>
    </Popover>
  );
}
