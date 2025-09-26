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
import { PopoverPortal } from "@radix-ui/react-popover";
import {
  Edge,
  EdgeLabelRenderer,
  getBezierPath,
  useInternalNode,
} from "@xyflow/react";
import { useEffect, useMemo, useRef, useState } from "react";

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
  const hitboxRef = useRef<SVGPathElement | null>(null);

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

  const baseStroke = useMemo(() => {
    const sw = style?.strokeWidth;
    return Number.isFinite(sw) ? Number(sw) : 1;
  }, [style]);

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

  const dispatchSequence = (targetEl: Element, x: number, y: number) => {
    const opts = { bubbles: true, cancelable: true, clientX: x, clientY: y };
    targetEl.dispatchEvent(new PointerEvent("pointerdown", opts));
    targetEl.dispatchEvent(new MouseEvent("mousedown", opts));
    targetEl.dispatchEvent(new PointerEvent("pointerup", opts));
    targetEl.dispatchEvent(new MouseEvent("mouseup", opts));
    targetEl.dispatchEvent(new MouseEvent("click", opts));
  };

  const onEdgeClick = (e: React.MouseEvent<SVGPathElement>) => {
    setOpen(true);
    const el = hitboxRef.current;
    if (!el) return;
    const prev = el.style.pointerEvents;
    el.style.pointerEvents = "none";
    const under = document.elementFromPoint(e.clientX, e.clientY);
    el.style.pointerEvents = prev || "stroke";
    if (under && under !== el) dispatchSequence(under, e.clientX, e.clientY);
  };

  const hasLabel =
    (Array.isArray(data?.label) && data.label.length > 0) ||
    (data?.label as string | undefined)?.trim?.();

  // TODO: Good UX

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
        <path
          ref={hitboxRef}
          d={edgePath}
          fill="none"
          stroke="transparent"
          className="cursor-pointer"
          style={{ strokeDasharray: "0" }}
          pointerEvents="stroke"
          strokeWidth={baseStroke + 8}
          onClick={onEdgeClick}
        />
      )}
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
                <div className="h-0 w-0 p-0 m-0 absolute" />
              </PopoverTrigger>
              <PopoverPortal
                container={reactFlowViewportRef.current}
                forceMount
              >
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
              </PopoverPortal>
            </Popover>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
