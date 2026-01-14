"use client";

import { BaseExecutionNode } from "../base-execution-node";
import type { NodeProps } from "@xyflow/react";
import { PenLineIcon } from "lucide-react";
import { useState } from "react";
import { SetFieldsDialog, type SetFieldsFormValues } from "./dialog";
import { useReactFlow } from "@xyflow/react";
import { useNodeStatus } from "../../hooks/use-node-status";
import { SET_FIELDS_CHANNEL_NAME } from "@/inngest/channels/set-fields";
import { fetchSetFieldsRealtimeToken } from "./actions";

export const SetFieldsNode = (props: NodeProps) => {
    const { id, data } = props;
    const [dialogOpen, setDialogOpen] = useState(false);
    const { setNodes } = useReactFlow();

    const nodeStatus = useNodeStatus({
        nodeId: id,
        channel: SET_FIELDS_CHANNEL_NAME,
        topic: "status",
        refreshToken: fetchSetFieldsRealtimeToken,
    });

    const handleSubmit = (values: SetFieldsFormValues) => {
        setNodes((nodes) =>
            nodes.map((node) => {
                if (node.id === id) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            ...values,
                        },
                    };
                }
                return node;
            })
        );
    };

    const fieldsCount = (data?.fields as any[])?.length || 0;
    const description = fieldsCount > 0 ? `${fieldsCount} field(s)` : "Configure";

    return (
        <>
            <SetFieldsDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSubmit={handleSubmit}
                defaultValues={{
                    variableName: (data?.variableName as string) || "fields",
                    fields: (data?.fields as any[]) || [{ key: "", value: "" }],
                }}
                nodeId={props.id}
            />
            <BaseExecutionNode
                {...props}
                category="DATA"
                icon={PenLineIcon}
                name="Set Fields"
                status={nodeStatus}
                description={description}
                onDoubleClick={() => setDialogOpen(true)}
                onSettings={() => setDialogOpen(true)}
            />
        </>
    );
};
