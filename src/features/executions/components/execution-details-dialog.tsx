"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface ExecutionDetailsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    execution: any;
    nodeName: string;
}

export const ExecutionDetailsDialog = ({
    open,
    onOpenChange,
    execution,
    nodeName,
}: ExecutionDetailsDialogProps) => {
    if (!execution) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle>Execution Details - {nodeName}</DialogTitle>
                        <Badge variant={execution.status === 'SUCCESS' ? 'default' : 'destructive'}>
                            {execution.status}
                        </Badge>
                    </div>
                </DialogHeader>
                <ScrollArea className="flex-1 mt-4 pr-4">
                    <div className="space-y-6">
                        <div>
                            <h4 className="text-sm font-semibold mb-2">Input</h4>
                            <pre className="bg-muted p-3 rounded-md overflow-x-auto text-xs whitespace-pre-wrap">
                                {JSON.stringify(execution.input, null, 2)}
                            </pre>
                        </div>
                        {execution.output && (
                            <div>
                                <h4 className="text-sm font-semibold mb-2">Output</h4>
                                <pre className="bg-muted p-3 rounded-md overflow-x-auto text-xs whitespace-pre-wrap">
                                    {JSON.stringify(execution.output, null, 2)}
                                </pre>
                            </div>
                        )}
                        {execution.error && (
                            <div>
                                <h4 className="text-sm font-semibold mb-2 text-destructive">Error</h4>
                                <pre className="bg-destructive/10 text-destructive p-3 rounded-md overflow-x-auto text-xs whitespace-pre-wrap border border-destructive/20">
                                    {execution.error}
                                </pre>
                            </div>
                        )}
                        <div className="text-[10px] text-muted-foreground flex gap-4">
                            <span>Started: {new Date(execution.startedAt).toLocaleString()}</span>
                            {execution.completedAt && (
                                <span>Completed: {new Date(execution.completedAt).toLocaleString()}</span>
                            )}
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};
