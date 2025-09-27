"use client";

import {
  Popover,
  PopoverContentNoPortal,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RFNodeInternal } from "@/lib/types/flow";
import { cn } from "@/lib/utils";
import { getEdgeParams } from "@/lib/utils/flow";
import { useHypershelf } from "@/stores";
import {
  Edge,
  EdgeLabelRenderer,
  getBezierPath,
  useInternalNode,
} from "@xyflow/react";
import { motion } from "framer-motion";
import { Ellipsis } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function FloatingEdge({
  id,
  source,
  target,
  markerEnd,
  style,
  data,
}: Edge<Record<string, unknown>>) {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);
  const translucent = useHypershelf(
    state =>
      !state.selectedVmNodesNetworkTopologyView?.[source] &&
      !state.selectedVmNodesNetworkTopologyView?.[target],
  );
  const [open, setOpen] = useState(false);

  const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(
    sourceNode as RFNodeInternal,
    targetNode as RFNodeInternal,
  );

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX: sx,
    sourceY: sy,
    sourcePosition: sourcePos,
    targetPosition: targetPos,
    targetX: tx,
    targetY: ty,
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

  if (!sourceNode || !targetNode) return null;

  const hasLabel =
    (Array.isArray(data?.label) && data.label.length > 0) ||
    (data?.label as string | undefined)?.trim?.();

  return (
    <>
      <path
        id={id}
        className={cn(
          "react-flow__edge-path transition-opacity duration-200",
          translucent && "opacity-0",
        )}
        d={edgePath}
        markerEnd={markerEnd as string}
        style={{ ...style, pointerEvents: "none" }}
      />
      {hasLabel && !translucent && (
        <EdgeLabelRenderer>
          <div
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            }}
            className="absolute z-50 nodrag nopan"
          >
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <motion.button
                  className="pointer-events-auto relative size-4 rounded-md backdrop-blur-3xl flex items-center justify-center cursor-pointer"
                  onClick={() => setOpen(!open)}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", bounce: 0.3, duration: 0.3 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <svg
                    className="absolute -inset-0.5"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      className="stroke-[#55f]"
                      style={{ strokeDasharray: 5 }}
                      strokeWidth={1.5}
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                  <Ellipsis className="size-3 text-muted-foreground" />
                </motion.button>
              </PopoverTrigger>
              <PopoverContentNoPortal
                side="bottom"
                align="center"
                className="size-fit min-w-16 border-2 border-dashed border-[#55f]"
              >
                {Array.isArray(data?.label) ? (
                  data.label.map((l, i) => (
                    <div key={i} className="text-xs">
                      {l}
                    </div>
                  ))
                ) : (
                  <div className="text-xs">{data?.label as string}</div>
                )}
              </PopoverContentNoPortal>
            </Popover>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
