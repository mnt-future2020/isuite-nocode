"use client";

import { useReactFlow } from "@xyflow/react";
import { useCallback } from "react";

export const useNodeData = <T extends Record<string, any> = Record<string, any>>(nodeId: string) => {
    const { getNode, setNodes } = useReactFlow();
    const node = getNode(nodeId);
    const data = (node?.data || {}) as T;

    const setData = useCallback((newData: Partial<T>) => {
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
