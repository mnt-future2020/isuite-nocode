"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNodeInputData } from "@/hooks/use-node-input-schema";
import { useTestNode } from "@/hooks/use-test-node";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlayIcon, AlertCircleIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NodeType } from "@/generated/prisma";

interface NodeTesterProps {
    nodeType: NodeType;
    data: Record<string, any>;
    workflowId: string;
    nodeId: string;
    className?: string;
}

export const NodeTester = ({ nodeType, data, workflowId, nodeId, className }: NodeTesterProps) => {
    // Get available input variables from upstream nodes
    const inputData = useNodeInputData(nodeId);

    const [contextInput, setContextInput] = useState('{}');

    const { testResult, testError: error, isPending, runTest } = useTestNode({
        workflowId,
        nodeId,
        nodeType,
    });

    const handleRunTest = async () => {
        runTest(data, contextInput, inputData);
    };

    return (
        <div className={cn("space-y-4 border-t pt-6 mt-6", className)}>
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="text-sm font-semibold">Test Step</h4>
                    <p className="text-xs text-muted-foreground">Verify this node's output with mock data before running the full workflow.</p>
                </div>
                <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleRunTest}
                    disabled={isPending}
                    className="bg-primary/10 hover:bg-primary/20 text-primary border-primary/20"
                >
                    {isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <PlayIcon className="h-4 w-4 mr-2" />
                    )}
                    Run Test
                </Button>
            </div>

            <div className="grid grid-cols-2 gap-4 min-h-[180px]">
                <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground px-1">Input Data (Context)</span>
                    <Textarea
                        className="flex-1 font-mono text-xs bg-muted/20"
                        value={contextInput}
                        onChange={(e) => setContextInput(e.target.value)}
                        placeholder='{"webhook": {"body": {"foo": "bar"}}}'
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground px-1">Output Result</span>
                    <ScrollArea className="flex-1 border rounded-md bg-muted/10 p-2">
                        {testResult ? (
                            <pre className="text-[11px] font-mono text-green-600 dark:text-green-400 whitespace-pre-wrap">
                                {JSON.stringify(testResult, null, 2)}
                            </pre>
                        ) : error ? (
                            <div className="text-[11px] text-destructive flex items-start gap-2 p-1">
                                <AlertCircleIcon className="h-3 w-3 mt-0.5 shrink-0" />
                                <span className="break-all">{error}</span>
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center p-4">
                                <span className="text-xs text-muted-foreground italic text-center opacity-60">
                                    Provide context on the left and click "Run Test"
                                </span>
                            </div>
                        )}
                    </ScrollArea>
                </div>
            </div>
        </div>
    );
};
