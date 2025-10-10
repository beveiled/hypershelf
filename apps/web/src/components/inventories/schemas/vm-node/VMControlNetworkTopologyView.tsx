"use client";

import { EthernetPort } from "lucide-react";

import { useHypershelf } from "@hypershelf/lib/stores";
import { cn } from "@hypershelf/lib/utils";
import { IconButton } from "@hypershelf/ui/primitives/button";

export function VMControlNetworkTopologyView({ vmId }: { vmId: string }) {
  const isSelected = useHypershelf(
    (state) => !!state.selectedVmNodesNetworkTopologyView[vmId],
  );
  const toggleVmNodeNetworkTopologyView = useHypershelf(
    (state) => state.toggleVmNodeNetworkTopologyView,
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
