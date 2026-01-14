"use client";

import { BaseExecutionNode } from "../base-execution-node";
import type { NodeProps } from "@xyflow/react";
import { MailIcon } from "lucide-react";
import { useState } from "react";
import { GmailDialog, type GmailFormValues } from "./dialog";
import { useReactFlow } from "@xyflow/react";
import { useNodeStatus } from "../../hooks/use-node-status";
import { GMAIL_CHANNEL_NAME } from "@/inngest/channels/gmail";
import { fetchGmailRealtimeToken } from "./actions";

export const GmailNode = (props: NodeProps) => {
    const { id, data } = props;
    const [dialogOpen, setDialogOpen] = useState(false);
    const { setNodes } = useReactFlow();

    const nodeStatus = useNodeStatus({
        nodeId: id,
        channel: GMAIL_CHANNEL_NAME,
        topic: "status",
        refreshToken: fetchGmailRealtimeToken,
    });

    const handleSubmit = (values: GmailFormValues) => {
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

    const toEmail = data?.to as string;
    const description = toEmail
        ? `To: ${toEmail.substring(0, 20)}${toEmail.length > 20 ? '...' : ''}`
        : "Configure Gmail";

    return (
        <>
            <GmailDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSubmit={handleSubmit}
                defaultValues={{
                    variableName: (data?.variableName as string) || "gmail",
                    credentialId: (data?.credentialId as string) || "",
                    operation: (data?.operation as GmailFormValues["operation"]) || "SEND_EMAIL",
                    to: (data?.to as string) || "",
                    subject: (data?.subject as string) || "",
                    body: (data?.body as string) || "",
                    maxResults: (data?.maxResults as string) || "5",
                    messageId: (data?.messageId as string) || "",
                    labelId: (data?.labelId as string) || "",
                }}
                nodeId={props.id}
            />
            <BaseExecutionNode
                {...props}
                category="INTEGRATION"
                icon={MailIcon}
                name="Gmail"
                description={description}
                status={nodeStatus}
                onDoubleClick={() => setDialogOpen(true)}
                onSettings={() => setDialogOpen(true)}
            />
        </>
    );
};
