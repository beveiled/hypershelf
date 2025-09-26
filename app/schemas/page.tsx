"use client";

import { FloatingEdge } from "@/components/inventories/schemas/FloatingEdge";
import { FolderPickerGuide } from "@/components/inventories/schemas/FolderPickerGuide";
import { Header } from "@/components/inventories/schemas/Header";
import { Overlay } from "@/components/inventories/schemas/Overlay";
import { SuspenseSkeleton } from "@/components/inventories/schemas/SuspenseSkeleton";
import { VMGroupNode } from "@/components/inventories/schemas/VMGroupNode";
import { VMNode } from "@/components/inventories/schemas/vm-node";
import { useHeaderContent } from "@/components/util/HeaderContext";
import { useLayoutedElements } from "@/lib/hooks/useLayoutedElements";
import { Router, VM } from "@/lib/integrations/vsphere";
import { RFEdge, RFNode } from "@/lib/types/flow";
import { useHypershelf } from "@/stores";
import { api } from "@/trpc/react";
import {
  Position,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";

const nodeTypes = {
  vm: VMNode,
  vmGroup: VMGroupNode,
};

function Schemas({ topology }: { topology: { routers: Router[]; vms: VM[] } }) {
  const links = useHypershelf(state => state.links);
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: RFNode[] = [];
    const byParent: Record<string, VM[]> = {};
    topology.vms.forEach(vm => {
      const p = vm.parent ?? "ungrouped";
      if (!byParent[p]) byParent[p] = [];
      byParent[p].push(vm);
    });

    Object.entries(byParent).forEach(([parentId], i) => {
      const groupId = `${parentId}-group-${i}`;
      const path: string[] = [];
      let currentId: string | null = parentId;
      const visited = new Set<string>();
      while (currentId && !visited.has(currentId)) {
        visited.add(currentId);
        const router = topology.routers.find(r => r.id === currentId);
        if (router) {
          path.unshift(router.name);
          currentId = router.parent;
        } else {
          break;
        }
      }
      const label =
        path.length === 1
          ? path[0]!
          : path.length > 1
            ? path.slice(1).join(" → ")
            : "VMs";
      nodes.push({
        id: groupId,
        type: "vmGroup",
        data: { id: parentId, label: parentId === "ungrouped" ? "VMs" : label },
        position: { x: 0, y: 0 },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      });
      byParent[parentId].forEach(vm => {
        nodes.push({
          id: vm.id,
          type: "vm",
          data: vm,
          parentId: groupId,
          expandParent: true,
          position: { x: 0, y: 0 },
        });
      });
    });

    return { initialNodes: nodes, initialEdges: [] };
  }, [topology]);

  const [nodes, setNodes, onNodesChange] = useNodesState<RFNode>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<RFEdge>(initialEdges);

  useLayoutedElements(setNodes);

  useEffect(() => {
    setEdges(
      links.map((link, i) => ({
        id: `e${link.from}-${link.to}-${i}`,
        source: link.from,
        target: link.to,
        type: "floating",
        style: { stroke: "#55f", strokeWidth: 1.5 },
        markerEnd: { type: "arrow", color: "#55f" },
        animated: true,
      })),
    );
  }, [links, setEdges]);

  return createPortal(
    <div className="absolute h-screen w-screen inset-0">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        panOnScroll={true}
        zoomOnScroll={false}
        panOnDrag={false}
        nodesDraggable={false}
        nodesFocusable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        zoomOnDoubleClick={false}
        edgeTypes={{ floating: FloatingEdge }}
      />
    </div>,
    document.body,
  );
}

export default function SchemasPage() {
  const rootMoid = useHypershelf(state => state.rootMoid);

  const { data: topology, error } = api.vsphere.fetchTopology.useQuery(
    { rootMoid: rootMoid! },
    { refetchOnWindowFocus: false, retry: false, enabled: !!rootMoid },
  );
  const { data: networkTopology, error: networkError } =
    api.vsphere.fetchNetworkTopology.useQuery(undefined, {
      refetchOnWindowFocus: false,
      retry: false,
      enabled: !!rootMoid && !!topology,
    });
  const { data: folderTree } = api.vsphere.fetchTopologyStructure.useQuery(
    undefined,
    { refetchOnWindowFocus: false, retry: false },
  );

  const updateTopology = useHypershelf(state => state.updateTopology);
  const updateNetworkTopology = useHypershelf(
    state => state.updateNetworkTopology,
  );
  const setFolderTree = useHypershelf(state => state.setFolderTree);

  useEffect(() => {
    if (!topology) return;
    updateTopology(topology);
  }, [updateTopology, topology]);

  useEffect(() => {
    if (!networkTopology) return;
    updateNetworkTopology(networkTopology);
  }, [updateNetworkTopology, networkTopology]);

  useEffect(() => {
    if (!folderTree) return;
    setFolderTree(folderTree.structure);
  }, [setFolderTree, folderTree]);

  const { setContent: setHeaderContent } = useHeaderContent();

  useEffect(() => {
    setHeaderContent(<Header />);
  }, [setHeaderContent]);

  if (!rootMoid) {
    return (
      <div>
        <Overlay />
        <FolderPickerGuide />
      </div>
    );
  }

  if (!topology) {
    return <SuspenseSkeleton error={!!error || !!networkError} />;
  }

  return (
    <ReactFlowProvider>
      <Overlay />
      <Schemas topology={topology} />
      <style>{`
        .react-flow__edges svg {
          z-index: 2 !important;
        }

        .react-flow__node {
          user-select: initial !important;
          pointer-events: auto !important;
        }

        /*
          Since we do not pay for React Flow Pro, to avoid licensing issues, but
          still make it look decent...
        */
        .react-flow__attribution {
          background: transparent !important;
          color: var(--muted-foreground) !important;
          border: 1px solid var(--border) !important;
          border-radius: 0.375rem !important;
          bottom: 0.5rem !important;
          right: 0.5rem !important;
          padding: 0.125rem 0.25rem !important;
          backdrop-filter: blur(4px) !important;
        }
      `}</style>
    </ReactFlowProvider>
  );
}
