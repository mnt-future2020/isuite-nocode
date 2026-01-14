"use client";

import { useReactFlow, type Node, type NodeProps, Position } from "@xyflow/react";
import { GitBranchIcon } from "lucide-react";
import { memo, useState } from "react";
import { BaseExecutionNode } from "../base-execution-node";
import { ConditionFormValues, ConditionDialog } from "./dialog";
import { BaseHandle } from "@/components/react-flow/base-handle";

type ConditionNodeData = {
    variable?: string;
    operator?: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than';
    value?: string;
};

type ConditionNodeType = Node<ConditionNodeData>;

export const ConditionNode = memo((props: NodeProps<ConditionNodeType>) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const { setNodes } = useReactFlow();

    const handleOpenSettings = () => setDialogOpen(true);

    const handleSubmit = (values: ConditionFormValues) => {
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
    const description = nodeData?.variable
        ? `${nodeData.variable} ${nodeData.operator} ${nodeData.value}`
        : "Not configured";

    return (
        <>
            <ConditionDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSubmit={handleSubmit}
                defaultValues={nodeData}
            />
            <BaseExecutionNode
                {...props}
                id={props.id}
                category="LOGIC"
                icon={GitBranchIcon}
                name="If / Condition"
                description={description}
                onSettings={handleOpenSettings}
                onDoubleClick={handleOpenSettings}
            >
                {/* Custom handles for Condition Node */}
                <BaseHandle
                    id="true"
                    type="source"
                    position={Position.Right}
                    style={{ top: '30%', backgroundColor: '#22c55e' }}
                />
                <div style={{ position: 'absolute', right: -40, top: '22%', fontSize: '10px', color: '#22c55e' }}>True</div>

                <BaseHandle
                    id="false"
                    type="source"
                    position={Position.Right}
                    style={{ top: '70%', backgroundColor: '#ef4444' }}
                />
                <div style={{ position: 'absolute', right: -40, top: '62%', fontSize: '10px', color: '#ef4444' }}>False</div>
            </BaseExecutionNode>
        </>
    )
});

ConditionNode.displayName = "ConditionNode";
