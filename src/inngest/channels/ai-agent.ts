import { channel, topic } from "@inngest/realtime";

export const AI_AGENT_CHANNEL_NAME = "ai-agent";

export const aiAgentChannel = channel(AI_AGENT_CHANNEL_NAME)
    .addTopic(
        topic("status").type<{
            nodeId: string;
            status: "loading" | "success" | "error";
            message?: string;
        }>(),
    );
