import { NextRequest, NextResponse } from "next/server";
import { inngest } from "@/inngest/client";
import prisma from "@/lib/db";
import { NodeType } from "@/generated/prisma";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ nodeId: string }> }
) {
    try {
        const { nodeId } = await params;

        // 1. Verify that the node exists and is a WEBHOOK trigger
        const node = await prisma.node.findUnique({
            where: { id: nodeId },
            include: { workflow: true }
        });

        if (!node) {
            return NextResponse.json({ error: "Node not found" }, { status: 404 });
        }

        if (node.type !== NodeType.WEBHOOK) {
            return NextResponse.json({ error: "Node is not a webhook trigger" }, { status: 400 });
        }

        // 2. Parse the body
        let body = {};
        try {
            const text = await req.text();
            if (text) {
                body = JSON.parse(text);
            }
        } catch (e) {
            console.error("Failed to parse body", e);
            // Continue with empty body if parsing fails (maybe plain text?)
        }

        // 3. Trigger the workflow execution via Inngest
        await inngest.send({
            name: "workflows/execute.workflow",
            data: {
                workflowId: node.workflowId,
                initialData: body // Pass the webhook body as initial context
            },
        });

        return NextResponse.json({ success: true, workflowId: node.workflowId });
    } catch (error) {
        console.error("Webhook trigger failed:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({ message: "Send a POST request to trigger this webhook" });
}
