"use client";

import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { useHypershelf } from "@/stores";
import { FieldForm } from "./FieldForm";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { DynamicIcon, IconName } from "lucide-react/dynamic";

export function FieldCard({ fieldId }: { fieldId: Id<"fields"> }) {
  const editingBy = useHypershelf(state =>
    state.fields[fieldId]?.editingBy?.id === state.viewer
      ? null
      : state.fields[fieldId]?.editingBy?.email,
  );
  const locked = useHypershelf(
    state => state.fields[fieldId]?.editingBy?.id === state.viewer,
  );
  const icon = useHypershelf(
    state => state.fields?.[fieldId]?.field?.extra?.icon || "circle",
  );
  const name = useHypershelf(
    state => state.fields?.[fieldId]?.field?.name || "",
  );
  const description = useHypershelf(
    state => state.fields?.[fieldId]?.field?.extra?.description || "",
  );
  const isExpanded = useHypershelf(state => state.expandedFieldId === fieldId);
  const setExpandedFieldId = useHypershelf(state => state.setExpandedFieldId);

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
        "bg-background relative rounded-lg border p-4 shadow-sm transition-all",
        isExpanded && "shadow-lg",
        (editingBy || locked) && "border-brand border-2",
      )}
    >
      {editingBy && (
        <div className="bg-brand text-background absolute top-0 right-0 -translate-y-full rounded-sm px-2 py-0.5 text-xs">
          <span className="font-semibold">{editingBy}</span>
        </div>
      )}
      <div
        className={cn("flex items-center cursor-pointer", {
          "cursor-not-allowed": editingBy,
        })}
        onClick={handleClick}
      >
        <span className="mr-3 text-2xl">
          <DynamicIcon name={icon as IconName} />
        </span>
        <div className="flex-1">
          <div className="font-semibold">{name}</div>
          <div className="text-muted-foreground text-sm">{description}</div>
        </div>
        <ChevronDown
          className={cn(
            "transition-transform size-4 mr-2",
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
