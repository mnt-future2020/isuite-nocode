"use client";

import { BaseExecutionNode } from "../base-execution-node";
import type { NodeProps } from "@xyflow/react";
import { RepeatIcon } from "lucide-react";
import { useState } from "react";
import { LoopDialog, type LoopFormValues } from "./dialog";
import { useReactFlow } from "@xyflow/react";

export const LoopNode = (props: NodeProps) => {
    const { id, data } = props;
    const [dialogOpen, setDialogOpen] = useState(false);
    const { setNodes } = useReactFlow();

    const handleSubmit = (values: LoopFormValues) => {
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

    // Show item count hint if configured
    const inputVar = data?.inputVariable as string;
    const description = inputVar
        ? `Over ${inputVar.replace(/[{}]/g, '').split('.').pop()}`
        : "For Each";

    return (
        <>
            <LoopDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSubmit={handleSubmit}
                defaultValues={{
                    variableName: (data?.variableName as string) || "loopResult",
                    inputVariable: (data?.inputVariable as string) || "",
                    code: (data?.code as string) || "",
                }}
                nodeId={id}
            />
            <BaseExecutionNode
                {...props}
                category="LOGIC"
                icon={RepeatIcon}
                name="Loop"
                description={description}
                onDoubleClick={() => setDialogOpen(true)}
                onSettings={() => setDialogOpen(true)}
            />
        </>
    );
};
