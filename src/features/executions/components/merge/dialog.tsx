"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { NodeEditorWorkspace } from "@/components/node-editor-workspace";
import { useNodeInputData } from "@/hooks/use-node-input-schema";
import { useTestNode } from "@/hooks/use-test-node";
import { NodeType } from "@/generated/prisma";
import { useParams } from "next/navigation";
import { useState } from "react";

const formSchema = z.object({
    variableName: z
        .string()
        .min(1, { message: "Variable name is required" })
        .regex(/^[A-Za-z_$][A-Za-z0-9_$]*$/, {
            message: "Must be a valid variable name",
        }),
    mode: z.enum(["append", "merge", "keepFirst"]),
});

export type MergeFormValues = z.infer<typeof formSchema>;

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (values: z.infer<typeof formSchema>) => void;
    defaultValues?: Partial<MergeFormValues>;
    nodeId?: string;
}

export const MergeDialog = ({
    open,
    onOpenChange,
    onSubmit,
    defaultValues = {},
    nodeId,
}: Props) => {
    const params = useParams();
    const workflowId = params.workflowId as string;

    // Get available input variables from upstream nodes
    const inputData = useNodeInputData(nodeId);

    const [contextInput, setContextInput] = useState('{}');

    const { testResult, testError, isPending, runTest } = useTestNode({
        workflowId,
        nodeId,
        nodeType: NodeType.MERGE,
    });
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            variableName: defaultValues.variableName || "merged",
            mode: defaultValues.mode || "merge",
        },
    });

    useEffect(() => {
        if (open) {
            form.reset({
                variableName: defaultValues.variableName || "merged",
                mode: defaultValues.mode || "merge",
            });
        }
    }, [open, defaultValues, form]);

    const handleSubmit = (values: z.infer<typeof formSchema>) => {
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
                    <DialogTitle>Merge Configuration</DialogTitle>
                    <DialogDescription>
                        Combine data from multiple branches into one.
                    </DialogDescription>
                </VisuallyHidden.Root>
                <NodeEditorWorkspace
                    title="Merge Branches"
                    description="Combine data from multiple branches into one."
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
                            className="space-y-4 mt-4"
                        >
                            <FormField
                                control={form.control}
                                name="variableName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Output Variable</FormLabel>
                                        <FormControl>
                                            <Input placeholder="merged" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            Access merged data: <code className="text-xs bg-muted px-1 py-0.5 rounded">{`{{${form.watch("variableName") || "merged"}}}`}</code>
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="mode"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Merge Mode</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select mode" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="merge">
                                                    <div className="flex flex-col">
                                                        <span>Merge Objects</span>
                                                        <span className="text-xs text-muted-foreground">Combine all objects into one</span>
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="append">
                                                    <div className="flex flex-col">
                                                        <span>Append Arrays</span>
                                                        <span className="text-xs text-muted-foreground">Combine all arrays into one</span>
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="keepFirst">
                                                    <div className="flex flex-col">
                                                        <span>Keep All</span>
                                                        <span className="text-xs text-muted-foreground">Pass through all data</span>
                                                    </div>
                                                </SelectItem>
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
