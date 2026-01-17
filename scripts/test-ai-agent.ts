
import { PrismaClient, NodeType } from "../src/generated/prisma";
import { aiAgentExecutor } from "../src/features/executions/components/ai-agent/executor";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function runTest() {
    console.log("🚀 Starting AI Agent Integration Test...");

    // 1. Create a Test User (or find existing)
    const user = await prisma.user.findFirst();
    if (!user) {
        console.error("❌ No user found in database. Cannot run test.");
        process.exit(1);

    }
    console.log(`👤 Using user: ${user.email} (${user.id})`);

    // 2. Create a Test Workflow
    const workflow = await prisma.workflow.create({
        data: {
            name: "TEST_AI_AGENT_WORKFLOW_" + Date.now(),
            userId: user.id,
            isActive: true,
        },
    });
    console.log(`📝 Created temporary workflow: ${workflow.id}`);

    try {
        // 3. Create Nodes
        // Agent Node
        const agentNode = await prisma.node.create({
            data: {
                workflowId: workflow.id,
                type: NodeType.AI_AGENT,
                name: "AI Agent",
                position: { x: 0, y: 0 },
                data: {
                    input: "Calculate 5 + 5 and then tell me a joke about it."
                }
            }
        });

        // Tool Node (Calculator)
        const calcNode = await prisma.node.create({
            data: {
                workflowId: workflow.id,
                type: NodeType.AI_TOOL,
                name: "Calculator",
                position: { x: -200, y: 0 },
                data: {
                    toolType: "calculator"
                }
            }
        });

        // Memory Node
        const memoryNode = await prisma.node.create({
            data: {
                workflowId: workflow.id,
                type: NodeType.AI_MEMORY,
                name: "Memory",
                position: { x: -200, y: 100 },
                data: {
                    memoryType: "buffer_window"
                }
            }
        });

        // 4. Create Connections
        // Tool -> Agent
        await prisma.connection.create({
            data: {
                workflowId: workflow.id,
                fromNodeId: calcNode.id,
                toNodeId: agentNode.id,
                fromOutput: "output", // handle id
                toInput: "tool-input" // This must match the Handle ID in the Agent Node (Wait! I need to check Agent Node handles)
            }
        });

        // Memory -> Agent
        await prisma.connection.create({
            data: {
                workflowId: workflow.id,
                fromNodeId: memoryNode.id,
                toNodeId: agentNode.id,
                fromOutput: "output",
                toInput: "memory-input"
            }
        });

        console.log("🔗 Nodes connected.");

        // 5. Run Executor
        console.log("🏃‍♂️ Running AI Agent Executor...");

        // We mock the params that usually come from Inngest/Execution engine
        const result = await aiAgentExecutor({
            data: agentNode.data as any,
            nodeId: agentNode.id,
            userId: user.id,
            context: {},
            step: {
                // Mocking the step.ai object for Vercel AI SDK wrappers if used
                ai: {
                    wrap: async (_name: any, fn: any) => fn()
                },
                run: async (_name: any, fn: any) => fn()
            } as any,
            publish: async () => { }
        });

        console.log("\n✅ Execution Result:");
        console.log(JSON.stringify(result, null, 2));

    } catch (error) {
        console.error("❌ Test Failed:", error);
    } finally {
        // 6. Cleanup
        console.log("🧹 Cleaning up...");
        await prisma.workflow.delete({
            where: { id: workflow.id }
        });
        console.log("✨ Done.");
        await prisma.$disconnect();
    }
}

runTest();
