"use client";

import { BaseExecutionNode } from "../base-execution-node";
import type { NodeProps } from "@xyflow/react";
import { MergeIcon } from "lucide-react";
import { useState } from "react";
import { MergeDialog, type MergeFormValues } from "./dialog";
import { useReactFlow, Position } from "@xyflow/react";
import { BaseHandle } from "@/components/react-flow/base-handle";

export const MergeNode = (props: NodeProps) => {
    const { id, data } = props;
    const [dialogOpen, setDialogOpen] = useState(false);
    const { setNodes } = useReactFlow();

    const handleSubmit = (values: MergeFormValues) => {
        setNodes((nodes) =>
            nodes.map((node) => {
                if (node.id === id) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            ...values,
                        },
                    };
                }
                return node;
            })
        );
    };

    const mode = (data?.mode as string) || "merge";

    return (
        <>
            <MergeDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSubmit={handleSubmit}
                defaultValues={{
                    variableName: (data?.variableName as string) || "merged",
                    mode: (data?.mode as "append" | "merge" | "keepFirst") || "merge",
                }}
                nodeId={id}
            />
            <BaseExecutionNode
                {...props}
                category="LOGIC"
                icon={MergeIcon}
                name="Merge"
                description={mode}
                onDoubleClick={() => setDialogOpen(true)}
                onSettings={() => setDialogOpen(true)}
                disableDefaultHandles
            >
                {/* Multiple inputs on left */}
                <div className="absolute -left-12 top-[22%] text-[10px] text-muted-foreground font-medium">Input 1</div>
                <BaseHandle id="input-1" type="target" position={Position.Left} style={{ top: "30%" }} />

                <div className="absolute -left-12 top-[62%] text-[10px] text-muted-foreground font-medium">Input 2</div>
                <BaseHandle id="input-2" type="target" position={Position.Left} style={{ top: "70%" }} />

                {/* Single output */}
                <BaseHandle id="output" type="source" position={Position.Right} />
            </BaseExecutionNode>
        </>
    );
};
