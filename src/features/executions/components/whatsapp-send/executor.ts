import Handlebars from "handlebars";
import { NonRetriableError } from "inngest";
import type { NodeExecutor } from "@/features/executions/types";
import { whatsappSendChannel } from "@/inngest/channels/whatsapp-send";
import prisma from "@/lib/db";
import { decrypt } from "@/lib/encryption";

type WhatsAppSendData = {
    variableName?: string;
    credentialId?: string;
    to?: string;
    message?: string;
};

export const whatsappSendExecutor: NodeExecutor<WhatsAppSendData> = async ({
    data,
    nodeId,
    userId,
    context,
    step,
    publish,
}) => {
    await publish(
        whatsappSendChannel().status({
            nodeId,
            status: "loading",
        }),
    );

    if (!data.credentialId) throw new NonRetriableError("WhatsApp Node: Credential is required");
    if (!data.to) throw new NonRetriableError("WhatsApp Node: 'To' phone number is required");
    if (!data.message) throw new NonRetriableError("WhatsApp Node: Message is required");

    // Compile template strings
    const to = Handlebars.compile(data.to)(context);
    const message = Handlebars.compile(data.message)(context);

    // Fetch Credential
    const credential = await step.run(`get-credential-${nodeId}`, () => {
        return prisma.credential.findUnique({
            where: { id: data.credentialId, userId },
        });
    });

    if (!credential) {
        throw new NonRetriableError("WhatsApp Node: Credential not found");
    }

    const config = JSON.parse(decrypt(credential.value));

    // Send Message
    const result = await step.run(`send-whatsapp-${nodeId}`, async () => {
        const res = await fetch(`https://graph.facebook.com/v17.0/${config.phoneNumberId}/messages`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${config.accessToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                messaging_product: "whatsapp",
                to,
                text: { body: message }
            })
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`WhatsApp API Error: ${err}`);
        }

        return await res.json();
    });

    await publish(
        whatsappSendChannel().status({
            nodeId,
            status: "success",
        }),
    );

    return {
        [data.variableName || "whatsapp"]: result
    };
};
