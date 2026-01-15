"use client";

import { useReactFlow, type Node, type NodeProps } from "@xyflow/react";
import { memo, useState } from "react";
import { BaseExecutionNode } from "../base-execution-node";
import { WhatsAppSendDialog, WhatsAppSendFormValues } from "./dialog";
import { useNodeStatus } from "../../hooks/use-node-status";
import { WHATSAPP_SEND_CHANNEL_NAME } from "@/inngest/channels/whatsapp-send";
import { fetchWhatsAppSendRealtimeToken } from "./actions";

type WhatsappSendNodeData = WhatsAppSendFormValues;
type WhatsappSendNodeType = Node<WhatsappSendNodeData>;

export const WhatsAppSendNode = memo((props: NodeProps<WhatsappSendNodeType>) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const { setNodes } = useReactFlow();

    const nodeStatus = useNodeStatus({
        nodeId: props.id,
        channel: WHATSAPP_SEND_CHANNEL_NAME,
        topic: "status",
        refreshToken: fetchWhatsAppSendRealtimeToken,
    });

    const handleOpenSettings = () => setDialogOpen(true);

    const handleSubmit = (values: WhatsAppSendFormValues) => {
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
    const description = nodeData?.to
        ? `To: ${nodeData.to}`
        : "Not configured";

    return (
        <>
            <WhatsAppSendDialog
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
                icon="/logos/whatsapp.png"
                name="WhatsApp Send"
                description={description}
                status={nodeStatus}
                onSettings={handleOpenSettings}
                onDoubleClick={handleOpenSettings}
            />
        </>
    )
});

WhatsAppSendNode.displayName = "WhatsAppSendNode";
