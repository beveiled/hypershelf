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
import { Button } from "@/components/ui/button";
import { TableHead } from "@/components/ui/table";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { useHypershelf } from "@/stores/assets";
import { useSortable } from "@dnd-kit/sortable";
import { AnimatePresence, motion, Transition } from "framer-motion";
import { Ellipsis, GripVertical, X } from "lucide-react";
import { DynamicIcon, IconName } from "lucide-react/dynamic";
import { useMemo, useState } from "react";
import { shallow } from "zustand/shallow";
import { useStoreWithEqualityFn } from "zustand/traditional";
import { SortButton } from "./SortButton";
import { VisibilityButton } from "./VisibilityButton";

const TRANSITION = { type: "spring", bounce: 0.2, duration: 0.3 } as Transition;

export function HeaderCell({ fieldId }: { fieldId: Id<"fields"> }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: fieldId });
  const style = {
    transform: `translate3d(${transform?.x ?? 0}px, ${transform?.y ?? 0}px, 0)`,
    transition
  };
  const fieldInfo = useStoreWithEqualityFn(
    useHypershelf,
    state => {
      const field = state.fields?.[fieldId];
      if (!field) return null;
      return {
        type: field.type,
        name: field.name,
        icon: field.extra?.icon
      };
    },
    shallow
  );
  const canSort = useMemo(() => {
    return (
      fieldInfo?.type &&
      [
        "string",
        "number",
        "boolean",
        "select",
        "url",
        "ip",
        "user",
        "date",
        "email"
      ].includes(fieldInfo?.type)
    );
  }, [fieldInfo?.type]);
  const [actionsExpanded, setActionsExpanded] = useState(false);
  const isSorted = useHypershelf(state => state.sorting?.[fieldId]);
  const isHidden = useHypershelf(state => state.hiddenFields.includes(fieldId));

  if (!fieldInfo) return null;

  return (
    <TableHead ref={setNodeRef} style={style} className="!h-auto !border-0">
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-1 px-2">
          <div
            className={cn("flex items-center gap-1", isHidden && "opacity-50")}
          >
            {fieldInfo.icon && (
              <DynamicIcon
                name={fieldInfo.icon as IconName}
                className="mr-1 size-4 opacity-50"
              />
            )}
            {fieldInfo.name}
          </div>
          <div className="flex items-center">
            <AnimatePresence>
              {(isSorted || (canSort && actionsExpanded)) && (
                <motion.div
                  initial={{ opacity: 0, x: 20, width: 0 }}
                  animate={{ opacity: 1, x: 0, width: "auto" }}
                  exit={{ opacity: 0, x: 20, width: 0 }}
                  transition={TRANSITION}
                  className="overflow-hidden"
                >
                  <SortButton fieldId={fieldId} isSorted={isSorted} />
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {(isHidden || actionsExpanded) && (
                <motion.div
                  initial={{ opacity: 0, x: 20, width: 0 }}
                  animate={{ opacity: 1, x: 0, width: "auto" }}
                  exit={{ opacity: 0, x: 20, width: 0 }}
                  transition={TRANSITION}
                  className="overflow-hidden"
                >
                  <VisibilityButton fieldId={fieldId} isHidden={isHidden} />
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {actionsExpanded && (
                <motion.div
                  initial={{ opacity: 0, x: 20, width: 0 }}
                  animate={{ opacity: 1, x: 0, width: "auto" }}
                  exit={{ opacity: 0, x: 20, width: 0 }}
                  transition={TRANSITION}
                  className="overflow-hidden"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="!size-auto cursor-grab !p-1 active:cursor-grabbing"
                    {...attributes}
                    {...listeners}
                  >
                    <GripVertical className="size-4 opacity-50" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
            <motion.div transition={TRANSITION}>
              <Button
                variant="ghost"
                size="sm"
                className="!size-auto !p-1"
                onClick={() => setActionsExpanded(!actionsExpanded)}
              >
                <motion.div transition={TRANSITION}>
                  {actionsExpanded ? (
                    <X className="size-4 opacity-50" />
                  ) : (
                    <Ellipsis className="size-4 opacity-50" />
                  )}
                </motion.div>
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </TableHead>
  );
}
