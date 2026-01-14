import { Connection, Node } from "@/generated/prisma";
import toposort from "toposort";
import { inngest } from "./client";
import { createId } from "@paralleldrive/cuid2";

export const topologicalSort = (
  nodes: Node[],
  connections: Connection[],
): Node[] => {
  // If no connections, return node as-is (they're all independent)
  if (connections.length === 0) {
    return nodes;
  }

  // Create edges array for toposort
  const edges: [string, string][] = connections.map((conn) => [
    conn.fromNodeId,
    conn.toNodeId,
  ]);

  // Add nodes with no connections as self-edges to ensure they're included
  const connectedNodeIds = new Set<string>();
  for (const conn of connections) {
    connectedNodeIds.add(conn.fromNodeId);
    connectedNodeIds.add(conn.toNodeId);
  }

  for (const node of nodes) {
    if (!connectedNodeIds.has(node.id)) {
      edges.push([node.id, node.id]);
    }
  }

  // Perform topological sort
  let sortedNodeIds: string[];
  try {
    sortedNodeIds = toposort(edges);
    // Remove duplicates (from self-edges)
    sortedNodeIds = [...new Set(sortedNodeIds)];
  } catch (error) {
    if (error instanceof Error && error.message.includes("Cyclic")) {
      throw new Error("Workflow contains a cycle");
    }
    throw error;
  }

  // Map sorted IDs back to node objects
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  return sortedNodeIds.map((id) => nodeMap.get(id)!).filter(Boolean);
};

export const getExecutionLevels = (
  nodes: Node[],
  connections: Connection[],
): Node[][] => {
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  for (const node of nodes) {
    inDegree.set(node.id, 0);
    adj.set(node.id, []);
  }

  for (const conn of connections) {
    inDegree.set(conn.toNodeId, (inDegree.get(conn.toNodeId) || 0) + 1);
    adj.get(conn.fromNodeId)?.push(conn.toNodeId);
  }

  const levels: Node[][] = [];
  let currentLevelIds = Array.from(inDegree.keys()).filter(
    (id) => inDegree.get(id) === 0,
  );

  while (currentLevelIds.length > 0) {
    const currentNodes = currentLevelIds
      .map((id) => nodes.find((n) => n.id === id)!)
      .filter(Boolean);
    levels.push(currentNodes);

    const nextLevelIds: string[] = [];
    for (const id of currentLevelIds) {
      for (const neighborId of adj.get(id) || []) {
        inDegree.set(neighborId, inDegree.get(neighborId)! - 1);
        if (inDegree.get(neighborId) === 0) {
          nextLevelIds.push(neighborId);
        }
      }
    }
    currentLevelIds = nextLevelIds;
  }

  if (levels.flat().length < nodes.length) {
    throw new Error("Workflow contains a cycle");
  }

  return levels;
};

export const getDownstreamNodeIds = (
  nodeId: string,
  connections: Connection[]
): string[] => {
  const downstream = new Set<string>();
  const queue = [nodeId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const children = connections
      .filter((c) => c.fromNodeId === currentId)
      .map((c) => c.toNodeId);

    for (const childId of children) {
      if (!downstream.has(childId)) {
        downstream.add(childId);
        queue.push(childId);
      }
    }
  }

  return Array.from(downstream);
};

export const sendWorkflowExecution = async (data: {
  workflowId: string;
  [key: string]: any;
}) => {
  return inngest.send({
    name: "workflows/execute.workflow",
    data,
    id: createId(),
  });
};

