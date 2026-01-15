import { channel, topic } from "@inngest/realtime";

export const WHATSAPP_SEND_CHANNEL_NAME = "node-status.whatsapp-send";

export const whatsappSendChannel = channel(WHATSAPP_SEND_CHANNEL_NAME)
    .addTopic(
        topic("status").type<{
            nodeId: string;
            status: "loading" | "success" | "error";
            message?: string;
        }>(),
    );
