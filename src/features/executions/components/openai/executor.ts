import Handlebars from "handlebars";
import { NonRetriableError } from "inngest";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import type { NodeExecutor } from "@/features/executions/types";
import { openAiChannel } from "@/inngest/channels/openai";
import prisma from "@/lib/db";
import { decrypt } from "@/lib/encryption";

// Problem 4 Fix: Register a helper to sanitize or escape HTML/Script tags
Handlebars.registerHelper("sanitize", (text: unknown) => {
  if (typeof text !== "string") return text;
  return text.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
    .replace(/[<>]/g, "");
});

Handlebars.registerHelper("json", (context: unknown) => {
  const jsonString = JSON.stringify(context, null, 2);
  const safeString = new Handlebars.SafeString(jsonString);

  return safeString;
});

type OpenAiData = {
  variableName?: string;
  credentialId?: string;
  systemPrompt?: string;
  userPrompt?: string;
  model?: string;
};

export const openAiExecutor: NodeExecutor<OpenAiData> = async ({
  data,
  nodeId,
  userId,
  context,
  step,
  publish,
}) => {
  await publish(
    openAiChannel().status({
      nodeId,
      status: "loading",
    }),
  );

  if (!data.variableName) {
    await publish(
      openAiChannel().status({
        nodeId,
        status: "error",
        message: "Variable name is missing"
      })
    );
    throw new NonRetriableError("OpenAi node: Variable name is missing");
  }

  if (!data.credentialId) {
    await publish(
      openAiChannel().status({
        nodeId,
        status: "error",
        message: "Credential is required"
      }),
    );
    throw new NonRetriableError("OpenAi node: Credential is required");
  }

  if (!data.userPrompt) {
    await publish(
      openAiChannel().status({
        nodeId,
        status: "error",
        message: "User prompt is missing"
      })
    );
    throw new NonRetriableError("OpenAi node: User prompt is missing");
  }

  const systemPrompt = data.systemPrompt
    ? Handlebars.compile(data.systemPrompt)(context)
    : "You are a helpful assistant.";
  const userPrompt = Handlebars.compile(data.userPrompt)(context);

  const credential = await step.run(`get-credential-${nodeId}`, () => {
    return prisma.credential.findUnique({
      where: {
        id: data.credentialId,
        userId,
      },
    });
  });

  if (!credential) {
    await publish(
      openAiChannel().status({
        nodeId,
        status: "error",
        message: "Credential not found"
      })
    );
    throw new NonRetriableError("OpenAI node: Credential not found");
  }

  const openai = createOpenAI({
    apiKey: decrypt(credential.value),
  });

  try {
    const { steps } = await step.ai.wrap(
      `openai-generate-text-${nodeId}`,
      generateText,
      {
        model: openai(data.model || "gpt-4"),
        system: systemPrompt,
        prompt: userPrompt,
        experimental_telemetry: {
          isEnabled: true,
          recordInputs: true,
          recordOutputs: true,
        },
      },
    );

    const text =
      steps[0].content[0].type === "text"
        ? steps[0].content[0].text
        : "";

    await publish(
      openAiChannel().status({
        nodeId,
        status: "success",
      }),
    );

    return {
      [data.variableName]: {
        text,
      },
    }
  } catch (error) {
    await publish(
      openAiChannel().status({
        nodeId,
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error"
      }),
    );
    throw error;
  }
};

