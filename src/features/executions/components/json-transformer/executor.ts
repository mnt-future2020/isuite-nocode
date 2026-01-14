import { jsonTransformerChannel } from "@/inngest/channels/json-transformer";
import type { NodeExecutor } from "../../types";
import { resolveExpressions } from "@/lib/expression-engine";
import { JSONPath } from 'jsonpath-plus';

type JSONTransformerAction = 'extract' | 'map';

interface JSONTransformerData {
    mode: JSONTransformerAction;
    jsonPath?: string;
    mappingTemplate?: string;
    variableName: string;
}

export const jsonTransformerExecutor: NodeExecutor = async ({ data, context, step, nodeId, publish }) => {
    const { mode, jsonPath, mappingTemplate, variableName } = data as unknown as JSONTransformerData;

    const updateStatus = async (status: "loading" | "success" | "error", message?: string) => {
        try {
            await publish(
                jsonTransformerChannel().status({
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
        const result = await step.run(`json-transformer-${nodeId}`, async () => {
            if (mode === 'extract') {
                if (!jsonPath) throw new Error("JSONPath expression is required");

                const found = JSONPath({
                    path: jsonPath,
                    json: context,
                    wrap: false
                });
                return found;
            }

            if (mode === 'map') {
                if (!mappingTemplate) throw new Error("Mapping template is required");

                let parsedTemplate: any;
                try {
                    parsedTemplate = JSON.parse(mappingTemplate);
                } catch (e) {
                    throw new Error("Invalid JSON template: " + (e instanceof Error ? e.message : String(e)));
                }

                return resolveExpressions(parsedTemplate, context);
            }

            throw new Error(`Unsupported mode: ${mode}`);
        });

        await updateStatus("success");

        return {
            [variableName || "transformed"]: result,
        };
    } catch (error) {
        await updateStatus("error", error instanceof Error ? error.message : String(error));
        throw error;
    }
};
