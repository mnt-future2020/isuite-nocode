"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ExpressionInput } from "@/components/expression-input";
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
import { VariablePicker } from "@/components/variable-picker";
import { NodeEditorWorkspace } from "@/components/node-editor-workspace";
import { useNodeInputData } from "@/hooks/use-node-input-schema";
import { useTestNode } from "@/hooks/use-test-node";
import { NodeType } from "@/generated/prisma";
import { useParams } from "next/navigation";
import { useState } from "react";

const conditionSchema = z.object({
    variable: z.string().min(1, "Variable is required"),
    operator: z.enum([
        "equals",
        "not_equals",
        "contains",
        "not_contains",
        "greater_than",
        "less_than",
    ]),
    value: z.string().min(1, "Value is required"),
});

export type ConditionFormValues = z.infer<typeof conditionSchema>;

interface ConditionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (values: ConditionFormValues) => void;
    defaultValues?: Partial<ConditionFormValues>;
    nodeId?: string;
}

export const ConditionDialog = ({
    open,
    onOpenChange,
    onSubmit,
    defaultValues,
    nodeId,
}: ConditionDialogProps) => {
    const params = useParams();
    const workflowId = params.workflowId as string;

    // Get available input variables from upstream nodes
    const inputData = useNodeInputData(nodeId);

    const [contextInput, setContextInput] = useState('{}');

    const { testResult, testError, isPending, runTest } = useTestNode({
        workflowId,
        nodeId,
        nodeType: NodeType.CONDITION,
    });

    const form = useForm<ConditionFormValues>({
        resolver: zodResolver(conditionSchema),
        defaultValues: {
            variable: defaultValues?.variable || "",
            operator: defaultValues?.operator || "equals",
            value: defaultValues?.value || "",
        },
    });

    const handleFormSubmit = (values: ConditionFormValues) => {
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
                    <DialogTitle>Configure Condition</DialogTitle>
                </VisuallyHidden.Root>
                <NodeEditorWorkspace
                    title="If / Else Condition"
                    description="Branch logic based on a condition."
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
                                name="variable"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Variable / Expression</FormLabel>
                                        <FormControl>
                                            <ExpressionInput
                                                placeholder="{{ trigger.email }}"
                                                nodeId={nodeId}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="operator"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Operator</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select operator" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="equals">Equals</SelectItem>
                                                <SelectItem value="not_equals">Not Equals</SelectItem>
                                                <SelectItem value="contains">Contains</SelectItem>
                                                <SelectItem value="not_contains">Not Contains</SelectItem>
                                                <SelectItem value="greater_than">Greater Than</SelectItem>
                                                <SelectItem value="less_than">Less Than</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="value"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Value</FormLabel>
                                        <FormControl>
                                            <ExpressionInput
                                                placeholder="value to compare"
                                                nodeId={nodeId}
                                                {...field}
                                            />
                                        </FormControl>
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
