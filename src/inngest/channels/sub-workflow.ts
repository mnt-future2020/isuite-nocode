import { channel, topic } from "@inngest/realtime";

export const SUB_WORKFLOW_CHANNEL_NAME = "sub-workflow-execution";

export const subWorkflowChannel = channel(SUB_WORKFLOW_CHANNEL_NAME)
    .addTopic(
        topic("status").type<{
            nodeId: string;
            status: "loading" | "success" | "error";
            message?: string;
        }>(),
    );
