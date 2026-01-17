"use client";

import { BaseExecutionNode } from "../base-execution-node";
import type { NodeProps } from "@xyflow/react";
import { CodeIcon } from "lucide-react";
import { useState } from "react";
import { CodeDialog, type CodeFormValues } from "./dialog";
import { useReactFlow } from "@xyflow/react";

export const CodeNode = (props: NodeProps) => {
    const { id, data } = props;
    const [dialogOpen, setDialogOpen] = useState(false);
    const { setNodes } = useReactFlow();

    const handleSubmit = (values: CodeFormValues) => {
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

    return (
        <>
            <CodeDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSubmit={handleSubmit}
                defaultValues={{
                    variableName: (data?.variableName as string) || "codeResult",
                    code: (data?.code as string) || "",
                }}
                nodeId={id}
            />
            <BaseExecutionNode
                {...props}
                category="DATA"
                icon={CodeIcon}
                name="Code"
                description="JavaScript"
                onDoubleClick={() => setDialogOpen(true)}
                onSettings={() => setDialogOpen(true)}
            />
        </>
    );
};
