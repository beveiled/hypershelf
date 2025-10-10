"use client";

import type { IconName } from "lucide-react/dynamic";
import { useState } from "react";
import { PopoverPortal } from "@radix-ui/react-popover";
import { isEqual } from "lodash";
import { Cpu, MemoryStick, MonitorCog } from "lucide-react";
import { DynamicIcon } from "lucide-react/dynamic";
import { useStoreWithEqualityFn } from "zustand/traditional";

import { useHypershelf } from "@hypershelf/lib/stores";
import { VSphereIcon } from "@hypershelf/ui/icons";
import { Button, IconButton } from "@hypershelf/ui/primitives/button";
import {
  Popover,
  PopoverContentNoPortal,
  PopoverTrigger,
} from "@hypershelf/ui/primitives/popover";

export function VMControlVsphere({
  vmId,
  reactFlowViewportRef,
}: {
  vmId: string;
  reactFlowViewportRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [open, setOpen] = useState(false);
  const vm = useStoreWithEqualityFn(
    useHypershelf,
    (state) => state.vms.find((v) => v.id === vmId),
    isEqual,
  );

  if (!vm) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="flex">
          <IconButton selected={open} onClick={() => setOpen((v) => !v)}>
            <VSphereIcon className="size-4" colored={open} />
          </IconButton>
        </div>
      </PopoverTrigger>
      <PopoverPortal container={reactFlowViewportRef.current} forceMount>
        <PopoverContentNoPortal className="pointer-events-auto w-fit select-auto">
          <div className="gap-1.5 text-xs flex w-full flex-col text-muted-foreground">
            <div className="mb-2 gap-2 flex items-center">
              {vm.devices.map((d, idx) => (
                <div key={idx}>
                  <DynamicIcon name={d.icon as IconName} className="size-4" />
                </div>
              ))}
            </div>
            <div className="gap-1 flex items-center">
              <MonitorCog className="size-4" />
              <span className="font-medium">Guest OS:</span>&nbsp;
              {vm.os}
            </div>
            <div className="gap-1 flex items-center">
              <MemoryStick className="size-4" />
              <span className="font-medium">RAM:</span>&nbsp;
              {vm.ram} GiB
            </div>
            <div className="gap-1 flex items-center">
              <Cpu className="size-4" />
              <span className="font-medium">vCPUs:</span>&nbsp;
              {vm.cpu} cores
            </div>
            {vm.devices
              .filter((d) => d.props.length > 0)
              .map((d, idx) =>
                d.props.map((p, pidx) => (
                  <div
                    key={`${idx}-${pidx}`}
                    className="gap-1 flex items-center"
                  >
                    <DynamicIcon name={d.icon as IconName} className="size-4" />
                    <span className="font-medium">{p.label}:</span>&nbsp;
                    {p.value}
                  </div>
                )),
              )}
            {vm.vsphereUrl && (
              <a href={vm.vsphereUrl} target="_blank" rel="noreferrer">
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 py-1 h-auto"
                >
                  <VSphereIcon colored={true} />
                  Открыть в vSphere
                </Button>
              </a>
            )}
          </div>
        </PopoverContentNoPortal>
      </PopoverPortal>
    </Popover>
  );
}
