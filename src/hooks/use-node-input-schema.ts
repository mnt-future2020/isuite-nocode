"use client";

import { useMemo } from "react";
import { useReactFlow } from "@xyflow/react";
import { generateMockData } from "@/features/nodes/types";

export interface NodeOutputData {
    nodeId: string;
    nodeName: string;
    variableName: string;
    nodeType: string;
    output: any; // Actual execution output data
    isMock?: boolean;
}

export const useNodeInputData = (currentNodeId?: string): NodeOutputData[] => {
    const { getNodes } = useReactFlow();

    return useMemo(() => {
        if (!currentNodeId) return [];

        const nodes = getNodes();

        // Return all nodes except the current one to show all available variables
        return nodes
            .filter(node => node.id !== currentNodeId)
            .map(node => {
                // Get the actual execution output from the node's data
                const execution = node.data?.execution as { output?: any } | undefined;
                let output = execution?.output;
                let isMock = false;

                // If no execution data, generate mock data from schema
                if (!output) {
                    output = generateMockData(node.type as string);
                    isMock = true;
                }

                const variableName = String(node.data.variableName || node.data.name || node.type)
                    .toLowerCase()
                    .replace(/\s+/g, '_')
                    .replace(/[^a-z0-9_]/g, '');

                // Some nodes output wrapped data { variable: data } and some output data directly
                // We try to access the wrapped variable first
                const finalOutput = (output && output[variableName]) ? output[variableName] : output;

                return {
                    nodeId: node.id,
                    nodeName: String(node.data.name || node.type),
                    variableName,
                    nodeType: node.type as string,
                    output: finalOutput,
                    isMock
                };
            })
            // Keep entries if they have output (real or mock)
            .filter(data => data.output !== null && data.output !== undefined);

    }, [getNodes, currentNodeId]);
};
