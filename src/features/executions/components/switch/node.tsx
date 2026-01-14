"use client";

import { useReactFlow, type Node, type NodeProps, Position } from "@xyflow/react";
import { SplitIcon } from "lucide-react";
import { memo, useState } from "react";
import { BaseExecutionNode } from "../base-execution-node";
import { SwitchFormValues, SwitchDialog } from "./dialog";
import { BaseHandle } from "@/components/react-flow/base-handle";

type SwitchNodeData = SwitchFormValues;

type SwitchNodeType = Node<SwitchNodeData>;

export const SwitchNode = memo((props: NodeProps<SwitchNodeType>) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const { setNodes } = useReactFlow();

    const handleOpenSettings = () => setDialogOpen(true);

    const handleSubmit = (values: SwitchFormValues) => {
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
    const cases = nodeData?.cases || [];
    const defaultHandle = nodeData?.defaultHandle || "default";

    // Show compact status
    const variableLabel = nodeData?.variable ? nodeData.variable.replace(/[{}]/g, '').trim() : "Configure";

    // Compact calculation
    // Base Header (40px) + Padding (10px) + (Cases * 24px)
    const dynamicHeight = 50 + (cases.length * 24) + (defaultHandle ? 24 : 0);

    return (
        <>
            <SwitchDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSubmit={handleSubmit}
                defaultValues={nodeData}
            />
            <BaseExecutionNode
                {...props}
                id={props.id}
                category="LOGIC"
                icon={SplitIcon}
                name="Switch"
                description={variableLabel} // Put variable directly in header description
                onSettings={handleOpenSettings}
                onDoubleClick={handleOpenSettings}
                disableDefaultHandles={true}
                // Override default width to be slimmer if desired
                style={{ width: '200px', minHeight: '80px' }}
            >
                {/* Input Handle - Standard Left Center */}
                <BaseHandle
                    id="target-main"
                    type="target"
                    position={Position.Left}
                    className="!top-[40px]" // Align closer to top
                />

                {/* Body Content - purely for handles now */}
                <div className="flex flex-col w-full pt-2 gap-1.5" style={{ minHeight: dynamicHeight - 50 }}>
                    {/* Render Case Handles */}
                    {cases.map((c, index) => (
                        <div key={`case-${index}`} className="relative flex items-center justify-end h-5">
                            <span className="mr-2 text-[10px] text-muted-foreground truncate max-w-[100px] text-right">
                                {c.value}
                            </span>
                            <BaseHandle
                                id={c.outputHandle}
                                type="source"
                                position={Position.Right}
                                className="!relative !transform-none !right-[-9px]" // Slight tweak to align with border
                            />
                        </div>
                    ))}

                    {/* Render Default Handle */}
                    {defaultHandle && (
                        <div key="default" className="relative flex items-center justify-end h-5 border-t border-border/40 mt-1 pt-1">
                            <span className="mr-2 text-[10px] text-muted-foreground/70 italic text-right">
                                else
                            </span>
                            <BaseHandle
                                id={defaultHandle}
                                type="source"
                                position={Position.Right}
                                className="!relative !transform-none !right-[-9px] !bg-slate-400"
                            />
                        </div>
                    )}
                </div>
            </BaseExecutionNode>
        </>
    )
});

SwitchNode.displayName = "SwitchNode";
