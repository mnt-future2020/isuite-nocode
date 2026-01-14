"use server";

import { getSubscriptionToken, type Realtime } from "@inngest/realtime";
import { mysqlChannel } from "@/inngest/channels/mysql";
import { inngest } from "@/inngest/client";

export type MySqlToken = Realtime.Token<
    typeof mysqlChannel,
    ["status"]
>;

export async function fetchMySqlRealtimeToken(): Promise<MySqlToken> {
    const token = await getSubscriptionToken(inngest, {
        channel: mysqlChannel(),
        topics: ["status"],
    });

    return token;
};
