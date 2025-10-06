import { HyperQueryBuilder } from "@/components/query-builder";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useHypershelf } from "@/stores";
import { AnimatePresence, motion } from "framer-motion";
import { ListFilter, Power, RotateCcw } from "lucide-react";
import { useState } from "react";

export function QueryBuilder() {
  const [open, setOpen] = useState(false);
  const isFiltering = useHypershelf(s => s.isFiltering);
  const setIsFiltering = useHypershelf(s => s.setIsFiltering);
  const resetFilters = useHypershelf(s => s.resetFilters);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="!size-auto !p-1">
          <ListFilter className="size-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="z-[9999] flex w-fit max-w-xl text-center flex-col items-start gap-1 p-2 backdrop-blur-lg max-h-[80vh] overflow-y-scroll"
        side="bottom"
        collisionPadding={8}
        sideOffset={8}
      >
        <div className="flex gap-2 mb-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-auto py-1 px-2"
            onClick={() => setIsFiltering(!isFiltering)}
          >
            <Power />
            {isFiltering ? "Выключить" : "Включить"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-auto py-1 px-2"
            onClick={() => resetFilters()}
          >
            <RotateCcw />
            Сбросить
          </Button>
        </div>
        <AnimatePresence>
          {!isFiltering && (
            <motion.div
              className="text-xs text-red-400/60 text-center w-full"
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
            "rounded-md transition-shadow duration-100 ease-in-out",
            !isFiltering && "ring-1 ring-red-400/60",
          )}
        >
          <HyperQueryBuilder />
        </div>
      </PopoverContent>
    </Popover>
  );
}
