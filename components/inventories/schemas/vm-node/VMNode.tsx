"use client";

import { pickIcon } from "@/lib/icons/oses/pick";
import { VM } from "@/lib/integrations/vsphere";
import { NodeType } from "@/lib/types/flow";
import { cn } from "@/lib/utils";
import { useHypershelf } from "@/stores";
import { VMControlInventory } from "./VMControlInventory";
import { VMControlNetworkTopologyView } from "./VMControlNetworkTopologyView";
import { VMControlVsphere } from "./VMControlVsphere";
import { Handle, Node, NodeProps, Position } from "@xyflow/react";
import { useEffect, useRef } from "react";

export function VMNode({ data }: NodeProps<Node<VM, NodeType>>) {
  const translucent = useHypershelf(
    state =>
      Object.keys(state.selectedVmNodesNetworkTopologyView).length > 0 &&
      state.links.length > 0 &&
      !state.links.some(
        link =>
          (link.from === data.id || link.to === data.id) &&
          (state.selectedVmNodesNetworkTopologyView?.[link.from] ||
            state.selectedVmNodesNetworkTopologyView?.[link.to]),
      ),
  );
  const linksAvailable = useHypershelf(state => state.links.length > 0);
  const invAvailable = useHypershelf(state => {
    const hostnameField = Object.values(state.fields).find(
      f => f.field.name.toLowerCase() === "hostname",
    );
    if (!hostnameField?.field?._id) return null;
    return Object.values(state.assets).some(
      a => a.asset.metadata?.[hostnameField.field._id] === data.hostname,
    );
  });

  const reactFlowViewportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const viewport = document.querySelector(
      ".react-flow__viewport",
    ) as HTMLDivElement | null;
    if (viewport && !reactFlowViewportRef.current) {
      reactFlowViewportRef.current = viewport;
    }
    return () => {
      reactFlowViewportRef.current = null;
    };
  }, []);

  const GuestIcon = pickIcon(data.os);

  return (
    <div
      className={cn(
        "flex w-fit p-2 flex-col items-center justify-center text-xs whitespace-pre rounded-md border transition-opacity duration-200 relative",
        translucent && "opacity-50",
      )}
    >
      <div
        className={cn(
          "absolute top-1 right-1 w-2 h-2 rounded-full border border-card",
          data.power ? "bg-green-500" : "bg-red-500",
        )}
      />
      <Handle
        type="target"
        position={Position.Top}
        style={{ visibility: "hidden" }}
      />
      <GuestIcon className="size-6 mb-1" />
      {data.hostname}
      <div className="text-xs text-muted-foreground">{data.ip}</div>
      <div className="mt-2 flex items-center gap-2">
        <VMControlVsphere
          vmId={data.id}
          reactFlowViewportRef={reactFlowViewportRef}
        />
        {invAvailable && (
          <VMControlInventory
            hostname={data.hostname}
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
