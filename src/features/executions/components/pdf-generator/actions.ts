"use server";

import { getSubscriptionToken, type Realtime } from "@inngest/realtime";
import { pdfGeneratorChannel } from "@/inngest/channels/pdf-generator";
import { inngest } from "@/inngest/client";

export type PDFGeneratorToken = Realtime.Token<
    typeof pdfGeneratorChannel,
    ["status"]
>;

export async function fetchPDFGeneratorRealtimeToken(): Promise<PDFGeneratorToken> {
    const token = await getSubscriptionToken(inngest, {
        channel: pdfGeneratorChannel(),
        topics: ["status"],
    });

    return token;
};
