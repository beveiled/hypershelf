"use client";

import type { IconName } from "lucide-react/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { DynamicIcon } from "lucide-react/dynamic";

import type { Id } from "@hypershelf/convex/_generated/dataModel";
import { useHypershelf } from "@hypershelf/lib/stores";
import { cn } from "@hypershelf/lib/utils";

import { FieldForm } from "./FieldForm";

export function FieldCard({ fieldId }: { fieldId: Id<"fields"> }) {
  const editingBy = useHypershelf((state) =>
    state.fields[fieldId]?.editingBy?.id === state.viewer
      ? null
      : state.fields[fieldId]?.editingBy?.email,
  );
  const locked = useHypershelf(
    (state) => state.fields[fieldId]?.editingBy?.id === state.viewer,
  );
  const icon = useHypershelf(
    (state) => state.fields[fieldId]?.field.extra?.icon ?? "circle",
  );
  const name = useHypershelf(
    (state) => state.fields[fieldId]?.field.name ?? "",
  );
  const description = useHypershelf(
    (state) => state.fields[fieldId]?.field.extra?.description ?? "",
  );
  const isExpanded = useHypershelf(
    (state) => state.expandedFieldId === fieldId,
  );
  const setExpandedFieldId = useHypershelf((state) => state.setExpandedFieldId);

  const handleClick = () => {
    if (!isExpanded) setExpandedFieldId(fieldId);
    else if (!locked) setExpandedFieldId(null);
  };

  return (
    <motion.div
      initial={false}
      animate={{
        boxShadow: isExpanded
          ? "0 8px 32px rgba(0,0,0,0.25)"
          : "0 1px 4px rgba(0,0,0,0.10)",
      }}
      className={cn(
        "p-4 shadow-sm relative rounded-lg border bg-background transition-all",
        isExpanded && "shadow-lg",
        (editingBy ?? locked) && "border-2 border-brand",
      )}
    >
      {editingBy && (
        <div className="top-0 right-0 px-2 py-0.5 text-xs absolute -translate-y-full rounded-sm bg-brand text-background">
          <span className="font-semibold">{editingBy}</span>
        </div>
      )}
      <div
        className={cn("flex cursor-pointer items-center", {
          "cursor-not-allowed": editingBy,
        })}
        onClick={handleClick}
      >
        <span className="mr-3 text-2xl">
          <DynamicIcon name={icon as IconName} />
        </span>
        <div className="flex-1">
          <div className="font-semibold">{name}</div>
          <div className="text-sm text-muted-foreground">{description}</div>
        </div>
        <ChevronDown
          className={cn(
            "mr-2 size-4 transition-transform",
            isExpanded ? "rotate-180" : "rotate-0",
          )}
        />
      </div>
      <AnimatePresence initial={false}>
        {isExpanded && <FieldForm fieldId={fieldId} />}
      </AnimatePresence>
    </motion.div>
  );
}
