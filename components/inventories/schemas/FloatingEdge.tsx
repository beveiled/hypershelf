import { RFNodeInternal } from "@/lib/types/flow";
import { cn } from "@/lib/utils";
import { getEdgeParams } from "@/lib/utils/flow";
import { useHypershelf } from "@/stores";
import { Edge, getBezierPath, useInternalNode } from "@xyflow/react";

export function FloatingEdge({
  id,
  source,
  target,
  markerEnd,
  style,
}: Edge<Record<string, unknown>>) {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);
  const translucent = useHypershelf(
    state =>
      !state.selectedVmNodesNetworkTopologyView?.[source] &&
      !state.selectedVmNodesNetworkTopologyView?.[target],
  );

  if (!sourceNode || !targetNode) {
    return null;
  }

  const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(
    sourceNode as RFNodeInternal,
    targetNode as RFNodeInternal,
  );

  const [edgePath] = getBezierPath({
    sourceX: sx,
    sourceY: sy,
    sourcePosition: sourcePos,
    targetPosition: targetPos,
    targetX: tx,
    targetY: ty,
  });

  return (
    <path
      id={id}
      className={cn(
        "react-flow__edge-path transition-opacity duration-200",
        translucent && "opacity-0",
      )}
      d={edgePath}
      markerEnd={markerEnd as string}
      style={style}
    />
  );
}
