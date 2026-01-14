"use client";

import { useForm, useFieldArray } from "react-hook-form";
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
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusIcon, TrashIcon } from "lucide-react";
import { NodeEditorWorkspace } from "@/components/node-editor-workspace";
import { ExpressionInput } from "@/components/expression-input";
import { useNodeInputData } from "@/hooks/use-node-input-schema";
import { useTestNode } from "@/hooks/use-test-node";
import { NodeType } from "@/generated/prisma";
import { useParams } from "next/navigation";
import { useState } from "react";

const switchSchema = z.object({
    variable: z.string().min(1, "Variable is required"),
    defaultHandle: z.string().optional(),
    cases: z.array(z.object({
        value: z.string().min(1, "Value is required"),
        outputHandle: z.string().min(1, "Output handle name is required"),
    })),
});

export type SwitchFormValues = z.infer<typeof switchSchema>;

interface SwitchDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (values: SwitchFormValues) => void;
    defaultValues?: Partial<SwitchFormValues>;
    nodeId?: string;
}

export const SwitchDialog = ({
    open,
    onOpenChange,
    onSubmit,
    defaultValues,
    nodeId,
}: SwitchDialogProps) => {
    const params = useParams();
    const workflowId = params.workflowId as string;

    // Get available input variables from upstream nodes
    const inputData = useNodeInputData(nodeId);

    const [contextInput, setContextInput] = useState('{}');

    const { testResult, testError, isPending, runTest } = useTestNode({
        workflowId,
        nodeId,
        nodeType: NodeType.SWITCH,
    });
    const form = useForm<SwitchFormValues>({
        resolver: zodResolver(switchSchema),
        defaultValues: {
            variable: defaultValues?.variable || "",
            defaultHandle: defaultValues?.defaultHandle,
            cases: defaultValues?.cases || [
                { value: "case1", outputHandle: "valid" },
                { value: "case2", outputHandle: "invalid" }
            ],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "cases",
    });

    const handleFormSubmit = (values: SwitchFormValues) => {
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
                    <DialogTitle>Configure Switch</DialogTitle>
                </VisuallyHidden.Root>
                <NodeEditorWorkspace
                    title="Switch Condition"
                    description="Route logic based on exact value matches."
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
                        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 flex-1 overflow-y-auto pr-2">
                            <FormField
                                control={form.control}
                                name="variable"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Variable / Expression</FormLabel>
                                        <div className="flex gap-2">
                                            <FormControl>
                                                <ExpressionInput
                                                    placeholder="{{ trigger.type }}"
                                                    nodeId={nodeId}
                                                    {...field}
                                                />
                                            </FormControl>
                                        </div>
                                        <FormDescription>
                                            The value to switch on.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="defaultHandle"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Default Validation Handle</FormLabel>
                                        <FormControl>
                                            <Input placeholder="default" {...field} value={field.value || ''} />
                                        </FormControl>
                                        <FormDescription>
                                            Handle to use if no cases match.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <FormLabel>Cases</FormLabel>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => append({ value: "", outputHandle: "" })}
                                    >
                                        <PlusIcon className="size-4 mr-2" />
                                        Add Case
                                    </Button>
                                </div>

                                <div className="space-y-3">
                                    {fields.map((field, index) => (
                                        <div key={field.id} className="flex items-end gap-2 p-3 border rounded-md bg-muted/40">
                                            <div className="flex-1 space-y-2">
                                                <FormField
                                                    control={form.control}
                                                    name={`cases.${index}.value`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-xs">Value</FormLabel>
                                                            <FormControl>
                                                                <ExpressionInput
                                                                    placeholder="Value to match"
                                                                    nodeId={nodeId}
                                                                    {...field}
                                                                    className="h-8"
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <FormField
                                                    control={form.control}
                                                    name={`cases.${index}.outputHandle`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-xs">Output Handle</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="Handle ID" {...field} className="h-8" />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="size-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => remove(index)}
                                            >
                                                <TrashIcon className="size-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>

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
