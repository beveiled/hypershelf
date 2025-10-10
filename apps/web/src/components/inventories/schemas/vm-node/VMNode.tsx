"use client";

import type { Node, NodeProps } from "@xyflow/react";
import { useEffect, useRef } from "react";
import { Handle, Position } from "@xyflow/react";

import type { VM } from "@hypershelf/convex/lib/integrations/vsphere";
import type { NodeType } from "@hypershelf/lib/types";
import { useHypershelf } from "@hypershelf/lib/stores";
import { cn } from "@hypershelf/lib/utils";
import { pickIcon } from "@hypershelf/ui/icons";

import { VMControlInventory } from "./VMControlInventory";
import { VMControlNetworkTopologyView } from "./VMControlNetworkTopologyView";
import { VMControlVsphere } from "./VMControlVsphere";

export function VMNode({
  data,
}: NodeProps<Node<VM & Record<string, unknown>, NodeType>>) {
  const translucent = useHypershelf(
    (state) =>
      Object.keys(state.selectedVmNodesNetworkTopologyView).length > 0 &&
      state.links.length > 0 &&
      !state.links.some(
        (link) =>
          (link.from === data.id || link.to === data.id) &&
          (state.selectedVmNodesNetworkTopologyView[link.from] ??
            state.selectedVmNodesNetworkTopologyView[link.to]),
      ),
  );
  const linksAvailable = useHypershelf((state) => state.links.length > 0);
  const invAvailable = useHypershelf(
    (state) => !!state.lookupAsset({ hostname: data.hostname, ip: data.ip }),
  );

  const reactFlowViewportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const viewport = document.querySelector(".react-flow__viewport");
    if (viewport && !reactFlowViewportRef.current) {
      reactFlowViewportRef.current = viewport as HTMLDivElement;
    }
    return () => {
      reactFlowViewportRef.current = null;
    };
  }, []);

  const GuestIcon = pickIcon(data.os);

  return (
    <div
      className={cn(
        "p-2 text-xs relative flex w-fit flex-col items-center justify-center rounded-md border whitespace-pre transition-opacity duration-200",
        translucent && "opacity-50",
      )}
    >
      <div
        className={cn(
          "top-1 right-1 h-2.5 w-2.5 absolute rounded-full border border-card",
          data.power ? "bg-green-500" : "bg-red-500",
        )}
      />
      <Handle
        type="target"
        position={Position.Top}
        style={{ visibility: "hidden" }}
      />
      <GuestIcon className="mb-1 size-6" />
      {data.hostname}
      <div className="text-xs text-muted-foreground">{data.ip}</div>
      <div className="mt-2 gap-1 flex items-center">
        <VMControlVsphere
          vmId={data.id}
          reactFlowViewportRef={reactFlowViewportRef}
        />
        {invAvailable && (
          <VMControlInventory
            hostname={data.hostname}
            ip={data.ip}
            reactFlowViewportRef={reactFlowViewportRef}
          />
        )}
        {linksAvailable && <VMControlNetworkTopologyView vmId={data.id} />}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ visibility: "hidden" }}
      />
    </div>
  );
}
