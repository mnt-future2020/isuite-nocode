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
            const vm = require('node:vm');

            // Create a secure context
            // We expose specific safe globals, avoiding process/require/env access
            const sandbox = {
                input: context,
                console: {
                    log: (...args: any[]) => console.log(`[Code Node ${nodeId}]`, ...args),
                    error: (...args: any[]) => console.error(`[Code Node ${nodeId}]`, ...args),
                    warn: (...args: any[]) => console.warn(`[Code Node ${nodeId}]`, ...args),
                },
                // Allow basic utility functions
                setTimeout,
                clearTimeout,
                setInterval,
                clearInterval,
                URL,
                URLSearchParams,
                Buffer,
                fetch: global.fetch, // Allow fetch if you want them to make HTTP requests
            };

            const contextObj = vm.createContext(sandbox);

            // Wrap user code in an async function immediately invoked
            // We use 'return' to get the value out
            const wrappedCode = `
                (async () => {
                    const $input = input;
                    ${code}
                })()
            `;

            try {
                // Run in new context with timeout to prevent infinite loops
                const script = new vm.Script(wrappedCode);
                const resultPromise = script.runInContext(contextObj, {
                    timeout: 5000, // 5s timeout
                    displayErrors: true
                });

                return await resultPromise ?? { success: true };
            } catch (err: any) {
                throw new Error(`Execution failed: ${err.message}`);
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
