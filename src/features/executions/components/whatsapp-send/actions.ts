"use server";

import { inngest } from "@/inngest/client";
import { WHATSAPP_SEND_CHANNEL_NAME } from "@/inngest/channels/whatsapp-send";

export const fetchWhatsAppSendRealtimeToken = async () => {
    return inngest.getRealtimeAuthToken({
        channel: WHATSAPP_SEND_CHANNEL_NAME,
    });
};
