import { mergeChannel } from "@/inngest/channels/merge";
import type { NodeExecutor } from "../../types";

/**
 * Merge Node Executor
 * Combines data from multiple branches into a single object
 */
export const mergeExecutor: NodeExecutor = async ({ data, context, step, nodeId, publish }) => {
    const { mode, variableName } = data as {
        mode: "append" | "merge" | "keepFirst";
        variableName: string;
    };

    await publish(
        mergeChannel().status({
            nodeId,
            status: "loading",
        })
    );

    try {
        const result = await step.run(`merge-${nodeId}`, async () => {
            // The context already contains all data from previous nodes
            // This node's purpose is to "wait" for multiple branches and combine them

            switch (mode) {
                case "append":
                    // Combine all arrays into one
                    return Object.values(context).flat();

                case "merge":
                    // Deep merge all objects
                    return Object.assign({}, ...Object.values(context).filter(v => typeof v === 'object' && v !== null));

                case "keepFirst":
                default:
                    // Just pass through the first value
                    return context;
            }
        });

        await publish(
            mergeChannel().status({
                nodeId,
                status: "success",
            })
        );

        return {
            [variableName || "merged"]: result,
        };
    } catch (error) {
        await publish(
            mergeChannel().status({
                nodeId,
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error",
            })
        );
        throw error;
    }
};
