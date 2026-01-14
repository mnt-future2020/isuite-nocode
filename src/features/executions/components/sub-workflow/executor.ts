import type { NodeExecutor } from "../../types";
import { subWorkflowChannel } from "@/inngest/channels/sub-workflow";

/**
 * Sub-Workflow Executor
 * Triggers another workflow and returns its execution ID
 */
export const subWorkflowExecutor: NodeExecutor = async ({ data, context, step, nodeId, publish }) => {
    const { subWorkflowId, inputData = {}, variableName } = data as {
        subWorkflowId: string;
        inputData: any;
        variableName?: string;
    };

    await publish(
        subWorkflowChannel().status({
            nodeId,
            status: "loading",
        })
    );

    try {
        if (!subWorkflowId) {
            throw new Error("No Sub-Workflow ID provided");
        }

        const result = await step.run(`trigger-sub-workflow-${nodeId}`, async () => {
            const { inngest } = await import("@/inngest/client");

            await inngest.send({
                name: "workflows/execute.workflow",
                data: {
                    workflowId: subWorkflowId,
                    initialData: {
                        ...inputData,
                        _parentContext: context
                    },
                },
            });

            return {
                triggeredWorkflowId: subWorkflowId,
                status: "triggered"
            };
        });

        await publish(
            subWorkflowChannel().status({
                nodeId,
                status: "success",
            })
        );

        return {
            [variableName || "subWorkflow"]: result
        };
    } catch (error) {
        await publish(
            subWorkflowChannel().status({
                nodeId,
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error",
            })
        );
        throw error;
    }
};
