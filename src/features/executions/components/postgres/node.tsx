"use client";

import { useReactFlow, type Node, type NodeProps } from "@xyflow/react";
import { memo, useState } from "react";
import { BaseExecutionNode } from "../base-execution-node";
import { PostgresDialog, PostgresFormValues } from "./dialog";
import { useNodeStatus } from "../../hooks/use-node-status";
import { POSTGRES_CHANNEL_NAME } from "@/inngest/channels/postgres";
import { fetchPostgresRealtimeToken } from "./actions";

type PostgresNodeData = PostgresFormValues;

type PostgresNodeType = Node<PostgresNodeData>;

export const PostgresNode = memo((props: NodeProps<PostgresNodeType>) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const { setNodes } = useReactFlow();

    const nodeStatus = useNodeStatus({
        nodeId: props.id,
        channel: POSTGRES_CHANNEL_NAME,
        topic: "status",
        refreshToken: fetchPostgresRealtimeToken,
    });

    const handleOpenSettings = () => setDialogOpen(true);

    const handleSubmit = (values: PostgresFormValues) => {
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
    const description = nodeData?.sql
        ? `SQL: ${nodeData.sql.slice(0, 50)}...`
        : "Not configured";

    return (
        <>
            <PostgresDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSubmit={handleSubmit}
                defaultValues={nodeData}
                nodeId={props.id}
            />
            <BaseExecutionNode
                {...props}
                id={props.id}
                category="INTEGRATION"
                icon="/logos/postgres.png"
                name="Postgres"
                description={description}
                status={nodeStatus}
                onSettings={handleOpenSettings}
                onDoubleClick={handleOpenSettings}
            />
        </>
    )
});

PostgresNode.displayName = "PostgresNode";
