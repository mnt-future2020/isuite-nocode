"use client";

import { useMemo } from "react";
import { useReactFlow } from "@xyflow/react";

export interface NodeOutputData {
    nodeId: string;
    nodeName: string;
    variableName: string;
    nodeType: string;
    output: any; // Actual execution output data
}

export const useNodeInputData = (currentNodeId?: string): NodeOutputData[] => {
    const { getNodes, getEdges } = useReactFlow();

    return useMemo(() => {
        if (!currentNodeId) return [];

        const nodes = getNodes();
        const edges = getEdges();

        // Find all nodes that come before the current node (upstream nodes)
        const upstreamNodeIds = new Set<string>();

        const findUpstream = (nodeId: string) => {
            edges.forEach(edge => {
                if (edge.target === nodeId && !upstreamNodeIds.has(edge.source)) {
                    upstreamNodeIds.add(edge.source);
                    findUpstream(edge.source);
                }
            });
        };

        findUpstream(currentNodeId);

        // Build data for each upstream node that has execution output
        return nodes
            .filter(node => upstreamNodeIds.has(node.id))
            .map(node => {
                // Get the actual execution output from the node's data
                const execution = node.data?.execution as { output?: any } | undefined;
                const output = execution?.output;

                const variableName = String(node.data.variableName || node.data.name || node.type)
                    .toLowerCase()
                    .replace(/\s+/g, '_')
                    .replace(/[^a-z0-9_]/g, '');

                return {
                    nodeId: node.id,
                    nodeName: String(node.data.name || node.type),
                    variableName,
                    nodeType: node.type as string,
                    output: output ? output[variableName] : null, // Unwrap the variableName key
                };
            })
            .filter(data => data.output !== null && data.output !== undefined);
    }, [getNodes, getEdges, currentNodeId]);
};
