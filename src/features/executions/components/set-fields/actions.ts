"use server";

import { getSubscriptionToken } from "@inngest/realtime";
import { setFieldsChannel } from "@/inngest/channels/set-fields";
import { inngest } from "@/inngest/client";
import { requireAuth } from "@/lib/auth-utils";

export async function fetchSetFieldsRealtimeToken() {
    await requireAuth();

    const token = await getSubscriptionToken(inngest, {
        channel: setFieldsChannel(),
        topics: ["status"],
    });

    return token;
}
