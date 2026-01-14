import { loopChannel } from "@/inngest/channels/loop";
import type { NodeExecutor } from "../../types";
import { resolveExpressions } from "@/lib/expression-engine";

/**
 * Loop Node Executor
 * Iterates over an array and transforms each item using custom code
 */
export const loopExecutor: NodeExecutor = async ({ data, context, step, nodeId, publish }) => {
    const { inputVariable, code, variableName } = data as {
        inputVariable: string;
        code: string;
        variableName: string;
    };

    await publish(
        loopChannel().status({
            nodeId,
            status: "loading",
        })
    );

    try {
        if (!inputVariable) {
            throw new Error("No input array variable provided");
        }

        // Resolve the input array from context
        const resolved = resolveExpressions({ input: inputVariable }, context);
        const inputArray = resolved.input;

        if (!Array.isArray(inputArray)) {
            throw new Error(`Input "${inputVariable}" is not an array. Got: ${typeof inputArray}`);
        }

        // Execute the transformation for each item
        const results = await step.run(`loop-${nodeId}`, async () => {
            const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;

            const transformedItems: any[] = [];

            for (let index = 0; index < inputArray.length; index++) {
                const item = inputArray[index];

                try {
                    // Build function body that exposes item, index, and full context
                    const functionBody = `
              const $item = ${JSON.stringify(item)};
              const $index = ${index};
              const $items = ${JSON.stringify(inputArray)};
              const $input = ${JSON.stringify(context)};
              ${code}
            `;

                    const userFunction = new AsyncFunction(functionBody);
                    const result = await userFunction();

                    transformedItems.push(result ?? item);
                } catch (error: any) {
                    throw new Error(`Loop error at index ${index}: ${error.message}`);
                }
            }

            return transformedItems;
        });

        await publish(
            loopChannel().status({
                nodeId,
                status: "success",
            })
        );

        return {
            [variableName || "loopResult"]: results,
            __loopMeta: {
                inputCount: inputArray.length,
                outputCount: results.length,
            }
        };
    } catch (error) {
        await publish(
            loopChannel().status({
                nodeId,
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error",
            })
        );
        throw error;
    }
};
