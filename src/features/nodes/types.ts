
import { NodeType } from "@/generated/prisma";

export interface NodeVariable {
    key: string;
    label: string;
    description?: string;
    type?: "string" | "number" | "boolean" | "object" | "array" | "any";
}

export const NODE_VARIABLE_SCHEMAS: Record<string, NodeVariable[]> = {
    [NodeType.WEBHOOK]: [
        { key: 'body', label: 'Body (JSON)', type: "object" },
        { key: 'query', label: 'Query Parameters', type: "object" },
        { key: 'headers', label: 'Headers', type: "object" },
        { key: 'method', label: 'HTTP Method', type: "string" },
    ],
    [NodeType.SWITCH]: [
        { key: 'match', label: 'Is Matched', type: "boolean" },
        { key: 'matchedValue', label: 'Matched Value', type: "string" },
        { key: '__branch', label: 'Branch', type: "string" },
    ],
    [NodeType.GOOGLE_FORM_TRIGGER]: [
        { key: 'body', label: 'Form Response', type: "object" },
    ],
    [NodeType.WHATSAPP_TRIGGER]: [
        { key: 'from', label: 'Sender', type: "string" },
        { key: 'body', label: 'Message Body', type: "string" },
    ],
    [NodeType.STRIPE_TRIGGER]: [
        { key: 'type', label: 'Event Type', type: "string" },
        { key: 'data.object', label: 'Event Object', type: "object" },
    ],
    [NodeType.GEMINI]: [
        { key: 'text', label: 'Generated Text', type: "string" },
    ],
    [NodeType.OPENAI]: [
        { key: 'text', label: 'Generated Text', type: "string" },
    ],
    [NodeType.DISCORD]: [
        { key: 'messageContent', label: 'Message Content', type: "string" },
    ],
    [NodeType.SLACK]: [
        { key: 'messageContent', label: 'Message Content', type: "string" },
    ],
    [NodeType.ANTHROPIC]: [
        { key: 'text', label: 'Generated Text', type: "string" },
    ],
    [NodeType.HTTP_REQUEST]: [
        { key: 'httpResponse.data', label: 'Response Data', type: "any" },
        { key: 'httpResponse.status', label: 'Status Code', type: "number" },
        { key: 'httpResponse.headers', label: 'Response Headers', type: "object" },
    ],
    [NodeType.MANUAL_TRIGGER]: [
        { key: 'email', label: 'User Email', type: "string" },
        { key: 'userId', label: 'User ID', type: "string" },
        { key: 'body', label: 'Raw Body', type: "object" },
    ],
    [NodeType.SET_FIELDS]: [
        { key: 'fields', label: 'Fields Object', type: "object" },
        { key: '*', label: 'All Fields', type: "any" },
    ],
    [NodeType.MERGE]: [
        { key: 'merged', label: 'Merged Object', type: "object" },
        { key: '*0', label: 'All Properties', type: "any" },
    ],
    [NodeType.CONDITION]: [
        { key: 'conditionMet', label: 'Condition Met', type: "boolean" },
        { key: '__branch', label: 'Branch', type: "string" },
    ],
    [NodeType.EMAIL]: [
        { key: 'success', label: 'Success', type: "boolean" },
        { key: 'id', label: 'Email ID', type: "string" },
    ],
    [NodeType.GMAIL]: [
        { key: 'messageId', label: 'Message ID', type: "string" },
        { key: 'threadId', label: 'Thread ID', type: "string" },
        { key: 'snippet', label: 'Snippet', type: "string" },
    ],
    [NodeType.ERROR_TRIGGER]: [
        { key: 'error.message', label: 'Error Message', type: "string" },
        { key: 'error.nodeId', label: 'Failed Node', type: "string" },
        { key: 'error.timestamp', label: 'Error Time', type: "string" },
    ],
    [NodeType.SCHEDULE]: [
        { key: 'triggeredAt', label: 'Triggered At', type: "string" },
        { key: 'cronExpression', label: 'Cron Expression', type: "string" },
    ],
    [NodeType.SUB_WORKFLOW]: [
        { key: 'triggeredWorkflowId', label: 'Triggered Workflow ID', type: "string" },
        { key: 'status', label: 'Trigger Status', type: "string" },
    ],
    [NodeType.JSON_TRANSFORMER]: [
        { key: '*', label: 'Transformed Data', type: "any" },
    ],
    [NodeType.WHATSAPP_SEND]: [
        { key: 'messages', label: 'Messages', type: "array" },
        { key: 'contacts', label: 'Contacts', type: "array" },
    ],
    [NodeType.CODE]: [
        { key: '*', label: 'Output (Custom)', type: "any" },
    ],
    [NodeType.LOOP]: [
        { key: '[*]', label: 'Array of Results', type: "array" },
        { key: 'currentItem', label: 'Current Item (Inside Loop)', type: "any" },
        { key: 'index', label: 'Current Index (Inside Loop)', type: "number" },
    ],
    [NodeType.AI_AGENT]: [
        { key: 'output', label: 'Agent Output', type: "string" },
        { key: 'intermediateSteps', label: 'Thought Process', type: "array" },
    ],
    [NodeType.GOOGLE_SHEETS]: [
        { key: '*', label: 'All Data / Result', type: "any" },
    ],
    [NodeType.AI_MEMORY]: [
        { key: 'provider', label: 'Memory Provider', type: "string" },
        { key: 'config', label: 'Configuration', type: "object" },
    ],
    [NodeType.AI_TOOL]: [
        { key: 'provider', label: 'Tool Provider', type: "string" },
        { key: 'toolName', label: 'Tool Name', type: "string" },
        { key: 'toolDescription', label: 'Tool Description', type: "string" },
        { key: 'config', label: 'Configuration', type: "object" },
    ],
    [NodeType.POSTGRES]: [
        { key: '*', label: 'All Rows', type: "array" },
    ],
    [NodeType.MYSQL]: [
        { key: '*', label: 'All Rows', type: "array" },
    ],
    [NodeType.PDF_GENERATOR]: [
        { key: 'data', label: 'PDF Binary', type: "any" },
        { key: 'fileName', label: 'File Name', type: "string" },
    ],
};

export const getNodeVariables = (nodeType: string): NodeVariable[] => {
    return NODE_VARIABLE_SCHEMAS[nodeType] || [];
};

export const generateMockData = (nodeType: string): Record<string, any> => {
    const variables = NODE_VARIABLE_SCHEMAS[nodeType] || [];
    const mockData: Record<string, any> = {};

    for (const variable of variables) {
        if (variable.key === '*') continue;
        if (variable.key.includes('.')) {
            // Handle nested keys like httpResponse.data
            const parts = variable.key.split('.');
            let current = mockData;
            for (let i = 0; i < parts.length - 1; i++) {
                if (!current[parts[i]]) current[parts[i]] = {};
                current = current[parts[i]];
            }
            current[parts[parts.length - 1]] = `(${variable.type || 'any'})`;
        } else {
            mockData[variable.key] = `(${variable.type || 'any'})`;
        }
    }
    return mockData;
};
