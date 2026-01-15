import { NodeType } from "@/generated/prisma";
import { NodeExecutor } from "../types";
import { manualTriggerExecutor } from "@/features/triggers/components/manual-trigger/executor";
import { httpRequestExecutor } from "../components/http-request/executor";
import { googleFormTriggerExecutor } from "@/features/triggers/components/google-form-trigger/executor";
import { stripeTriggerExecutor } from "@/features/triggers/components/stripe-trigger/executor";
import { geminiExecutor } from "../components/gemini/executor";
import { openAiExecutor } from "../components/openai/executor";
import { anthropicExecutor } from "../components/anthropic/executor";
import { discordExecutor } from "../components/discord/executor";
import { slackExecutor } from "../components/slack/executor";
import { conditionExecutor } from "../components/condition/executor";
import { waitExecutor } from "../components/wait/executor";
import { switchExecutor } from "../components/switch/executor";
import { webhookTriggerExecutor } from "@/features/triggers/components/webhook/executor";
import { codeExecutor } from "../components/code/executor";
import { loopExecutor } from "../components/loop/executor";
import { scheduleTriggerExecutor } from "@/features/triggers/components/schedule-trigger/executor";
import { emailExecutor } from "../components/email/executor";
import { mergeExecutor } from "../components/merge/executor";
import { setFieldsExecutor } from "../components/set-fields/executor";
import { errorTriggerExecutor } from "../components/error-trigger/executor";
import { subWorkflowExecutor } from "../components/sub-workflow/executor";
import { jsonTransformerExecutor } from "../components/json-transformer/executor";
import { googleSheetsExecutor } from "../components/google-sheets/executor";
import { postgresExecutor } from "../components/postgres/executor";
import { mysqlExecutor } from "../components/mysql/executor";
import { pdfGeneratorExecutor } from "../components/pdf-generator/executor";
import { gmailExecutor } from "../components/gmail/executor";
import { aiAgentExecutor } from "../components/ai-agent/executor";
import { aiMemoryExecutor } from "../components/ai-memory/executor";
import { aiToolExecutor } from "../components/ai-tool/executor";
import { whatsappTriggerExecutor } from "@/features/triggers/components/whatsapp-trigger/executor";
import { whatsappSendExecutor } from "@/features/executions/components/whatsapp-send/executor";

export const executorRegistry: Record<NodeType, NodeExecutor> = {
  [NodeType.INITIAL]: manualTriggerExecutor,
  [NodeType.MANUAL_TRIGGER]: manualTriggerExecutor,
  [NodeType.HTTP_REQUEST]: httpRequestExecutor,
  [NodeType.GOOGLE_FORM_TRIGGER]: googleFormTriggerExecutor,
  [NodeType.STRIPE_TRIGGER]: stripeTriggerExecutor,
  [NodeType.GEMINI]: geminiExecutor,
  [NodeType.ANTHROPIC]: anthropicExecutor,
  [NodeType.OPENAI]: openAiExecutor,
  [NodeType.DISCORD]: discordExecutor,
  [NodeType.SLACK]: slackExecutor,
  [NodeType.CONDITION]: conditionExecutor,
  [NodeType.WAIT]: waitExecutor,
  [NodeType.SWITCH]: switchExecutor,
  [NodeType.WEBHOOK]: webhookTriggerExecutor,
  [NodeType.CODE]: codeExecutor,
  [NodeType.LOOP]: loopExecutor,
  [NodeType.SCHEDULE]: scheduleTriggerExecutor,
  [NodeType.EMAIL]: emailExecutor,
  [NodeType.MERGE]: mergeExecutor,
  [NodeType.SET_FIELDS]: setFieldsExecutor,
  [NodeType.ERROR_TRIGGER]: errorTriggerExecutor,
  [NodeType.SUB_WORKFLOW]: subWorkflowExecutor,
  [NodeType.JSON_TRANSFORMER]: jsonTransformerExecutor,
  [NodeType.GOOGLE_SHEETS]: googleSheetsExecutor,
  [NodeType.POSTGRES]: postgresExecutor,
  [NodeType.MYSQL]: mysqlExecutor,
  [NodeType.PDF_GENERATOR]: pdfGeneratorExecutor,
  [NodeType.GMAIL]: gmailExecutor,
  [NodeType.AI_AGENT]: aiAgentExecutor,
  [NodeType.AI_MEMORY]: aiMemoryExecutor,
  [NodeType.AI_TOOL]: aiToolExecutor,
  [NodeType.WHATSAPP_TRIGGER]: whatsappTriggerExecutor,
  [NodeType.WHATSAPP_SEND]: whatsappSendExecutor,
};

export const getExecutor = (type: NodeType): NodeExecutor => {
  const executor = executorRegistry[type];
  if (!executor) {
    throw new Error(`No executor found for node type: ${type}`);
  }

  return executor;
};
