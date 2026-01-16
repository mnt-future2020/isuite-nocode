
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
    [NodeType.GEMINI]: [
        { key: 'text', label: 'Generated Text', type: "string" },
    ],
    [NodeType.OPENAI]: [
        { key: 'text', label: 'Generated Text', type: "string" },
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
        { key: '*', label: 'All Properties', type: "any" },
    ],
    [NodeType.EMAIL]: [
        { key: 'success', label: 'Success', type: "boolean" },
        { key: 'id', label: 'Email ID', type: "string" },
    ],
    [NodeType.SCHEDULE]: [
        { key: 'triggeredAt', label: 'Triggered At', type: "string" },
        { key: 'cronExpression', label: 'Cron Expression', type: "string" },
    ],
    [NodeType.SUB_WORKFLOW]: [
        { key: 'triggeredWorkflowId', label: 'Triggered Workflow ID', type: "string" },
        { key: 'status', label: 'Trigger Status', type: "string" },
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
