"use client";

import { useReactFlow, type Node, type NodeProps } from "@xyflow/react";
import { ClockIcon } from "lucide-react";
import { memo, useState } from "react";
import { BaseExecutionNode } from "../base-execution-node";
import { WaitFormValues, WaitDialog } from "./dialog";

type WaitNodeData = {
    amount?: number;
    unit?: 'seconds' | 'minutes' | 'hours' | 'days';
};

type WaitNodeType = Node<WaitNodeData>;

export const WaitNode = memo((props: NodeProps<WaitNodeType>) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const { setNodes } = useReactFlow();

    const handleOpenSettings = () => setDialogOpen(true);

    const handleSubmit = (values: WaitFormValues) => {
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
    const description = nodeData?.amount
        ? `Wait for ${nodeData.amount} ${nodeData.unit}`
        : "Not configured";

    return (
        <>
            <WaitDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSubmit={handleSubmit}
                defaultValues={nodeData}
                nodeId={props.id}
            />
            <BaseExecutionNode
                {...props}
                id={props.id}
                category="LOGIC"
                icon={ClockIcon}
                name="Wait"
                description={description}
                onSettings={handleOpenSettings}
                onDoubleClick={handleOpenSettings}
            />
        </>
    )
});

WaitNode.displayName = "WaitNode";
