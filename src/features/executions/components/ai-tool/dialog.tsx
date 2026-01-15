
"use client";

import { useNodeData } from "@/hooks/use-node-data";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

interface AiToolDialogProps {
    nodeId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const TOOL_TYPES = [
    { value: "duckduckgo_search", label: "DuckDuckGo Search" },
    { value: "calculator", label: "Calculator" },
    { value: "custom", label: "Custom Function" },
];

export function AiToolDialog({ nodeId, open, onOpenChange }: AiToolDialogProps) {
    const [data, setData] = useNodeData(nodeId);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[400px] sm:w-[540px]">
                <SheetHeader>
                    <SheetTitle>Configure AI Tool</SheetTitle>
                </SheetHeader>

                <div className="flex flex-col gap-6 py-6">
                    {/* Tool Type Selection */}
                    <div className="flex flex-col gap-2">
                        <Label>Tool Type</Label>
                        <Select
                            value={data.toolType || "duckduckgo_search"}
                            onValueChange={(value) => setData({ ...data, toolType: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a tool type" />
                            </SelectTrigger>
                            <SelectContent>
                                {TOOL_TYPES.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            {data.toolType === "duckduckgo_search" && "Searches the internet using DuckDuckGo (Free)."}
                            {data.toolType === "calculator" && "Performs basic math calculations."}
                            {data.toolType === "custom" && "Define your own Javascript function logic."}
                        </p>
                    </div>

                    <Separator />

                    {/* Configuration based on Type */}

                    {data.toolType === "custom" && (
                        <>
                            <div className="flex flex-col gap-2">
                                <Label>Tool Name</Label>
                                <Input
                                    value={data.name || ""}
                                    onChange={(e) => setData({ ...data, name: e.target.value })}
                                    placeholder="e.g. send_email"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label>Description</Label>
                                <Textarea
                                    value={data.description || ""}
                                    onChange={(e) => setData({ ...data, description: e.target.value })}
                                    placeholder="What does this tool do? AI uses this to decide when to call it."
                                    rows={3}
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label>Function Logic (JavaScript)</Label>
                                <p className="text-xs text-muted-foreground mb-1">
                                    Async function taking 'input' string. Return string.
                                </p>
                                <Textarea
                                    value={data.func || ""}
                                    onChange={(e) => setData({ ...data, func: e.target.value })}
                                    className="font-mono text-xs"
                                    rows={10}
                                    placeholder={`// Example:
// return async (input) => {
//    return "Processed: " + input;
// }`}
                                />
                            </div>
                        </>
                    )}

                    {data.toolType !== "custom" && (
                        <div className="rounded-lg border p-4 bg-muted/50">
                            <p className="text-sm text-foreground font-medium">Auto-Configured</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                This tool comes with pre-built logic and description. You don't need to configure anything else.
                            </p>
                        </div>
                    )}

                </div>
            </SheetContent>
        </Sheet>
    );
}
