"use client";

import { useReactFlow, type Node, type NodeProps, Handle, Position } from "@xyflow/react";
import { memo, useState } from "react";
import { AiAgentDialog, AiAgentFormValues } from "./dialog";
import { useNodeStatus } from "../../hooks/use-node-status";
import { AI_AGENT_CHANNEL_NAME } from "@/inngest/channels/ai-agent";
import { fetchAiAgentRealtimeToken } from "./actions";
import { BotIcon, BrainCircuitIcon, HammerIcon, MessageSquareIcon, Trash2Icon, Settings2Icon, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

type AiAgentNodeData = {
    name?: string;
    role?: string;
    systemPrompt?: string;
};

type AiAgentNodeType = Node<AiAgentNodeData>;

const BottomHandle = ({ id, label, icon: Icon, className }: { id: string, label: string, icon: any, className?: string }) => (
    <div className={cn("absolute flex flex-col items-center", className)}>
        <div className="relative flex items-center justify-center">
            {/* Connection Line Visual */}
            <div className="absolute -top-4 w-px h-4 bg-slate-300 dark:bg-slate-600" />

            {/* The Handle */}
            <Handle
                type="target"
                position={Position.Bottom}
                id={id}
                className="!w-4 !h-4 !bg-white dark:!bg-slate-900 !border-2 !border-blue-500 hover:!bg-blue-50 transition-colors z-10"
                style={{ position: 'relative', transform: 'none', left: 0, bottom: 0, top: 0 }}
            />
        </div>

        {/* Label and Icon */}
        <div className="flex flex-col items-center mt-2 group cursor-pointer">
            <div className="bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm group-hover:border-blue-500 transition-colors">
                <Icon className="w-4 h-4 text-slate-500 group-hover:text-blue-500" />
            </div>
            <span className="text-[10px] font-semibold text-slate-500 mt-1 uppercase tracking-wider group-hover:text-blue-600">{label}</span>
        </div>
    </div>
);

export const AiAgentNode = memo((props: NodeProps<AiAgentNodeType>) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const { setNodes } = useReactFlow();

    const nodeStatus = useNodeStatus({
        nodeId: props.id,
        channel: AI_AGENT_CHANNEL_NAME,
        topic: "status",
        refreshToken: fetchAiAgentRealtimeToken,
    });

    const handleOpenSettings = () => setDialogOpen(true);

    // Delete Node Handler
    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation(); // Stop click from triggering selection
        setNodes((nodes) => nodes.filter((n) => n.id !== props.id));
    };

    const handleSubmit = (values: AiAgentFormValues) => {
        setNodes((nodes) => nodes.map((node) => {
            if (node.id === props.id) {
                return {
                    ...node,
                    data: {
                        ...node.data,
                        ...values,
                    }
                }
            }
            return node;
        }))
    };

    const nodeData = props.data;
    const isSelected = props.selected;

    return (
        <>
            <AiAgentDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSubmit={handleSubmit}
                defaultValues={nodeData}
                nodeId={props.id}
            />

            <div className={cn(
                "group relative flex flex-col items-center",
                "min-w-[200px]"
            )}>
                {/* Visual Selection Ring */}
                {isSelected && (
                    <div className="absolute inset-0 -m-1 border-2 border-blue-500 rounded-2xl pointer-events-none z-0" />
                )}

                {/* Main Action Bar (Settings / Delete) - visible on hover/select */}
                <div className={cn(
                    "absolute -top-8 flex gap-1 opacity-0 transition-opacity duration-200",
                    (isSelected || props.dragging) && "opacity-100",
                    "group-hover:opacity-100"
                )}>
                    <button
                        onClick={handleOpenSettings}
                        className="p-1.5 bg-white dark:bg-slate-800 rounded-md shadow-sm border hover:bg-slate-50 text-slate-500 hover:text-blue-600"
                    >
                        <Settings2Icon className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={handleDelete}
                        className="p-1.5 bg-white dark:bg-slate-800 rounded-md shadow-sm border hover:bg-red-50 text-slate-500 hover:text-red-500"
                    >
                        <Trash2Icon className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* Main Node Body */}
                <div
                    className={cn(
                        "relative z-10 w-full bg-white dark:bg-slate-900",
                        "border-2 border-slate-200 dark:border-slate-700",
                        isSelected ? "border-blue-500 dark:border-blue-400" : "hover:border-blue-300",
                        "rounded-2xl shadow-sm transition-all duration-200",
                        "flex items-center p-3 gap-3"
                    )}
                    onDoubleClick={handleOpenSettings}
                >
                    {/* Input Handle (Workflow Flow) */}
                    <Handle
                        type="target"
                        position={Position.Left}
                        id="target"
                        className="!w-3 !h-3 !bg-slate-400 !border-2 !border-white dark:!border-slate-900"
                    />

                    {/* Node Icon */}
                    <div className={cn(
                        "flex items-center justify-center w-10 h-10 rounded-xl",
                        "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                    )}>
                        <BotIcon className="w-6 h-6" strokeWidth={1.5} />
                    </div>

                    {/* Node Info */}
                    <div className="flex flex-col">
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                            {nodeData.name || "AI Agent"}
                        </span>
                        <span className="text-[10px] text-slate-500 uppercase font-medium tracking-wide">
                            {nodeData.role || "Assistant"}
                        </span>
                    </div>

                    {/* Status Indicator (Mini) */}
                    {nodeStatus === 'loading' && (
                        <div className="absolute top-2 right-2 animate-spin w-2 h-2 rounded-full border-2 border-blue-500 border-t-transparent" />
                    )}
                    {nodeStatus === 'error' && (
                        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500" />
                    )}

                    {/* Output Handle */}
                    <Handle
                        type="source"
                        position={Position.Right}
                        id="source"
                        className="!w-3 !h-3 !bg-slate-400 !border-2 !border-white dark:!border-slate-900"
                    />
                </div>

                {/* Bottom Connection Area - Spaced Out */}
                <div className="relative mt-8 w-full h-12 flex justify-center">
                    {/* Chat Model Handle - Left side */}
                    <BottomHandle
                        id="chat-model-input"
                        label="Chat Model"
                        icon={BrainCircuitIcon}
                        className="left-0 -bottom-2"
                    />

                    {/* Memory Handle - Center */}
                    <BottomHandle
                        id="memory-input"
                        label="Memory"
                        icon={BrainCircuitIcon}
                        className="left-1/2 -translate-x-1/2 -bottom-2"
                    />

                    {/* Tool Handle - Right side */}
                    <BottomHandle
                        id="tool-input"
                        label="Tools"
                        icon={HammerIcon}
                        className="right-0 -bottom-2"
                    />
                </div>
            </div>
        </>
    )
});

AiAgentNode.displayName = "AiAgentNode";
