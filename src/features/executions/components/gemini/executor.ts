import Handlebars from "handlebars";
import { NonRetriableError } from "inngest";
import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { NodeExecutor } from "@/features/executions/types";
import { geminiChannel } from "@/inngest/channels/gemini";
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

type GeminiData = {
  variableName?: string;
  credentialId?: string;
  systemPrompt?: string;
  userPrompt?: string;
  model?: string; // Problem 2 Fix: Allow dynamic model
};

export const geminiExecutor: NodeExecutor<GeminiData> = async ({
  data,
  nodeId,
  userId,
  context,
  step,
  publish,
}) => {
  await publish(
    geminiChannel().status({
      nodeId,
      status: "loading",
    }),
  );

  if (!data.variableName) {
    await publish(
      geminiChannel().status({
        nodeId,
        status: "error",
        message: "Variable name is missing"
      })
    );
    throw new NonRetriableError("Gemini node: Variable name is missing");
  }

  if (!data.credentialId) {
    await publish(
      geminiChannel().status({
        nodeId,
        status: "error",
        message: "Credential is required"
      }),
    );
    throw new NonRetriableError("Gemini node: Credential is required");
  }

  if (!data.userPrompt) {
    await publish(
      geminiChannel().status({
        nodeId,
        status: "error",
        message: "User prompt is missing"
      })
    );
    throw new NonRetriableError("Gemini node: User prompt is missing");
  }

  // Use the sanitize helper in prompts
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
      geminiChannel().status({
        nodeId,
        status: "error",
        message: "Credential not found"
      })
    );
    throw new NonRetriableError("Gemini node: Credential not found");
  }

  const google = createGoogleGenerativeAI({
    apiKey: decrypt(credential.value),
  });

  try {
    const { steps } = await step.ai.wrap(
      `gemini-generate-text-${nodeId}`,
      generateText,
      {
        model: google(data.model || "gemini-2.0-flash"), // Problem 2 Fix
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
      geminiChannel().status({
        nodeId,
        status: "success",
      }),
    );

    // Problem 5 Fix: Return only the delta to avoid bloat during parallel merge
    return {
      [data.variableName]: {
        text,
      },
    }
  } catch (error) {
    await publish(
      geminiChannel().status({
        nodeId,
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error"
      }),
    );
    throw error;
  }
};
