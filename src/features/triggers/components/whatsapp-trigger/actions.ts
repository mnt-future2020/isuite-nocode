"use server";

import { getSubscriptionToken } from "@inngest/realtime";
import { whatsappTriggerChannel } from "@/inngest/channels/whatsapp-trigger";
import { inngest } from "@/inngest/client";

export async function fetchWhatsAppTriggerRealtimeToken() {
    const token = await getSubscriptionToken(inngest, {
        channel: whatsappTriggerChannel(),
        topics: ["status"],
    });

    return token;
};
