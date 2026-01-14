"use client";

import { BaseExecutionNode } from "@/features/executions/components/base-execution-node";
import type { NodeProps } from "@xyflow/react";
import { AlertTriangleIcon } from "lucide-react";

export const ErrorTriggerNode = (props: NodeProps) => {
    return (
        <BaseExecutionNode
            {...props}
            category="TRIGGER"
            icon={AlertTriangleIcon}
            name="Error Trigger"
            description="Runs when any node fails"
        />
    );
};
