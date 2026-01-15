
import { NodeExecutorParams } from "../../types";

export const aiToolExecutor = async (params: NodeExecutorParams) => {
    const { data } = params;
    const toolType = data.toolType || "duckduckgo_search";

    // Return configuration for the Agent to use
    // The Agent Executor will be responsible for instantiating the actual LangChain tool
    // based on this provider type.

    // We pass generic config because some tools might need API keys or custom code.
    return {
        provider: toolType,
        toolName: data.name,
        toolDescription: data.description,
        config: data
    };
};
