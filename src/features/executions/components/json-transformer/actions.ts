"use server";

import { getSubscriptionToken, type Realtime } from "@inngest/realtime";
import { jsonTransformerChannel } from "@/inngest/channels/json-transformer";
import { inngest } from "@/inngest/client";

export type JSONTransformerToken = Realtime.Token<
    typeof jsonTransformerChannel,
    ["status"]
>;

export async function fetchJSONTransformerRealtimeToken(): Promise<JSONTransformerToken> {
    const token = await getSubscriptionToken(inngest, {
        channel: jsonTransformerChannel(),
        topics: ["status"],
    });

    return token;
};
