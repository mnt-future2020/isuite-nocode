import { useState } from "react";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { NodeType } from "@/generated/prisma";
import { NodeOutputData } from "./use-node-input-schema";

interface UseTestNodeOptions {
    workflowId: string;
    nodeId?: string;
    nodeType: NodeType;
}

export const useTestNode = ({
    workflowId,
    nodeId,
    nodeType,
}: UseTestNodeOptions) => {
    const trpc = useTRPC();
    const [testResult, setTestResult] = useState<any>(null);
    const [testError, setTestError] = useState<string | null>(null);

    const testMutation = useMutation(
        trpc.workflows.testNode.mutationOptions({
            onSuccess: (data: any) => {
                setTestResult(data);
                setTestError(null);
            },
            onError: (err: any) => {
                setTestError(err.message);
                setTestResult(null);
            }
        })
    );

    const runTest = (data: any, contextInput: string, inputData?: NodeOutputData[]) => {
        try {
            const context = JSON.parse(contextInput || '{}');

            // Automatically inject upstream data into the test context
            if (inputData) {
                inputData.forEach(node => {
                    if (node.variableName && node.output) {
                        context[node.variableName] = node.output;
                    }
                });
            }

            testMutation.mutate({
                nodeType,
                data,
                workflowId,
                nodeId: nodeId || "",
                context,
            });
        } catch (e: any) {
            setTestError("Invalid JSON in input data");
        }
    };

    return {
        testResult,
        setTestResult,
        testError,
        setTestError,
        isPending: testMutation.isPending,
        runTest,
    };
};
