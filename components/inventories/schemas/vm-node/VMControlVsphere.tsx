"use client";

import { Button, IconButton } from "@/components/ui/button";
import {
  Popover,
  PopoverContentNoPortal,
  PopoverTrigger,
} from "@/components/ui/popover";
import VSphereIcon from "@/lib/icons/VSphereIcon";
import { useHypershelf } from "@/stores";
import { PopoverPortal } from "@radix-ui/react-popover";
import { Cpu, MemoryStick, MonitorCog } from "lucide-react";
import { DynamicIcon, IconName } from "lucide-react/dynamic";
import { useState } from "react";

export function VMControlVsphere({
  vmId,
  reactFlowViewportRef,
}: {
  vmId: string;
  reactFlowViewportRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [open, setOpen] = useState(false);
  const vm = useHypershelf(state => state.vms.find(v => v.id === vmId));

  if (!vm) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="flex">
          <IconButton selected={open} onClick={() => setOpen(v => !v)}>
            <VSphereIcon className="size-4" colored={open} />
          </IconButton>
        </div>
      </PopoverTrigger>
      <PopoverPortal container={reactFlowViewportRef.current} forceMount>
        <PopoverContentNoPortal className="w-fit pointer-events-auto select-auto">
          <div className="text-muted-foreground w-full flex flex-col gap-1.5 text-xs">
            <div className="mb-2 flex items-center gap-2">
              {vm.devices.map((d, idx) => (
                <div key={idx}>
                  <DynamicIcon name={d.icon as IconName} className="size-4" />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <MonitorCog className="size-4" />
              <span className="font-medium">Guest OS:</span>&nbsp;
              {vm.os}
            </div>
            <div className="flex items-center gap-1">
              <MemoryStick className="size-4" />
              <span className="font-medium">RAM:</span>&nbsp;
              {vm.ram} GiB
            </div>
            <div className="flex items-center gap-1">
              <Cpu className="size-4" />
              <span className="font-medium">vCPUs:</span>&nbsp;
              {vm.cpu} cores
            </div>
            {vm.devices
              .filter(d => d.props.length > 0)
              .map((d, idx) =>
                d.props.map((p, pidx) => (
                  <div
                    key={`${idx}-${pidx}`}
                    className="flex items-center gap-1"
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
                  className="h-auto py-1 mt-2"
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
