"use client";

import { useReactFlow, type Node, type NodeProps } from "@xyflow/react";
import { memo, useState } from "react";
import { FileTextIcon } from "lucide-react";
import { BaseExecutionNode } from "../base-execution-node";
import { PDFGeneratorDialog, PDFGeneratorFormValues } from "./dialog";
import { useNodeStatus } from "../../hooks/use-node-status";
import { PDF_GENERATOR_CHANNEL_NAME } from "@/inngest/channels/pdf-generator";
import { fetchPDFGeneratorRealtimeToken } from "./actions";

type PDFGeneratorNodeData = PDFGeneratorFormValues;

type PDFGeneratorNodeType = Node<PDFGeneratorNodeData>;

export const PDFGeneratorNode = memo((props: NodeProps<PDFGeneratorNodeType>) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const { setNodes } = useReactFlow();

    const nodeStatus = useNodeStatus({
        nodeId: props.id,
        channel: PDF_GENERATOR_CHANNEL_NAME,
        topic: "status",
        refreshToken: fetchPDFGeneratorRealtimeToken,
    });

    const handleOpenSettings = () => setDialogOpen(true);

    const handleSubmit = (values: PDFGeneratorFormValues) => {
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
    const description = nodeData?.fileName
        ? `File: ${nodeData.fileName}`
        : "Not configured";

    return (
        <>
            <PDFGeneratorDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSubmit={handleSubmit}
                defaultValues={nodeData}
                nodeId={props.id}
            />
            <BaseExecutionNode
                {...props}
                id={props.id}
                category="DATA"
                icon={FileTextIcon}
                name="PDF Generator"
                description={description}
                status={nodeStatus}
                onSettings={handleOpenSettings}
                onDoubleClick={handleOpenSettings}
            />
        </>
    )
});

PDFGeneratorNode.displayName = "PDFGeneratorNode";
