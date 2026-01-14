import type { NodeExecutor } from "../../types";
import { resolveExpressions } from "@/lib/expression-engine";
import prisma from "@/lib/db";
import nodemailer from "nodemailer";
import { google } from "googleapis";
import { gmailChannel } from "@/inngest/channels/gmail";

/**
 * Gmail Node Executor
 * Support for Sending Emails, Creating Drafts, Getting Profile, and Listing Threads
 */
export const gmailExecutor: NodeExecutor = async ({ data, context, step, nodeId, publish }) => {
    const {
        to,
        subject,
        body,
        variableName,
        credentialId,
        operation = "SEND_EMAIL",
        maxResults,
        messageId, // Added
        labelId // Added
    } = data as {
        to?: string;
        subject?: string;
        body?: string;
        variableName: string;
        credentialId: string;
        operation?: "SEND_EMAIL" | "CREATE_DRAFT" | "GET_PROFILE" | "GET_THREADS" | "GET_MESSAGE" | "DELETE_MESSAGE" | "ADD_LABEL" | "REMOVE_LABEL"; // Updated type
        maxResults?: string;
        messageId?: string; // Added
        labelId?: string; // Added
    };

    const updateStatus = async (status: "loading" | "success" | "error", message?: string) => {
        try {
            await publish(
                gmailChannel().status({
                    nodeId,
                    status,
                    message
                })
            );
        } catch (e) {
            console.error("Status publish failed:", e);
        }
    };

    if (!credentialId) {
        throw new Error("Gmail credential is required");
    }

    try {
        const result = await step.run(`gmail-${operation}-${nodeId}`, async () => {
            // Fetch credential
            const credential = await prisma.credential.findUnique({
                where: { id: credentialId },
            });

            if (!credential) {
                throw new Error(`Credential not found: ${credentialId}`);
            }

            let gmailConfig;
            try {
                gmailConfig = JSON.parse(credential.value);
            } catch (e) {
                throw new Error("Invalid Gmail credential configuration (failed to parse JSON)");
            }

            const { user, clientId, clientSecret, refreshToken } = gmailConfig;

            if (!clientId || !clientSecret || !refreshToken) {
                throw new Error("Gmail credential missing required fields");
            }

            // Common: Resolve expressions
            const resolved = resolveExpressions({
                to: to || "",
                subject: subject || "",
                body: body || "",
                maxResults: maxResults || "5"
            }, context);

            // Handle SEND_EMAIL using Nodemailer (easier for MIME)
            if (operation === "SEND_EMAIL") {
                if (!resolved.to || !resolved.subject || !resolved.body) {
                    throw new Error("Send Email requires 'to', 'subject', and 'body'");
                }

                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        type: 'OAuth2',
                        user,
                        clientId,
                        clientSecret,
                        refreshToken,
                    },
                });

                const info = await transporter.sendMail({
                    from: user,
                    to: resolved.to,
                    subject: resolved.subject,
                    html: resolved.body,
                });

                return {
                    success: true,
                    operation,
                    messageId: info.messageId,
                    response: info.response,
                };
            }

            // Handle Other Operations using Google APIs
            const auth = new google.auth.OAuth2(clientId, clientSecret);
            auth.setCredentials({ refresh_token: refreshToken });
            const gmail = google.gmail({ version: 'v1', auth });

            if (operation === "GET_PROFILE") {
                const res = await gmail.users.getProfile({ userId: 'me' });
                return res.data;
            }

            if (operation === "GET_THREADS") {
                const res = await gmail.users.threads.list({
                    userId: 'me',
                    maxResults: parseInt(resolved.maxResults) || 5,
                });
                return res.data;
            }

            if (operation === "GET_MESSAGE") {
                if (!data.messageId) throw new Error("Message ID is required for GET_MESSAGE");
                const res = await gmail.users.messages.get({
                    userId: 'me',
                    id: resolveExpressions({ id: data.messageId }, context).id,
                });
                return res.data;
            }

            if (operation === "DELETE_MESSAGE") {
                if (!data.messageId) throw new Error("Message ID is required for DELETE_MESSAGE");
                const res = await gmail.users.messages.trash({
                    userId: 'me',
                    id: resolveExpressions({ id: data.messageId }, context).id,
                });
                return res.data;
            }

            if (operation === "ADD_LABEL") {
                if (!data.messageId || !data.labelId) throw new Error("Message ID and Label ID are required for ADD_LABEL");
                const resolvedIds = resolveExpressions({
                    messageId: data.messageId,
                    labelId: data.labelId
                }, context);

                const res = await gmail.users.messages.modify({
                    userId: 'me',
                    id: resolvedIds.messageId,
                    requestBody: {
                        addLabelIds: [resolvedIds.labelId]
                    }
                });
                return res.data;
            }

            if (operation === "REMOVE_LABEL") {
                if (!data.messageId || !data.labelId) throw new Error("Message ID and Label ID are required for REMOVE_LABEL");
                const resolvedIds = resolveExpressions({
                    messageId: data.messageId,
                    labelId: data.labelId
                }, context);

                const res = await gmail.users.messages.modify({
                    userId: 'me',
                    id: resolvedIds.messageId,
                    requestBody: {
                        removeLabelIds: [resolvedIds.labelId]
                    }
                });
                return res.data;
            }

            if (operation === "CREATE_DRAFT") {
                // Constructing a raw MIME message is complex. 
                // Simple text/html draft:
                const messageParts = [
                    `From: ${user}`,
                    `To: ${resolved.to}`,
                    `Subject: ${resolved.subject}`,
                    `Content-Type: text/html; charset=utf-8`,
                    `MIME-Version: 1.0`,
                    ``,
                    resolved.body
                ];
                const message = messageParts.join('\n');
                const encodedMessage = Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

                const res = await gmail.users.drafts.create({
                    userId: 'me',
                    requestBody: {
                        message: {
                            raw: encodedMessage
                        }
                    }
                });
                return res.data;
            }

            throw new Error(`Unsupported operation: ${operation}`);
        });

        await updateStatus("success");

        return {
            [variableName || "gmail"]: result,
        };
    } catch (error) {
        await updateStatus("error", error instanceof Error ? error.message : String(error));
        throw error;
    }
};
