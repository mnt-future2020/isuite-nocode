"use client";

import { BaseExecutionNode } from "@/features/executions/components/base-execution-node";
import type { NodeProps } from "@xyflow/react";
import { CalendarClockIcon } from "lucide-react";
import { useState } from "react";
import { ScheduleDialog, type ScheduleFormValues } from "./dialog";
import { useReactFlow } from "@xyflow/react";

export const ScheduleNode = (props: NodeProps) => {
    const { id, data } = props;
    const [dialogOpen, setDialogOpen] = useState(false);
    const { setNodes } = useReactFlow();

    const handleSubmit = (values: ScheduleFormValues) => {
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

    // Format cron for display
    const cronExp = data?.cronExpression as string;
    const description = cronExp || "Configure";

    return (
        <>
            <ScheduleDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSubmit={handleSubmit}
                defaultValues={{
                    cronExpression: (data?.cronExpression as string) || "",
                    timezone: (data?.timezone as string) || "Asia/Kolkata",
                }}
            />
            <BaseExecutionNode
                {...props}
                icon={CalendarClockIcon}
                name="Schedule"
                description={description}
                onDoubleClick={() => setDialogOpen(true)}
                onSettings={() => setDialogOpen(true)}
            />
        </>
    );
};
