"use client";

import { BaseExecutionNode } from "../base-execution-node";
import type { NodeProps } from "@xyflow/react";
import { LayersIcon } from "lucide-react";
import { useState } from "react";
import { SubWorkflowDialog, type SubWorkflowFormValues } from "./dialog";
import { useReactFlow } from "@xyflow/react";

export const SubWorkflowNode = (props: NodeProps) => {
    const { id, data } = props;
    const [dialogOpen, setDialogOpen] = useState(false);
    const { setNodes } = useReactFlow();

    const handleSubmit = (values: SubWorkflowFormValues) => {
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

    const subWorkflowId = data?.subWorkflowId as string;
    const description = subWorkflowId ? `ID: ${subWorkflowId.substring(0, 8)}...` : "Select workflow";

    return (
        <>
            <SubWorkflowDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSubmit={handleSubmit}
                defaultValues={{
                    subWorkflowId: (data?.subWorkflowId as string) || "",
                    variableName: (data?.variableName as string) || "subWorkflowResult",
                }}
            />
            <BaseExecutionNode
                {...props}
                category="LOGIC"
                icon={LayersIcon}
                name="Execute Workflow"
                description={description}
                onDoubleClick={() => setDialogOpen(true)}
                onSettings={() => setDialogOpen(true)}
            />
        </>
    );
};
