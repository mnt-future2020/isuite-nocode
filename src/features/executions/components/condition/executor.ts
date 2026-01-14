import { conditionChannel } from "@/inngest/channels/condition";
import { NodeExecutor } from "../../types";

export const conditionExecutor: NodeExecutor = async ({ data, context, nodeId, publish }) => {
    const { variable, operator, value } = data as {
        variable: string;
        operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than';
        value: string;
    };

    await publish(
        conditionChannel().status({
            nodeId,
            status: "loading",
        }),
    );

    try {
        const actualValue = variable; // This will already be resolved by our expression engine
        const targetValue = value;

        let result = false;

        switch (operator) {
            case 'equals':
                result = String(actualValue) === String(targetValue);
                break;
            case 'not_equals':
                result = String(actualValue) !== String(targetValue);
                break;
            case 'contains':
                result = String(actualValue).includes(String(targetValue));
                break;
            case 'not_contains':
                result = !String(actualValue).includes(String(targetValue));
                break;
            case 'greater_than':
                result = Number(actualValue) > Number(targetValue);
                break;
            case 'less_than':
                result = Number(actualValue) < Number(targetValue);
                break;
        }

        await publish(
            conditionChannel().status({
                nodeId,
                status: "success",
            }),
        );

        return {
            conditionMet: result,
            __branch: result ? 'true' : 'false' // Used for branching logic
        };
    } catch (error) {
        await publish(
            conditionChannel().status({
                nodeId,
                status: "error",
                message: error instanceof Error ? error.message : String(error),
            }),
        );
        throw error;
    }
};
