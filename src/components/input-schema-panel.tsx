"use client";

import React, { useState } from "react";
import { ChevronRight, ChevronDown, Package, Braces, Hash, Type, List, ToggleLeft, FileJson, Copy, Check, Database } from "lucide-react";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { JsonTreeView } from "./json-tree-view";

interface NodeInputData {
    nodeId: string;
    nodeName: string;
    variableName: string;
    nodeType: string;
    output: any;
    isMock?: boolean;
}

interface InputDataPanelProps {
    nodeInputs: NodeInputData[];
}

const NodeDataGroup = ({
    nodeData,
}: {
    nodeData: NodeInputData;
}) => {
    const [isOpen, setIsOpen] = useState(true);
    const [copied, setCopied] = useState(false);
    const isMock = nodeData.isMock;

    const handleCopyVariable = () => {
        navigator.clipboard.writeText(`{{ ${nodeData.variableName} }}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-3">
            <CollapsibleTrigger className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-muted/50 rounded-md transition-colors">
                {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                <div className={cn("h-2 w-2 rounded-full", isMock ? "bg-amber-400" : "bg-green-500")} />
                <span className="text-[11px] font-bold uppercase tracking-wide flex-1 text-left truncate">
                    {nodeData.nodeName}
                </span>
                <code className="text-[9px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                    {nodeData.variableName}
                </code>
            </CollapsibleTrigger>
            <CollapsibleContent className={cn("ml-4 mt-1 border-l-2 pl-2", isMock ? "border-amber-400/20" : "border-green-500/20")}>
                {isMock && (
                    <div className="px-2 py-1 mb-2 bg-amber-50 dark:bg-amber-950/20 rounded border border-amber-100 dark:border-amber-900/30 text-[10px] text-amber-700 dark:text-amber-400">
                        Showing schema (not real data)
                    </div>
                )}
                <div className="mb-2 flex items-center gap-2">
                    <button
                        onClick={handleCopyVariable}
                        className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-mono text-primary bg-primary/5 hover:bg-primary/10 rounded border border-primary/20 transition-colors"
                    >
                        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {`{{ ${nodeData.variableName} }}`}
                    </button>
                </div>
                <div className="p-2 bg-muted/30 rounded-md border border-dashed">
                    <JsonTreeView data={nodeData.output} label={isMock ? "Schema" : "Output"} path={nodeData.variableName} defaultExpanded />
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
};

export const InputDataPanelComponent = ({ nodeInputs }: InputDataPanelProps) => {
    if (nodeInputs.length === 0) {
        return (
            <div className="py-16 flex flex-col items-center justify-center text-center opacity-40 select-none">
                <Database className="h-10 w-10 mb-3 text-muted-foreground" />
                <p className="text-xs font-bold mb-1">No Input Data</p>
                <p className="text-[10px] text-muted-foreground max-w-[180px]">
                    Run the workflow first to see output data from upstream nodes
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-1">
            <div className="px-2 py-1.5 mb-2">
                <p className="text-[10px] text-muted-foreground">
                    Data from previous node executions. Click variable to copy.
                </p>
            </div>
            {nodeInputs.map(nodeData => (
                <NodeDataGroup
                    key={nodeData.nodeId}
                    nodeData={nodeData}
                />
            ))}
        </div>
    );
};

// Re-export the old component for backward compatibility
export const InputDataPanel = React.memo(InputDataPanelComponent);

// Re-export the old component for backward compatibility
export { InputDataPanel as InputSchemaPanel };
