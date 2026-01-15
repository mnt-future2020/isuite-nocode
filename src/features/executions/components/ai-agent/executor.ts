
import { NodeExecutorParams } from "../../types";
import prisma from "@/lib/db";
import { NodeType } from "@/generated/prisma";
import { ChatOpenAI } from "@langchain/openai";
import { BufferMemory } from "langchain/memory";
import { DynamicTool, Tool } from "@langchain/core/tools";
import { Calculator } from "@langchain/community/tools/calculator";
import { initializeAgentExecutorWithOptions } from "langchain/agents";

export const aiAgentExecutor = async (params: NodeExecutorParams) => {
    const { data, nodeId, context } = params;
    // Fix: access body safely
    const inputQuery = (data.input as string) || (context.trigger as any)?.body?.message || "Hello";

    // 1. Fetch Upstream Connections to identify Model, Memory, Tools
    const connections = await prisma.connection.findMany({
        where: { toNodeId: nodeId },
        include: { fromNode: true }
    });

    let model: any = null;
    let memory: any = null;
    let tools: Tool[] = [];

    // 2. Instantiate Components based on connections
    for (const conn of connections) {
        const upstreamNode = conn.fromNode;
        const handleId = conn.toInput;

        // --- Chat Model ---
        if (handleId === 'chat-model-input') {
            if (upstreamNode.type === NodeType.OPENAI) {
                const apiKey = process.env.OPENAI_API_KEY;
                model = new ChatOpenAI({
                    openAIApiKey: apiKey,
                    modelName: (upstreamNode.data as any).model || "gpt-3.5-turbo",
                    temperature: (upstreamNode.data as any).temperature ? parseFloat((upstreamNode.data as any).temperature) : 0.7,
                });
            }
        }

        // --- Memory ---
        else if (handleId === 'memory-input') {
            if (upstreamNode.type === NodeType.AI_MEMORY) {
                memory = new BufferMemory({
                    returnMessages: true,
                    memoryKey: "chat_history",
                    inputKey: "input",
                    outputKey: "output",
                });
            }
        }

        // --- Tools ---
        else if (handleId === 'tool-input') {
            if (upstreamNode.type === NodeType.AI_TOOL) {
                const toolData = upstreamNode.data as any;
                const toolType = toolData.toolType || "duckduckgo_search";

                if (toolType === 'calculator') {
                    tools.push(new Calculator());
                } else if (toolType === 'custom') {
                    // For custom tools, we create a DynamicTool
                    // We need to construct the function from the string provided by the user
                    // WARNING: Executing user-defined code via new Function() is unsafe in production,
                    // but for this MVP/demo it works. In production, use VM2 or isolated sandbox.
                    try {
                        const userFuncString = toolData.func || "return async (input) => 'No logic defined'";
                        // Determine if it's an async function or regular
                        // We wrap it to ensure it returns a Promise<string>
                        const createFunc = new Function(userFuncString);
                        const userFunc = createFunc(); // specific format: return async (input) => { ... }

                        tools.push(new DynamicTool({
                            name: toolData.name || "custom_tool",
                            description: toolData.description || "A custom tool defined by the user.",
                            func: async (input: string) => {
                                try {
                                    const result = await userFunc(input);
                                    return String(result);
                                } catch (err) {
                                    return `Error executing tool: ${err}`;
                                }
                            }
                        }));
                    } catch (err) {
                        console.error("Failed to parse custom tool function:", err);
                    }
                } else {
                    // Default: Search
                    // Mock DuckDuckGo behavior without external dependency for now
                    tools.push(new DynamicTool({
                        name: "internet_search",
                        description: "Useful for finding information on the internet.",
                        func: async (input: string) => {
                            // Mocking realistic search results
                            return `[Search Results for "${input}"]
                            1. Nodebase Documentation: Official guide for Nodebase workflow automation.
                            2. AI Agent Concepts: Agents use models, memory, and tools to perform tasks.
                            3. DuckDuckGo: A privacy-focused search engine.
                            (Note: Real DuckDuckGo integration requires additional package installation)`;
                        }
                    }));
                }
            }
        }
    }

    // 3. Validation
    if (!model) {
        console.warn("No Chat Model connected, using default OpenAI.");
        model = new ChatOpenAI({ temperature: 0 });
    }

    // 4. Initialize Agent
    const executor = await initializeAgentExecutorWithOptions(tools, model, {
        agentType: "chat-conversational-react-description",
        verbose: true,
        memory: memory,
    });

    // 5. Execute
    try {
        const result = await executor.call({
            input: inputQuery
        });

        return {
            output: result.output,
            intermediateSteps: result.intermediateSteps
        };
    } catch (error) {
        console.error("Agent execution failed:", error);
        throw error;
    }
};
