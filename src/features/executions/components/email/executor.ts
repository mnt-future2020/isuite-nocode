import type { NodeExecutor } from "../../types";
import { resolveExpressions } from "@/lib/expression-engine";
import { emailChannel } from "@/inngest/channels/email";

/**
 * Email Node Executor
 * Sends emails via SMTP or API (Resend/SendGrid)
 */
export const emailExecutor: NodeExecutor = async ({ data, context, step, nodeId, publish }) => {
    const { to, subject, body, from, variableName } = data as {
        to: string;
        subject: string;
        body: string;
        from: string;
        variableName: string;
    };

    await publish(
        emailChannel().status({
            nodeId,
            status: "loading",
        }),
    );

    if (!to || !subject || !body) {
        await publish(
            emailChannel().status({
                nodeId,
                status: "error",
                message: "Email requires 'to', 'subject', and 'body' fields",
            }),
        );
        throw new Error("Email requires 'to', 'subject', and 'body' fields");
    }

    try {
        // Resolve expressions in email fields
        const resolved = resolveExpressions({ to, subject, body, from }, context);

        const result = await step.run(`send-email-${nodeId}`, async () => {
            const RESEND_API_KEY = process.env.RESEND_API_KEY;

            if (!RESEND_API_KEY) {
                console.log("Email would be sent:", resolved);
                return {
                    success: true,
                    simulated: true,
                    to: resolved.to,
                    subject: resolved.subject,
                    message: "Email simulated (no RESEND_API_KEY configured)",
                };
            }

            const response = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${RESEND_API_KEY}`,
                },
                body: JSON.stringify({
                    from: resolved.from || "onboarding@resend.dev",
                    to: resolved.to,
                    subject: resolved.subject,
                    html: resolved.body,
                }),
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Failed to send email: ${error}`);
            }

            const resData = await response.json();
            return {
                success: true,
                id: resData.id,
                to: resolved.to,
                subject: resolved.subject,
            };
        });

        await publish(
            emailChannel().status({
                nodeId,
                status: "success",
            }),
        );

        return {
            [variableName || "email"]: result,
        };
    } catch (error) {
        await publish(
            emailChannel().status({
                nodeId,
                status: "error",
                message: error instanceof Error ? error.message : String(error),
            }),
        );
        throw error;
    }
};
