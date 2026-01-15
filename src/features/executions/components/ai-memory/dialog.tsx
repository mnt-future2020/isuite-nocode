"use client";

import { useNodeData } from "@/hooks/use-node-data";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface AiMemoryDialogProps {
    nodeId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface AiMemoryData {
    memoryType?: string;
    k?: number;
}

export function AiMemoryDialog({ nodeId, open, onOpenChange }: AiMemoryDialogProps) {
    const [data, setData] = useNodeData<AiMemoryData>(nodeId);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Configure AI Memory</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-6 py-2">
                    <div className="flex flex-col gap-2">
                        <Label>Memory Type</Label>
                        <Select
                            value={data.memoryType || "buffer_window"}
                            onValueChange={(value) => setData({ ...data, memoryType: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select memory type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="buffer_window">Buffer Window Memory</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            Keeps a rolling window of recent messages.
                        </p>
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label>Window Size (k)</Label>
                        <Input
                            type="number"
                            value={data.k || 5}
                            onChange={(e) => setData({ ...data, k: parseInt(e.target.value) || 5 })}
                            min={1}
                            max={50}
                        />
                        <p className="text-xs text-muted-foreground">
                            Number of recent interactions to keep in context.
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
