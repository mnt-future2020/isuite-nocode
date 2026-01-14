"use client";

import { useReactFlow, type Node, type NodeProps, Position } from "@xyflow/react";
import { CopyIcon, WebhookIcon } from "lucide-react";
import { memo } from "react";
import { BaseExecutionNode } from "@/features/executions/components/base-execution-node";
import { BaseHandle } from "@/components/react-flow/base-handle";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

type WebhookNodeData = Record<string, unknown>;
type WebhookNodeType = Node<WebhookNodeData>;

export const WebhookNode = memo((props: NodeProps<WebhookNodeType>) => {
    const { id } = props;

    // In a real app we might want to differentiate test/prod URLs
    const webhookUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/${id}`;

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent opening settings if we just want to copy
        navigator.clipboard.writeText(webhookUrl);
        toast.success("Webhook URL copied");
    };

    return (
        <BaseExecutionNode
            {...props}
            id={id}
            icon={WebhookIcon}
            name="Webhook"
            description="POST Trigger"
            disableDefaultHandles={true}
            style={{ width: '180px' }} // Compact width
        >
            <div className="flex items-center justify-between mt-1 px-1">
                <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium">Active</span>
                </div>

                <TooltipProvider>
                    <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                            <Button
                                variant="secondary"
                                size="icon"
                                className="h-6 w-6 rounded-md bg-muted/50 hover:bg-muted text-muted-foreground"
                                onClick={handleCopy}
                            >
                                <CopyIcon className="h-3 w-3" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs max-w-[200px] break-all">
                            <p>Click to copy URL</p>
                            <p className="font-mono text-[9px] mt-1 text-muted-foreground opacity-50">{webhookUrl}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>

            <BaseHandle
                id="source"
                type="source"
                position={Position.Right}
            />
        </BaseExecutionNode>
    )
});

WebhookNode.displayName = "WebhookNode";
