"use client";

import { IconButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useHypershelf } from "@/stores";
import { EthernetPort } from "lucide-react";

export function VMControlNetworkTopologyView({ vmId }: { vmId: string }) {
  const isSelected = useHypershelf(
    state => !!state.selectedVmNodesNetworkTopologyView[vmId],
  );
  const toggleVmNodeNetworkTopologyView = useHypershelf(
    state => state.toggleVmNodeNetworkTopologyView,
  );

  return (
    <div className="flex">
      <IconButton
        selected={isSelected}
        onClick={() => toggleVmNodeNetworkTopologyView(vmId)}
      >
        <EthernetPort className={cn("size-4", isSelected && "text-[#55f]")} />
      </IconButton>
    </div>
  );
}
