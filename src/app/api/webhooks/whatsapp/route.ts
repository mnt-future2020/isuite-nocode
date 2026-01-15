import { sendWorkflowExecution } from "@/inngest/utils";
import prisma from "@/lib/db";
import { type NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/encryption";

// Handle Webhook Verification
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");
    const credentialId = searchParams.get("credentialId");

    if (mode === "subscribe" && token && challenge && credentialId) {
        try {
            const credential = await prisma.credential.findUnique({
                where: { id: credentialId }
            });

            if (credential) {
                const decryptedVal = decrypt(credential.value);
                const config = JSON.parse(decryptedVal);
                if (config.verifyToken === token) {
                    return new NextResponse(challenge, { status: 200 });
                }
            }
        } catch (e) {
            console.error("Webhook Verification Error", e);
        }
    }

    return new NextResponse("Forbidden", { status: 403 });
}

// Handle Incoming Messages
export async function POST(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const credentialId = searchParams.get("credentialId");

        if (!credentialId) {
            return NextResponse.json({ error: "Missing credentialId" }, { status: 400 });
        }

        const body = await request.json();

        // Check if it's a WhatsApp status update or message
        const entry = body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const message = value?.messages?.[0];

        // Early return for status updates (sent, delivered, read) to avoid noise
        if (!message) {
            return NextResponse.json({ success: true }, { status: 200 });
        }

        // Find active workflows that use this Credential in a WHATSAPP_TRIGGER
        // We filter using JSON path match on the node data
        const workflows = await prisma.workflow.findMany({
            where: {
                isActive: true,
                nodes: {
                    some: {
                        type: "WHATSAPP_TRIGGER",
                        data: {
                            path: ["credentialId"],
                            equals: credentialId
                        }
                    }
                }
            }
        });

        // Trigger Inngest for matches
        for (const workflow of workflows) {
            await sendWorkflowExecution({
                workflowId: workflow.id,
                initialData: {
                    whatsapp: {
                        message: message.text?.body || "",
                        sender: message.from, // Phone number
                        senderName: value.contacts?.[0]?.profile?.name || "Unknown",
                        messageId: message.id,
                        timestamp: message.timestamp,
                        raw: message
                    }
                }
            });
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("WhatsApp Webhook Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
