import type { NodeExecutor } from "@/features/executions/types";
import { manualTriggerChannel } from "@/inngest/channels/manual-trigger";

/**
 * Schedule Trigger Executor
 * Triggers workflow on a cron schedule
 */
export const scheduleTriggerExecutor: NodeExecutor = async ({
    data,
    nodeId,
    userId,
    step,
    publish
}) => {
    const { cronExpression, timezone } = data as {
        cronExpression: string;
        timezone: string;
    };

    await step.run(`schedule-trigger-${nodeId}`, async () => {
        await publish(manualTriggerChannel().status({
            status: "loading",
            nodeId
        }));
    });

    await step.run(`schedule-trigger-complete-${nodeId}`, async () => {
        await publish(manualTriggerChannel().status({
            status: "success",
            nodeId
        }));
    });

    return {
        trigger: {
            type: "schedule",
            cronExpression,
            timezone,
            triggeredAt: new Date().toISOString(),
        }
    };
};
