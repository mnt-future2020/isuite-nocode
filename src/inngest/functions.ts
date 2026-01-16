import { NonRetriableError } from "inngest";
import { inngest } from "./client";
import prisma from "@/lib/db";
import { getExecutionLevels, getDownstreamNodeIds } from "./utils";
import { ExecutionStatus, NodeType } from "@/generated/prisma";
import { getExecutor } from "@/features/executions/lib/executor-registry";
import { httpRequestChannel } from "./channels/http-request";
import { manualTriggerChannel } from "./channels/manual-trigger";
import { googleFormTriggerChannel } from "./channels/google-form-trigger";
import { stripeTriggerChannel } from "./channels/stripe-trigger";
import { geminiChannel } from "./channels/gemini";
import { openAiChannel } from "./channels/openai";
import { anthropicChannel } from "./channels/anthropic";
import { discordChannel } from "./channels/discord";
import { slackChannel } from "./channels/slack";
import { resolveExpressions } from "@/lib/expression-engine";

const MAX_LOG_SIZE = 50 * 1024; // 50KB limit per step input/output

const truncatePayload = (data: any): any => {
  if (!data) return data;

  try {
    const str = JSON.stringify(data);
    if (str.length <= MAX_LOG_SIZE) return data;

    // If it's an object, try to preserve structure but truncate big strings
    if (typeof data === 'object' && data !== null) {
      if (Array.isArray(data)) {
        return `[Array(${data.length}) - Truncated due to size]`;
      }

      const truncated: Record<string, any> = {};
      let size = 0;

      for (const [key, value] of Object.entries(data)) {
        const valStr = JSON.stringify(value);
        if (size + valStr.length > MAX_LOG_SIZE) {
          truncated[key] = "...(truncated)";
          truncated["_removed_fields"] = "...";
          break;
        }
        truncated[key] = value;
        size += valStr.length;
      }
      return truncated;
    }

    return `[Data size ${(str.length / 1024).toFixed(2)}KB - Truncated]`;
  } catch (e) {
    return "[Unable to serialize data]";
  }
};

