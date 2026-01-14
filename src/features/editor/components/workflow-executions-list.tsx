"use client";

import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { Loader2Icon, CheckCircle2Icon, XCircleIcon, ClockIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useSetAtom, useAtomValue } from "jotai";
import { selectedExecutionIdAtom } from "../store/atoms";
import { cn } from "@/lib/utils";
import { ExecutionStatus } from "@/generated/prisma";

const getStatusIcon = (status: ExecutionStatus) => {
    switch (status) {
        case ExecutionStatus.SUCCESS:
            return <CheckCircle2Icon className="size-4 text-green-600" />;
        case ExecutionStatus.FAILED:
            return <XCircleIcon className="size-4 text-red-600" />;
        case ExecutionStatus.RUNNING:
            return <Loader2Icon className="size-4 text-blue-600 animate-spin" />;
        default:
            return <ClockIcon className="size-4 text-muted-foreground" />;
    }
}

export const WorkflowExecutionsList = ({ workflowId }: { workflowId: string }) => {
    const trpc = useTRPC();
    const setSelectedExecutionId = useSetAtom(selectedExecutionIdAtom);
    const selectedExecutionId = useAtomValue(selectedExecutionIdAtom);

    const { data, isLoading } = useQuery(
        trpc.executions.getMany.queryOptions({
            workflowId,
            pageSize: 20 // Fetch last 20
        })
    );

    if (isLoading) {
        return <div className="p-4 flex justify-center"><Loader2Icon className="animate-spin text-muted-foreground" /></div>;
    }

    if (!data?.items.length) {
        return <div className="p-4 text-sm text-muted-foreground text-center">No executions yet.</div>;
    }

    return (
        <div className="flex flex-col">
            {data.items.map((execution) => (
                <button
                    key={execution.id}
                    className={cn(
                        "flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors border-b last:border-0 w-full",
                        selectedExecutionId === execution.id && "bg-muted border-l-4 border-l-primary"
                    )}
                    onClick={() => setSelectedExecutionId(execution.id)}
                >
                    <div className="shrink-0">
                        {getStatusIcon(execution.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                            {formatDistanceToNow(execution.startedAt, { addSuffix: true })}
                        </div>
                        <div className="text-xs text-muted-foreground flex gap-2">
                            <span>{execution.status}</span>
                            {execution.completedAt && (
                                <span>• {Math.round((new Date(execution.completedAt).getTime() - new Date(execution.startedAt).getTime()) / 1000)}s</span>
                            )}
                        </div>
                    </div>
                </button>
            ))}
        </div>
    );
};
