import type { NodeExecutor } from "../../types";
import { codeChannel } from "@/inngest/channels/code";

/**
 * Code Node Executor
 * Executes user-provided JavaScript code securely (server-side)
 */
export const codeExecutor: NodeExecutor = async ({ data, context, step, nodeId, publish }) => {
    const { code, variableName } = data as {
        code: string;
        variableName: string;
    };

    await publish(
        codeChannel().status({
            nodeId,
            status: "loading",
        }),
    );

    if (!code) {
        await publish(
            codeChannel().status({
                nodeId,
                status: "error",
                message: "No code provided",
            }),
        );
        throw new Error("No code provided");
    }

    try {
        const result = await step.run(`execute-code-${nodeId}`, async () => {
            try {
                const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
                const functionBody = `
            const $input = ${JSON.stringify(context)};
            ${code}
          `;

                const userFunction = new AsyncFunction(functionBody);
                const output = await userFunction();

                return output ?? { success: true };
            } catch (error: any) {
                throw new Error(`Code execution error: ${error.message}`);
            }
        });

        await publish(
            codeChannel().status({
                nodeId,
                status: "success",
            }),
        );

        return {
            [variableName || "codeResult"]: result,
        };
    } catch (error) {
        await publish(
            codeChannel().status({
                nodeId,
                status: "error",
                message: error instanceof Error ? error.message : String(error),
            }),
        );
        throw error;
    }
};
