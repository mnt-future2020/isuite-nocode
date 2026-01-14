import { InitialNode } from "@/components/initial-node";
import { NodeType } from "@/generated/prisma";
import type { NodeTypes } from "@xyflow/react";

import { HttpRequestNode } from "@/features/executions/components/http-request/node";
import { ManualTriggerNode } from "@/features/triggers/components/manual-trigger/node";
import { GoogleFormTrigger } from "@/features/triggers/components/google-form-trigger/node";
import { StripeTriggerNode } from "@/features/triggers/components/stripe-trigger/node";
import { GeminiNode } from "@/features/executions/components/gemini/node";
import { OpenAiNode } from "@/features/executions/components/openai/node";
import { AnthropicNode } from "@/features/executions/components/anthropic/node";
import { DiscordNode } from "@/features/executions/components/discord/node";
import { SlackNode } from "@/features/executions/components/slack/node";
import { ConditionNode } from "@/features/executions/components/condition/node";
import { WaitNode } from "@/features/executions/components/wait/node";
import { SwitchNode } from "@/features/executions/components/switch/node";
import { WebhookNode } from "@/features/triggers/components/webhook/node";
import { CodeNode } from "@/features/executions/components/code/node";
import { LoopNode } from "@/features/executions/components/loop/node";
import { ScheduleNode } from "@/features/triggers/components/schedule-trigger/node";
import { EmailNode } from "@/features/executions/components/email/node";
import { MergeNode } from "@/features/executions/components/merge/node";
import { SetFieldsNode } from "@/features/executions/components/set-fields/node";
import { ErrorTriggerNode } from "@/features/executions/components/error-trigger/node";
import { SubWorkflowNode } from "@/features/executions/components/sub-workflow/node";
import { JSONTransformerNode } from "@/features/executions/components/json-transformer/node";
import { GoogleSheetsNode } from "@/features/executions/components/google-sheets/node";
import { PostgresNode } from "@/features/executions/components/postgres/node";
import { MySqlNode } from "@/features/executions/components/mysql/node";
import { PDFGeneratorNode } from "@/features/executions/components/pdf-generator/node";
import { GmailNode } from "@/features/executions/components/gmail/node";

export const nodeComponents = {
  [NodeType.INITIAL]: InitialNode,
  [NodeType.HTTP_REQUEST]: HttpRequestNode,
  [NodeType.MANUAL_TRIGGER]: ManualTriggerNode,
  [NodeType.GOOGLE_FORM_TRIGGER]: GoogleFormTrigger,
  [NodeType.STRIPE_TRIGGER]: StripeTriggerNode,
  [NodeType.GEMINI]: GeminiNode,
  [NodeType.OPENAI]: OpenAiNode,
  [NodeType.ANTHROPIC]: AnthropicNode,
  [NodeType.DISCORD]: DiscordNode,
  [NodeType.SLACK]: SlackNode,
  [NodeType.CONDITION]: ConditionNode,
  [NodeType.WAIT]: WaitNode,
  [NodeType.SWITCH]: SwitchNode,
  [NodeType.WEBHOOK]: WebhookNode,
  [NodeType.CODE]: CodeNode,
  [NodeType.LOOP]: LoopNode,
  [NodeType.SCHEDULE]: ScheduleNode,
  [NodeType.EMAIL]: EmailNode,
  [NodeType.MERGE]: MergeNode,
  [NodeType.SET_FIELDS]: SetFieldsNode,
  [NodeType.ERROR_TRIGGER]: ErrorTriggerNode,
  [NodeType.SUB_WORKFLOW]: SubWorkflowNode,
  [NodeType.JSON_TRANSFORMER]: JSONTransformerNode,
  [NodeType.GOOGLE_SHEETS]: GoogleSheetsNode,
  [NodeType.POSTGRES]: PostgresNode,
  [NodeType.MYSQL]: MySqlNode,
  [NodeType.PDF_GENERATOR]: PDFGeneratorNode,
  [NodeType.GMAIL]: GmailNode,
} as const satisfies NodeTypes;

export type RegisteredNodeType = keyof typeof nodeComponents;
