"use client";

import type { Node, NodeProps } from "@xyflow/react";

import type { NodeType, VMGroupData } from "@hypershelf/lib/types";
import { useHypershelf } from "@hypershelf/lib/stores";
import { cn } from "@hypershelf/lib/utils";

export function VMGroupNode({ data }: NodeProps<Node<VMGroupData, NodeType>>) {
  const translucent = useHypershelf((state) => {
    return (
      Object.keys(state.selectedVmNodesNetworkTopologyView).length > 0 &&
      state.links.length > 0 &&
      !state.links.some((link) =>
        state.vms
          .filter((vm) => vm.parent === data.id)
          .some(
            (vm) =>
              (link.from === vm.id || link.to === vm.id) &&
              (state.selectedVmNodesNetworkTopologyView[link.from] ??
                state.selectedVmNodesNetworkTopologyView[link.to]),
          ),
      )
    );
  });

  return (
    <div className="p-2 pt-1 text-xs flex h-full w-full cursor-default flex-col rounded-lg border border-border bg-card">
      <div
        className={cn(
          "mb-2 text-base font-medium text-center whitespace-pre",
          translucent && "opacity-50",
        )}
      >
        {data.label}
      </div>
    </div>
  );
}
