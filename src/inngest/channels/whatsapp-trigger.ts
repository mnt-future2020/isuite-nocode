import { channel, topic } from "@inngest/realtime";

export const WHATSAPP_TRIGGER_CHANNEL_NAME = "node-status.whatsapp-trigger";

export const whatsappTriggerChannel = channel(WHATSAPP_TRIGGER_CHANNEL_NAME)
    .addTopic(
        topic("status").type<{
            nodeId: string;
            status: "loading" | "success" | "error";
            message?: string;
        }>(),
    );
