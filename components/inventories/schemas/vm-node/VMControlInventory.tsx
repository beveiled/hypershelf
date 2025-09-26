"use client";

import { FieldRenderer } from "@/components/inventories/assets/table-view/FieldRenderer";
import { IconButton } from "@/components/ui/button";
import {
  Popover,
  PopoverContentNoPortal,
  PopoverTrigger,
} from "@/components/ui/popover";
import HypershelfIcon from "@/lib/icons/HypershelfIcon";
import { cn, shallowPositional } from "@/lib/utils";
import { useHypershelf } from "@/stores";
import { PopoverPortal } from "@radix-ui/react-popover";
import { DynamicIcon, IconName } from "lucide-react/dynamic";
import { useState } from "react";
import { useShallow } from "zustand/shallow";
import { useStoreWithEqualityFn } from "zustand/traditional";

export function VMControlInventory({
  hostname,
  reactFlowViewportRef,
}: {
  hostname: string;
  reactFlowViewportRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [open, isOpen] = useState(false);
  const invNode = useHypershelf(
    useShallow(state => {
      // TODO: segregate fields with magic types
      const hostnameField = Object.values(state.fields).find(
        f => f.field.name.toLowerCase() === "hostname",
      );
      if (!hostnameField?.field?._id) return null;
      const asset = Object.values(state.assets).find(
        a => a.asset.metadata?.[hostnameField.field._id] === hostname,
      );
      return asset;
    }),
  );
  const fields = useStoreWithEqualityFn(
    useHypershelf,
    state =>
      Object.values(state.fields).map(f => ({
        id: f.field._id,
        name: f.field.name,
        icon: f.field.extra?.icon ?? "circle",
      })),
    shallowPositional,
  );

  return (
    <Popover open={open} onOpenChange={isOpen}>
      <PopoverTrigger asChild>
        <div className="flex">
          <IconButton selected={open} onClick={() => {}}>
            <HypershelfIcon className={cn("size-4", open && "text-brand")} />
          </IconButton>
        </div>
      </PopoverTrigger>
      <PopoverPortal container={reactFlowViewportRef.current} forceMount>
        <PopoverContentNoPortal className="min-w-64 w-fit max-w-xl pointer-events-auto select-auto">
          {invNode && (
            <div className="text-muted-foreground w-full flex flex-col gap-1.5 text-xs">
              {fields.map(field => {
                if (!invNode.asset.metadata) return null;
                const value = invNode.asset.metadata[field.id];
                if (!value) return null;
                return (
                  <div key={field.id} className="flex items-center gap-1.5">
                    <div className="flex items-center gap-1">
                      <DynamicIcon
                        name={field.icon as IconName}
                        className="size-4"
                      />
                      <span className="font-medium whitespace-pre">
                        {field.name}:
                      </span>
                    </div>
                    <FieldRenderer
                      assetId={invNode.asset._id}
                      fieldId={field.id}
                      readonly={true}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </PopoverContentNoPortal>
      </PopoverPortal>
    </Popover>
  );
}
