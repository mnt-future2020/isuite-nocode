"use client";

import { useReactFlow, type Node, type NodeProps } from "@xyflow/react";
import { Settings2Icon } from "lucide-react";
import { memo, useState } from "react";
import { BaseExecutionNode } from "../base-execution-node";
import { JSONTransformerDialog, type JSONTransformerFormValues } from "./dialog";
import { useNodeStatus } from "../../hooks/use-node-status";
import { JSON_TRANSFORMER_CHANNEL_NAME } from "@/inngest/channels/json-transformer";
import { fetchJSONTransformerRealtimeToken } from "./actions";

type JSONTransformerNodeData = JSONTransformerFormValues;

type JSONTransformerNodeType = Node<JSONTransformerNodeData>;

export const JSONTransformerNode = memo((props: NodeProps<JSONTransformerNodeType>) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const { setNodes } = useReactFlow();

    const nodeStatus = useNodeStatus({
        nodeId: props.id,
        channel: JSON_TRANSFORMER_CHANNEL_NAME,
        topic: "status",
        refreshToken: fetchJSONTransformerRealtimeToken,
    });

    const handleOpenSettings = () => setDialogOpen(true);

    const handleSubmit = (values: JSONTransformerFormValues) => {
        setNodes((nodes) => nodes.map((node) => {
            if (node.id === props.id) {
                return {
                    ...node,
                    data: {
                        ...node.data,
                        ...values,
                    }
                }
            }
            return node;
        }))
    };

    const nodeData = props.data;
    const description = nodeData?.mode === 'extract'
        ? `Extract: ${nodeData.jsonPath || '...'}`
        : "Mapping Template";

    return (
        <>
            <JSONTransformerDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSubmit={handleSubmit}
                defaultValues={nodeData}
                nodeId={props.id}
            />
            <BaseExecutionNode
                {...props}
                id={props.id}
                category="DATA"
                icon={Settings2Icon}
                name="JSON Transformer"
                description={description}
                status={nodeStatus}
                onSettings={handleOpenSettings}
                onDoubleClick={handleOpenSettings}
            />
        </>
    )
});

JSONTransformerNode.displayName = "JSONTransformerNode";
