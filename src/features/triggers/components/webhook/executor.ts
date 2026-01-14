import type { NodeExecutor } from "@/features/executions/types";
import { manualTriggerChannel } from "@/inngest/channels/manual-trigger";

// Reusing manual trigger channel for now as it's just a status update
export const webhookTriggerExecutor: NodeExecutor = async ({
    nodeId,
    context,
    publish,
}) => {
    await publish(
        manualTriggerChannel().status({
            nodeId,
            status: "loading",
        }),
    );

    // Context contains the body/payload passed from the API route
    const result = context;

    await publish(
        manualTriggerChannel().status({
            nodeId,
            status: "success",
        }),
    );

    return result;
};
