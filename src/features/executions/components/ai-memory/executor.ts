
import { NodeExecutorParams } from "../../types";

export const aiMemoryExecutor = async (params: NodeExecutorParams) => {
    const { data } = params;

    // We return the configuration so downstream nodes (AI Agent) can read it if they check execution output.
    // Ideally, AI Agent checks the node definition itself, but this is a good confirmation that the node "ran".

    return {
        provider: "buffer_memory",
        config: data
    };
};
