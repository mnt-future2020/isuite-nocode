"use server";

import { inngest } from "@/inngest/client";
import { WHATSAPP_TRIGGER_CHANNEL_NAME } from "@/inngest/channels/whatsapp-trigger";

export const fetchWhatsAppTriggerRealtimeToken = async () => {
    return inngest.getRealtimeAuthToken({
        channel: WHATSAPP_TRIGGER_CHANNEL_NAME,
    });
};
