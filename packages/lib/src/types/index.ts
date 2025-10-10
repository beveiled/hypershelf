import type { Edge, InternalNode, Node } from "@xyflow/react";

import type { VM } from "@hypershelf/convex/lib/integrations/vsphere";

export type VMGroupData = { id: string; label: string };
export type NodeType = "vm" | "vmGroup";
export type RFNode = Node<VM | VMGroupData, NodeType>;
export type RFNodeInternal = InternalNode<Node<VM | VMGroupData, NodeType>>;
export type RFEdge = Edge<Record<string, unknown>>;
export type Link = { from: string; to: string; label: string | string[] };