export const executeWorkflow = inngest.createFunction(
  {
    id: "execute-workflow",
    retries: process.env.NODE_ENV === "production" ? 3 : 0,
    onFailure: async ({ event, step }: { event: any; step: any }) => {
      return prisma.execution.update({
        where: { inngestEventId: event.data.event.id },
        data: {
          status: ExecutionStatus.FAILED,
          error: event.data.error.message,
          errorStack: event.data.error.stack,
        },
      });
    },
  },
  {
    event: "workflows/execute.workflow",
    channels: [
      httpRequestChannel(),
      manualTriggerChannel(),
      googleFormTriggerChannel(),
      stripeTriggerChannel(),
      geminiChannel(),
      openAiChannel(),
      anthropicChannel(),
      discordChannel(),
      slackChannel(),
    ],
  },
  async ({ event, step, publish }: { event: any; step: any; publish: any }) => {
    const inngestEventId = event.id;
    const workflowId = event.data.workflowId;

    if (!inngestEventId || !workflowId) {
      throw new NonRetriableError("Event ID or workflow ID is missing");
    }

    const execution = await step.run("create-execution", async () => {
      return prisma.execution.create({
        data: {
          workflowId,
          inngestEventId,
        },
      });
    });

    const executionId = execution.id;

    const executionLevels = await step.run("prepare-workflow", async () => {
      const workflow = await prisma.workflow.findUniqueOrThrow({
        where: { id: workflowId },
        include: {
          nodes: true,
          connections: true,
        },
      });

      return getExecutionLevels(workflow.nodes, workflow.connections);
    });

    const userId = await step.run("find-user-id", async () => {
      const workflow = await prisma.workflow.findUniqueOrThrow({
        where: { id: workflowId },
        select: {
          userId: true,
        },
      });

      return workflow.userId;
    });

    // Initialize context with any initial data from the trigger
    let context = event.data.initialData || {};
    // Store results by node name to support {{ nodeName.property }}
    const nodeResults: Record<string, any> = {
      trigger: context,
    };

    // Set of node IDs that should NOT be executed (because of conditions)
    const disabledNodeIds = new Set<string>();

    // Problem 7 Fix: Execute each level
    for (const level of executionLevels) {
      // Execute all nodes in the current level in parallel
      const results = await Promise.all(
        level.map(async (node: any) => {
          // Skip if this node is disabled
          if (disabledNodeIds.has(node.id)) {
            return { __skipped: true, nodeId: node.id };
          }

          const executor = getExecutor(node.type as NodeType);

          // Resolve expressions in node data using current results
          console.log(`[Workflow] Executing node ${node.id} (${node.type})`);
          console.log(`[Workflow] Available variables:`, Object.keys(nodeResults));
          const resolvedData = resolveExpressions(node.data, nodeResults);

          try {
            const result = await executor({
              data: resolvedData as Record<string, unknown>,
              nodeId: node.id,
              userId,
              context: nodeResults,
              step,
              publish: async (event: any) => {
                try {
                  await publish(event);
                } catch (e) {
                  console.error(`[Workflow] Status publish failed for node ${node.id}:`, e);
                }
              },
            });

            console.log(`[Workflow] Node ${node.id} finished successfully`);

            // Save step execution results
            await step.run(`save-step-${node.id}`, async () => {
              return prisma.stepExecution.upsert({
                where: {
                  executionId_nodeId: {
                    executionId,
                    nodeId: node.id,
                  },
                },
                create: {
                  executionId,
                  nodeId: node.id,
                  status: ExecutionStatus.SUCCESS,
                  input: truncatePayload(resolvedData) as any,
                  output: truncatePayload(result) as any,
                  completedAt: new Date(),
                },
                update: {
                  status: ExecutionStatus.SUCCESS,
                  input: truncatePayload(resolvedData) as any,
                  output: truncatePayload(result) as any,
                  completedAt: new Date(),
                },
              });
            });

            // Handle branching logic
            if (result?.__branch) {
              const workflow = await prisma.workflow.findUnique({
                where: { id: workflowId },
                include: { connections: true }
              });

              const outputConnections = workflow?.connections.filter(c => c.fromNodeId === node.id) || [];

              for (const conn of outputConnections) {
                // If branch doesn't match the connection output, disable the target path
                if (conn.fromOutput !== result.__branch) {
                  disabledNodeIds.add(conn.toNodeId);

                  // Recursively disable all downstream nodes too
                  const downstreamIds = getDownstreamNodeIds(conn.toNodeId, workflow?.connections || []);
                  for (const id of downstreamIds) {
                    disabledNodeIds.add(id);
                  }
                }
              }
            }

            return { ...result, nodeId: node.id, nodeName: node.name };
          } catch (error) {
            // Save failure status
            await step.run(`save-step-fail-${node.id}`, async () => {
              return prisma.stepExecution.upsert({
                where: {
                  executionId_nodeId: {
                    executionId,
                    nodeId: node.id,
                  },
                },
                create: {
                  executionId,
                  nodeId: node.id,
                  status: ExecutionStatus.FAILED,
                  input: truncatePayload(resolvedData) as any,
                  error: error instanceof Error ? error.message : String(error),
                  completedAt: new Date(),
                },
                update: {
                  status: ExecutionStatus.FAILED,
                  input: truncatePayload(resolvedData) as any,
                  error: error instanceof Error ? error.message : String(error),
                  completedAt: new Date(),
                },
              });
            });

            const nodeData = node.data as { continueOnFailure?: boolean };
            if (nodeData.continueOnFailure) {
              console.error(`Node ${node.id} failed, but continuing:`, error);
              return context; // Return current context on failure if allowed
            }

            // --- Error Handling Node Logic ---
            const errorData = {
              message: error instanceof Error ? error.message : String(error),
              nodeId: node.id,
              nodeName: node.name,
              timestamp: new Date().toISOString(),
            };

            // Find if there are any ERROR_TRIGGER nodes in this workflow
            const errorTriggerNodes = await step.run(`find-error-triggers-${node.id}`, async () => {
              return prisma.node.findMany({
                where: {
                  workflowId,
                  type: NodeType.ERROR_TRIGGER,
                },
              });
            });

            if (errorTriggerNodes.length > 0) {
              // Inject error data into nodeResults for downstream nodes
              nodeResults.error = errorData;

              // We need to enable the paths starting from ERROR_TRIGGER nodes
              // and disable the "normal" remaining nodes in the current executionLevels
              // For simplicity, we'll just allow the engine to keep running, 
              // but we need to ensure the ERROR_TRIGGER nodes themselves get executed.

              // We'll treat errorTriggerNodes as "new triggers" that started now.
              // This is a bit complex with the current level-based loop.
              // A simpler way: just execute the error handler path synchronously here 
              // or mark them as "to be executed".

              // Re-calculating downstream from error triggers
              for (const triggerNode of errorTriggerNodes) {
                // Remove the "disabled" status if they were downstream of anything else (unlikely for triggers)
                disabledNodeIds.delete(triggerNode.id);

                // We mark the trigger node as "pending results" by adding it to nodeResults indirectly
                // Actually, the easiest way is to let the NEXT levels pick them up.
                // But triggers are usually at level 0.

                // Let's execute the Error Trigger node right now
                const errorExecutor = getExecutor(NodeType.ERROR_TRIGGER);
                const triggerResult = await errorExecutor({
                  data: triggerNode.data as any,
                  nodeId: triggerNode.id,
                  userId,
                  context: nodeResults,
                  step,
                  publish,
                });

                nodeResults[triggerNode.id] = triggerResult;
                const safeName = triggerNode.name.toLowerCase().replace(/\s+/g, '_');
                nodeResults[safeName] = triggerResult;

                // Save trigger execution
                await step.run(`save-error-trigger-${triggerNode.id}-${node.id}`, async () => {
                  return prisma.stepExecution.upsert({
                    where: {
                      executionId_nodeId: {
                        executionId,
                        nodeId: triggerNode.id,
                      },
                    },
                    create: {
                      executionId,
                      nodeId: triggerNode.id,
                      status: ExecutionStatus.SUCCESS,
                      input: errorData as any,
                      output: triggerResult as any,
                      completedAt: new Date(),
                    },
                    update: {
                      status: ExecutionStatus.SUCCESS,
                      input: errorData as any,
                      output: triggerResult as any,
                      completedAt: new Date(),
                    },
                  });
                });
              }

              // Return a special result to indicate it was handled
              return { __errorHandled: true, ...errorData };
            }

            throw error;
          }
        })
      );

      // Merge results from all parallel nodes into the context
      for (const res of results) {
        if (res && !res.__skipped) {
          const { nodeId, nodeName, ...data } = res;

          // 1. Store by nodeId for internal referencing
          nodeResults[nodeId] = data;

          // 2. Store by nodeName (slugified)
          if (nodeName) {
            const nameKey = nodeName.toLowerCase().replace(/\s+/g, '_');
            nodeResults[nameKey] = data;
          }

          // 3. IMPORTANT: Directly merge 'data' into nodeResults.
          // This allows {{ variableName.property }} to work because executors 
          // return { [variableName]: { ... } }.
          Object.assign(nodeResults, data);

          // Also merge into legacy context for backward compatibility
          context = { ...context, ...data };
        }
      }
    }

    await step.run("update-execution", async () => {
      return prisma.execution.update({
        where: { inngestEventId, workflowId },
        data: {
          status: ExecutionStatus.SUCCESS,
          completedAt: new Date(),
          output: truncatePayload(context) as any,
        },
      });
    });

    return {
      workflowId,
      result: context,
    };
  },
);

