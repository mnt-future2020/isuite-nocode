"use server";

import { getSubscriptionToken } from "@inngest/realtime";
import { whatsappSendChannel } from "@/inngest/channels/whatsapp-send";
import { inngest } from "@/inngest/client";

export async function fetchWhatsAppSendRealtimeToken() {
    const token = await getSubscriptionToken(inngest, {
        channel: whatsappSendChannel(),
        topics: ["status"],
    });

    return token;
};
