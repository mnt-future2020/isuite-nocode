import { channel, topic } from "@inngest/realtime";

export const JSON_TRANSFORMER_CHANNEL_NAME = "json-transformer-execution";

export const jsonTransformerChannel = channel(JSON_TRANSFORMER_CHANNEL_NAME)
    .addTopic(
        topic("status").type<{
            nodeId: string;
            status: "loading" | "success" | "error";
            message?: string;
        }>(),
    );
