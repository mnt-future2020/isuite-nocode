import { NodeType } from "@/generated/prisma";
import { Mail, Zap, Bot, Clock } from "lucide-react";

export const TEMPLATES = [
    {
        id: "lead-capture",
        name: "Lead Capture & Email",
        description: "Accept leads via webhook and send an instant email notification.",
        icon: Mail,
        color: "bg-blue-500/10 text-blue-500",
        nodes: [
            { id: "1", type: NodeType.WEBHOOK, position: { x: 100, y: 100 }, data: { name: "Webhook" } },
            { id: "2", type: NodeType.SET_FIELDS, position: { x: 400, y: 100 }, data: { name: "Format Data", fields: [{ key: "receivedAt", value: "{{ trigger.timestamp }}" }] } },
            { id: "3", type: NodeType.EMAIL, position: { x: 700, y: 100 }, data: { name: "Send Notification", to: "your@email.com", subject: "New Lead Received", body: "Check the lead data: {{ format_data.fields }}" } },
        ],
        edges: [
            { id: "e1-2", source: "1", target: "2" },
            { id: "e2-3", source: "2", target: "3" },
        ]
    },
    {
        id: "ai-auto-responder",
        name: "AI Auto-Responder",
        description: "Generate smart responses using Gemini AI based on incoming webhooks.",
        icon: Bot,
        color: "bg-purple-500/10 text-purple-500",
        nodes: [
            { id: "1", type: NodeType.WEBHOOK, position: { x: 100, y: 100 }, data: { name: "Incoming Msg" } },
            { id: "2", type: NodeType.GEMINI, position: { x: 400, y: 100 }, data: { name: "Generate Reply", prompt: "Respond to this message: {{ incoming_msg.body }}" } },
            { id: "3", type: NodeType.SLACK, position: { x: 700, y: 100 }, data: { name: "Post to Slack", text: "AI Response: {{ generate_reply.text }}" } },
        ],
        edges: [
            { id: "e1-2", source: "1", target: "2" },
            { id: "e2-3", source: "2", target: "3" },
        ]
    },
    {
        id: "daily-report",
        name: "Daily Report",
        description: "Fetch data from an API daily and loop through items to send reports.",
        icon: Clock,
        color: "bg-orange-500/10 text-orange-500",
        nodes: [
            { id: "1", type: NodeType.SCHEDULE, position: { x: 100, y: 100 }, data: { name: "Daily 9 AM", cronExpression: "0 9 * * *" } },
            { id: "2", type: NodeType.HTTP_REQUEST, position: { x: 400, y: 100 }, data: { name: "Fetch Data", url: "https://api.example.com/daily-stats" } },
            { id: "3", type: NodeType.LOOP, position: { x: 700, y: 100 }, data: { name: "Process Items", inputVariable: "fetch_data.data" } },
        ],
        edges: [
            { id: "e1-2", source: "1", target: "2" },
            { id: "e2-3", source: "2", target: "3" },
        ]
    }
];
