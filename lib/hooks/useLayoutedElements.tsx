import { VM } from "@/lib/integrations/vsphere";
import { NodeType, RFNode, VMGroupData } from "@/lib/types/flow";
import { Node, useNodesInitialized, useReactFlow } from "@xyflow/react";
import { useEffect, useRef } from "react";

export const useLayoutedElements = (setNodes: (nodes: RFNode[]) => void) => {
  const nodesInitialized = useNodesInitialized();
  const { getNodes, getEdges, fitView } =
    useReactFlow<Node<VMGroupData | VM, NodeType>>();
  const isLayingOut = useRef(false);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!nodesInitialized) return;
    if (isLayingOut.current) return;

    isLayingOut.current = true;

    const rfNodes = getNodes();
    const groupNodes = rfNodes.filter(n => n.type === "vmGroup");
    const vmNodes = rfNodes.filter(n => n.type === "vm");

    let currentX = 0;
    let currentY = 0;
    const groupMargin = 16;
    const vmMargin = 8;
    const maxVMsPerRow = 3;

    groupNodes.forEach(group => {
      group.position = { x: currentX, y: currentY };

      const childVMs = vmNodes.filter(vm => vm.parentId === group.id);
      let vmX = vmMargin;
      let vmY = vmMargin * 2 + 22;
      let vmsInCurrentRow = 0;
      let maxRowWidth = 0;
      let fullHeight = 0;
      let maxHCurrentRow = 0;
      childVMs.forEach(vm => {
        const vmWidth = vm.measured?.width ?? 100;
        const vmHeight = vm.measured?.height ?? 100;
        if (vmsInCurrentRow >= maxVMsPerRow) {
          vmsInCurrentRow = 0;
          vmX = vmMargin;
          vmY += vmHeight + vmMargin;
          fullHeight += maxHCurrentRow + vmMargin;
          maxHCurrentRow = 0;
        }
        vm.position = { x: vmX, y: vmY };
        vmX += vmWidth + vmMargin;
        vmsInCurrentRow++;
        maxRowWidth = Math.max(maxRowWidth, vmX);
        maxHCurrentRow = Math.max(maxHCurrentRow, vmHeight);
      });

      group.width = Math.max(group.measured?.width ?? 0, maxRowWidth);
      group.height = fullHeight + maxHCurrentRow + vmMargin * 3 + 22;
      currentX += group.width + groupMargin;
      if (currentX > window.innerWidth) {
        currentX = 0;
        currentY += group.height + groupMargin;
      }
    });

    const availableWidth = Math.max(320, window.innerWidth);
    let segments: { x: number; y: number; w: number }[] = [
      { x: 0, y: 0, w: availableWidth },
    ];

    const merge = () => {
      const out: typeof segments = [];
      for (const s of segments) {
        const last = out[out.length - 1];
        if (last && last.y === s.y) last.w += s.w;
        else out.push({ ...s });
      }
      segments = out;
    };

    const firstFit = (w: number) => {
      let best = { i: -1, x: 0, y: Number.POSITIVE_INFINITY };
      for (let i = 0; i < segments.length; i++) {
        let widthLeft = w;
        const x = segments[i].x;
        let y = segments[i].y;
        let j = i;
        while (widthLeft > 0 && j < segments.length) {
          y = Math.max(y, segments[j].y);
          widthLeft -= segments[j].w;
          j++;
        }
        if (widthLeft <= 0) {
          if (y < best.y || (y === best.y && x < best.x)) best = { i, x, y };
        }
      }
      return best.i >= 0 ? best : null;
    };

    const place = (w: number, h: number) => {
      const fit = firstFit(w);
      if (!fit) {
        const y = Math.max(...segments.map(s => s.y));
        segments = [{ x: 0, y, w: availableWidth }];
        return place(w, h);
      }
      let widthToCover = w + groupMargin;
      const i = fit.i;
      const newY = fit.y + h + groupMargin;
      while (widthToCover > 0 && i < segments.length) {
        const seg = segments[i];
        if (widthToCover >= seg.w) {
          widthToCover -= seg.w;
          segments.splice(i, 1);
        } else {
          seg.x += widthToCover;
          seg.w -= widthToCover;
          widthToCover = 0;
        }
      }
      segments.splice(fit.i, 0, { x: fit.x, y: newY, w: w });
      segments.sort((a, b) => a.x - b.x);
      merge();
      return { x: fit.x, y: fit.y };
    };

    groupNodes
      .slice()
      .sort((a, b) => b.width! * b.height! - a.width! * a.height!)
      .forEach(group => {
        const w = Math.ceil(group.width ?? 200);
        const h = Math.ceil(group.height ?? 150);
        const { x, y } = place(w, h);
        group.position = { x, y };
      });

    setNodes([...groupNodes, ...vmNodes]);

    isLayingOut.current = false;
    if (!isInitialized.current) fitView({ padding: 2, minZoom: 1, maxZoom: 1 });
    isInitialized.current = true;
  }, [nodesInitialized, getNodes, getEdges, setNodes, fitView]);
};
