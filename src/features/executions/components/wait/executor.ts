import { waitChannel } from "@/inngest/channels/wait";
import { NodeExecutor } from "../../types";

export const waitExecutor: NodeExecutor = async ({ data, step, nodeId, publish }) => {
    const { amount, unit } = data as {
        amount: number;
        unit: 'seconds' | 'minutes' | 'hours' | 'days';
    };

    await publish(
        waitChannel().status({
            nodeId,
            status: "loading"
        })
    );

    const duration = `${amount} ${unit}`;

    await step.sleep(`wait-${nodeId}-${amount}-${unit}`, duration);

    await publish(
        waitChannel().status({
            nodeId,
            status: "success"
        })
    );

    return {
        waited: true,
        duration
    };
};
