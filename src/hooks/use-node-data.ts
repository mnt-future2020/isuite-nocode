"use client";

import { useReactFlow } from "@xyflow/react";
import { useCallback } from "react";

export const useNodeData = (nodeId: string) => {
    const { getNode, setNodes } = useReactFlow();
    const node = getNode(nodeId);
    const data = node?.data || {};

    const setData = useCallback((newData: any) => {
        setNodes((nodes) =>
            nodes.map((n) => {
                if (n.id === nodeId) {
                    return { ...n, data: { ...n.data, ...newData } };
                }
                return n;
            })
        );
    }, [nodeId, setNodes]);

    return [data, setData] as const;
};
