"use client";

import { useReactFlow, type Node, type NodeProps } from "@xyflow/react";
import { memo, useState } from "react";
import { BaseExecutionNode } from "../base-execution-node";
import { MySqlDialog, MySqlFormValues } from "./dialog";
import { useNodeStatus } from "../../hooks/use-node-status";
import { MYSQL_CHANNEL_NAME } from "@/inngest/channels/mysql";
import { fetchMySqlRealtimeToken } from "./actions";

type MySqlNodeData = MySqlFormValues;

type MySqlNodeType = Node<MySqlNodeData>;

export const MySqlNode = memo((props: NodeProps<MySqlNodeType>) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const { setNodes } = useReactFlow();

    const nodeStatus = useNodeStatus({
        nodeId: props.id,
        channel: MYSQL_CHANNEL_NAME,
        topic: "status",
        refreshToken: fetchMySqlRealtimeToken,
    });

    const handleOpenSettings = () => setDialogOpen(true);

    const handleSubmit = (values: MySqlFormValues) => {
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
            <MySqlDialog
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
                icon="/logos/mysql.png"
                name="MySQL"
                description={description}
                status={nodeStatus}
                onSettings={handleOpenSettings}
                onDoubleClick={handleOpenSettings}
            />
        </>
    )
});

MySqlNode.displayName = "MySqlNode";
