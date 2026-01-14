"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    VisuallyHidden,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { useEffect } from "react";
import { ExpressionInput } from "@/components/expression-input";
import { PlusIcon, TrashIcon } from "lucide-react";

import { NodeEditorWorkspace } from "@/components/node-editor-workspace";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useParams } from "next/navigation";
import { NodeType } from "@/generated/prisma";
import { useNodeInputData } from "@/hooks/use-node-input-schema";
import { useTestNode } from "@/hooks/use-test-node";

const formSchema = z.object({
    variableName: z
        .string()
        .min(1, { message: "Variable name is required" })
        .regex(/^[A-Za-z_$][A-Za-z0-9_$]*$/, {
            message: "Must be a valid variable name",
        }),
    fields: z.array(z.object({
        key: z.string().min(1, "Field name required"),
        value: z.string(),
    })).min(1, "At least one field is required"),
});

export type SetFieldsFormValues = z.infer<typeof formSchema>;

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (values: z.infer<typeof formSchema>) => void;
    defaultValues?: Partial<SetFieldsFormValues>;
    nodeId?: string;
}

export const SetFieldsDialog = ({
    open,
    onOpenChange,
    onSubmit,
    defaultValues = {},
    nodeId,
}: Props) => {
    const params = useParams();
    const trpc = useTRPC();
    const workflowId = params.workflowId as string;

    const [contextInput, setContextInput] = useState('{}');

    const { testResult, testError, isPending, runTest } = useTestNode({
        workflowId,
        nodeId,
        nodeType: NodeType.SET_FIELDS,
    });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            variableName: defaultValues.variableName || "fields",
            fields: defaultValues.fields || [{ key: "", value: "" }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "fields",
    });

    useEffect(() => {
        if (open) {
            form.reset({
                variableName: defaultValues.variableName || "fields",
                fields: defaultValues.fields || [{ key: "", value: "" }],
            });
        }
    }, [open]);

    const handleSubmit = (values: z.infer<typeof formSchema>) => {
        onSubmit(values);
        onOpenChange(false);
    };

    const handleRunTest = () => {
        runTest(form.getValues(), contextInput, inputData);
    };

    // Get available input variables from upstream nodes
    const inputData = useNodeInputData(nodeId);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent fullScreen>
                <VisuallyHidden.Root>
                    <DialogTitle>Set Fields Configuration</DialogTitle>
                    <DialogDescription>
                        Configure settings for the Set Fields node.
                    </DialogDescription>
                </VisuallyHidden.Root>
                <NodeEditorWorkspace
                    title="Set Fields"
                    description="Define fields to add or modify data in your workflow context."
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
                        <form
                            onSubmit={form.handleSubmit(handleSubmit)}
                            className="space-y-8"
                        >
                            <FormField
                                control={form.control}
                                name="variableName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm font-bold">Output Variable Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="fields" className="font-semibold" {...field} />
                                        </FormControl>
                                        <FormDescription className="text-[10px]">
                                            Access data via: <code className="text-[10px] bg-muted px-1 py-0.5 rounded text-primary font-mono">{`{{${form.watch("variableName") || "fields"}.fieldName}}`}</code>
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <FormLabel className="text-sm font-bold">Fields to Set</FormLabel>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => append({ key: "", value: "" })}
                                        className="h-8 border-primary/20 text-primary hover:bg-primary/5"
                                    >
                                        <PlusIcon className="h-4 w-4 mr-1" />
                                        Add Field
                                    </Button>
                                </div>

                                <div className="space-y-3">
                                    {fields.map((field, index) => (
                                        <div key={field.id} className="flex gap-3 items-start p-4 border rounded-xl bg-muted/20 group hover:border-primary/30 transition-colors">
                                            <div className="flex-1 space-y-3">
                                                <FormField
                                                    control={form.control}
                                                    name={`fields.${index}.key`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormControl>
                                                                <Input
                                                                    placeholder="Field Name"
                                                                    className="text-xs h-9 bg-background font-medium"
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name={`fields.${index}.value`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormControl>
                                                                <ExpressionInput
                                                                    placeholder="Value or {{ variable }}"
                                                                    className="text-xs bg-background"
                                                                    nodeId={nodeId}
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => remove(index)}
                                                disabled={fields.length === 1}
                                            >
                                                <TrashIcon className="h-4 w-4" />
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
