import { VM } from "@/convex/lib/integrations/vsphere";
import { Edge, InternalNode, Node } from "@xyflow/react";

export type VMGroupData = { id: string; label: string };
export type NodeType = "vm" | "vmGroup";
export type RFNode = Node<VM | VMGroupData, NodeType>;
export type RFNodeInternal = InternalNode<Node<VM | VMGroupData, NodeType>>;
export type RFEdge = Edge<Record<string, unknown>>;
export type Link = { from: string; to: string; label: string | string[] };
