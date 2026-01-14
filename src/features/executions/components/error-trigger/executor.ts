import type { NodeExecutor } from "../../types";

/**
 * Error Trigger Executor
 * This node is triggered when another node in the workflow fails.
 * It provides error details to the following nodes.
 */
export const errorTriggerExecutor: NodeExecutor = async ({ data, context }) => {
    // If we are here, it means the workflow engine has detected an error 
    // and routed execution to this node.
    // The error details should already be in the context under the 'error' key.

    return {
        handled: true,
        error: context.error || {
            message: "Unknown error",
            nodeId: "unknown",
            timestamp: new Date().toISOString()
        }
    };
};
