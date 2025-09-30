"use client";

import { NodeType, VMGroupData } from "@/lib/types/flow";
import { cn } from "@/lib/utils";
import { useHypershelf } from "@/stores";
import { Node, NodeProps } from "@xyflow/react";

export function VMGroupNode({ data }: NodeProps<Node<VMGroupData, NodeType>>) {
  const translucent = useHypershelf(state => {
    return (
      Object.keys(state.selectedVmNodesNetworkTopologyView).length > 0 &&
      state.links.length > 0 &&
      !state.links.some(link =>
        state.vms
          .filter(vm => vm.parent === data.id)
          .some(
            vm =>
              (link.from === vm.id || link.to === vm.id) &&
              (state.selectedVmNodesNetworkTopologyView?.[link.from] ||
                state.selectedVmNodesNetworkTopologyView?.[link.to]),
          ),
      )
    );
  });

  return (
    <div className="flex w-full h-full p-2 pt-1 flex-col rounded-lg border border-border bg-card text-xs cursor-default">
      <div
        className={cn(
          "mb-2 font-medium text-base text-center whitespace-pre",
          translucent && "opacity-50",
        )}
      >
        {data.label}
      </div>
    </div>
  );
}
