"use client";

import { useReactFlow, type Node, type NodeProps } from "@xyflow/react";
import { memo, useState } from "react";
import { BaseTriggerNode } from "../base-trigger-node";
import { WhatsAppTriggerDialog } from "./dialog";
import { MessageCircle } from "lucide-react";
import { useNodeStatus } from "@/features/executions/hooks/use-node-status";
import { WHATSAPP_TRIGGER_CHANNEL_NAME } from "@/inngest/channels/whatsapp-trigger";
import { fetchWhatsAppTriggerRealtimeToken } from "./actions";

export const WhatsappTriggerNode = memo((props: NodeProps) => {
    const [dialogOpen, setDialogOpen] = useState(false);

    const nodeStatus = useNodeStatus({
        nodeId: props.id,
        channel: WHATSAPP_TRIGGER_CHANNEL_NAME,
        topic: "status",
        refreshToken: fetchWhatsAppTriggerRealtimeToken,
    });

    const handleOpenSettings = () => setDialogOpen(true);

    return (
        <>
            <WhatsAppTriggerDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                nodeId={props.id}
                defaultValues={props.data}
            />
            <BaseTriggerNode
                {...props}
                icon="/logos/whatsapp.svg"
                name="WhatsApp"
                description="On incoming message"
                status={nodeStatus}
                onSettings={handleOpenSettings}
                onDoubleClick={handleOpenSettings}
            />
        </>
    )
});

WhatsappTriggerNode.displayName = "WhatsappTriggerNode";
