import { setFieldsChannel } from "@/inngest/channels/set-fields";
import type { NodeExecutor } from "../../types";
import { resolveExpressions } from "@/lib/expression-engine";

/**
 * Set Fields Node Executor
 * Translates and merges fields into the workflow context.
 */
export const setFieldsExecutor: NodeExecutor = async ({ data, context, step, nodeId, publish }) => {
    const { fields, variableName, mode } = data as {
        fields: Array<{ key: string; value: string }>;
        variableName: string;
        mode: "set" | "add" | "remove";
    };

    // Generic status publish helper
    const updateStatus = async (status: "loading" | "success" | "error", message?: string) => {
        try {
            await publish(
                setFieldsChannel().status({
                    nodeId,
                    status,
                    message
                })
            );
        } catch (e) {
            console.error("Status publish failed:", e);
        }
    };

    await updateStatus("loading");

    try {
        if (!fields || !Array.isArray(fields)) {
            throw new Error("No fields configured");
        }

        const result = await step.run(`set-fields-${nodeId}`, async () => {
            const output: Record<string, any> = {};

            for (const field of fields) {
                if (!field.key) continue;

                // Resolve expressions in the value if they weren't resolved by the engine
                const resolvedValue = typeof field.value === 'string'
                    ? resolveExpressions({ val: field.value }, context).val
                    : field.value;

                output[field.key] = resolvedValue;
            }

            return output;
        });

        await updateStatus("success");

        return {
            [variableName || "fields"]: result,
        };
    } catch (error) {
        await updateStatus("error", error instanceof Error ? error.message : String(error));
        throw error;
    }
};
