import { switchChannel } from "@/inngest/channels/switch";
import { NodeExecutor } from "../../types";

export const switchExecutor: NodeExecutor = async ({ data, context, nodeId, publish }) => {
    const { variable, cases, defaultHandle } = data as {
        variable: string;
        cases: Array<{
            value: string;
            outputHandle: string;
        }>;
        defaultHandle?: string;
    };

    await publish(
        switchChannel().status({
            nodeId,
            status: "loading"
        })
    );

    const actualValue = String(variable);
    const matchedCase = cases.find(c => String(c.value) === actualValue);

    let result;
    if (matchedCase) {
        result = {
            match: true,
            matchedValue: matchedCase.value,
            __branch: matchedCase.outputHandle
        };
    } else if (defaultHandle) {
        result = {
            match: false,
            default: true,
            __branch: defaultHandle
        };
    } else {
        result = {
            match: false,
            __branch: null
        };
    }

    await publish(
        switchChannel().status({
            nodeId,
            status: "success"
        })
    );

    return result;
};