export const cleanupExecutionLogs = inngest.createFunction(
  { id: "cleanup-execution-logs" },
  { cron: "0 0 * * *" }, // Run every day at midnight
  async ({ step }: { step: any }) => {
    // Cleanup 1: Delete completed/failed logs older than 1 day (reduced from 3)
    const completedThreshold = new Date();
    completedThreshold.setDate(completedThreshold.getDate() - 1);

    const deletedCompleted = await step.run("delete-completed-logs", async () => {
      const result = await prisma.execution.deleteMany({
        where: {
          startedAt: {
            lt: completedThreshold,
          },
          status: {
            in: [ExecutionStatus.SUCCESS, ExecutionStatus.FAILED],
          },
        },
      });
      return result.count;
    });

    // Cleanup 2: Delete "Zombie" executions that are stuck in RUNNING for > 30 days
    // This handles cases where the server crashed or Inngest lost track
    const zombieThreshold = new Date();
    zombieThreshold.setDate(zombieThreshold.getDate() - 30);

    const deletedZombies = await step.run("delete-zombie-logs", async () => {
      const result = await prisma.execution.deleteMany({
        where: {
          startedAt: {
            lt: zombieThreshold,
          },
          status: ExecutionStatus.RUNNING,
        },
      });
      return result.count;
    });

    return { deletedCompleted, deletedZombies };
  },
);

export const workflowScheduler = inngest.createFunction(
  { id: "workflow-scheduler" },
  { cron: "* * * * *" }, // Run every minute
  async ({ step, publish }) => {
    const workflowsToTrigger = await step.run("find-scheduled-workflows", async () => {
      // Find all workflows that have a SCHEDULE node
      // Note: We should only check enabled workflows if we had an "enabled" flag
      const workflows = await prisma.workflow.findMany({
        include: {
          nodes: {
            where: {
              type: NodeType.SCHEDULE,
            },
          },
        },
      });

      const triggered: string[] = [];
      const now = new Date();
      const cronParser = require('cron-parser');

      for (const workflow of workflows) {
        for (const node of workflow.nodes) {
          const data = node.data as { cronExpression?: string; timezone?: string };
          if (data.cronExpression) {
            try {
              const interval = cronParser.parseExpression(data.cronExpression, {
                currentDate: now,
                tz: data.timezone || 'UTC'
              });

              // If the next execution time is within the current minute
              // We check if it's due now.
              // A safer way is to check if it has been triggered recently.
              // For simplicity, we just check if it's "close enough" 
              // and assume we run once per min.
              const prev = interval.prev();
              const diffSecs = Math.abs((now.getTime() - prev.getTime()) / 1000);

              if (diffSecs < 60) {
                triggered.push(workflow.id);
                break; // One trigger per workflow level
              }
            } catch (err) {
              console.error(`Invalid cron expression for node ${node.id}:`, err);
            }
          }
        }
      }

      return triggered;
    });

    // Trigger all scheduled workflows
    for (const workflowId of workflowsToTrigger) {
      await step.sendEvent(`trigger-workflow-${workflowId}`, {
        name: "workflows/execute.workflow",
        data: {
          workflowId,
          initialData: {
            source: "schedule",
            triggeredAt: new Date().toISOString()
          },
        },
      });
    }

    return { triggeredCount: workflowsToTrigger.length };
  }
);


