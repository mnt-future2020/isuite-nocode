"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    VisuallyHidden,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ExpressionInput } from "@/components/expression-input";
import { NodeEditorWorkspace } from "@/components/node-editor-workspace";
import { useNodeInputData } from "@/hooks/use-node-input-schema";
import { useTestNode } from "@/hooks/use-test-node";
import { NodeType } from "@/generated/prisma";
import { useParams } from "next/navigation";
import { useState } from "react";

const waitSchema = z.object({
    amount: z.union([z.number(), z.string().min(1, "Amount is required")]),
    unit: z.enum(["seconds", "minutes", "hours", "days"]),
});

export type WaitFormValues = z.infer<typeof waitSchema>;

interface WaitDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (values: WaitFormValues) => void;
    defaultValues?: Partial<WaitFormValues>;
    nodeId?: string;
}

export const WaitDialog = ({
    open,
    onOpenChange,
    onSubmit,
    defaultValues,
    nodeId,
}: WaitDialogProps) => {
    const params = useParams();
    const workflowId = params.workflowId as string;

    // Get available input variables from upstream nodes
    const inputData = useNodeInputData(nodeId);

    const [contextInput, setContextInput] = useState('{}');

    const { testResult, testError, isPending, runTest } = useTestNode({
        workflowId,
        nodeId,
        nodeType: NodeType.WAIT,
    });
    const form = useForm<WaitFormValues>({
        resolver: zodResolver(waitSchema),
        defaultValues: {
            amount: defaultValues?.amount || 1,
            unit: defaultValues?.unit || "minutes",
        },
    });

    const handleFormSubmit = (values: WaitFormValues) => {
        onSubmit(values);
        onOpenChange(false);
    };

    const handleRunTest = () => {
        runTest(form.getValues(), contextInput, inputData);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent fullScreen>
                <VisuallyHidden.Root>
                    <DialogTitle>Configure Wait</DialogTitle>
                </VisuallyHidden.Root>
                <NodeEditorWorkspace
                    title="Wait / Delay"
                    description="Pause execution for a specific duration."
                    testInput={JSON.parse(contextInput || '{}')}
                    onTestInputChange={setContextInput}
                    testResult={testResult}
                    testError={testError}
                    onRunTest={handleRunTest}
                    isPending={isPending}
                    onClose={() => onOpenChange(false)}
                    inputData={inputData}
                >
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Amount</FormLabel>
                                        <FormControl>
                                            <ExpressionInput
                                                placeholder="10 or {{ trigger.duration }}"
                                                nodeId={nodeId}
                                                {...field}
                                                onChange={(val) => {
                                                    // Try to parse as number if possible, otherwise string
                                                    const num = parseFloat(val);
                                                    if (!isNaN(num) && val === num.toString()) {
                                                        field.onChange(num);
                                                    } else {
                                                        field.onChange(val);
                                                    }
                                                }}
                                                value={field.value?.toString() || ""}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="unit"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Unit</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select unit" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="seconds">Seconds</SelectItem>
                                                <SelectItem value="minutes">Minutes</SelectItem>
                                                <SelectItem value="hours">Hours</SelectItem>
                                                <SelectItem value="days">Days</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="pt-6 border-t flex justify-end">
                                <Button type="submit" size="lg" className="px-10 font-bold shadow-lg">
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    </Form>
                </NodeEditorWorkspace>
            </DialogContent>
        </Dialog>
    );
};
