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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { NodeEditorWorkspace } from "@/components/node-editor-workspace";
import { useNodeInputData } from "@/hooks/use-node-input-schema";
import { useTestNode } from "@/hooks/use-test-node";
import { NodeType } from "@/generated/prisma";
import { useParams } from "next/navigation";
import { useState } from "react";

const formSchema = z.object({
    subWorkflowId: z.string().min(1, "Sub-workflow is required"),
    variableName: z
        .string()
        .min(1, { message: "Variable name is required" })
        .regex(/^[A-Za-z_$][A-Za-z0-9_$]*$/, {
            message: "Must be a valid variable name",
        }),
});

export type SubWorkflowFormValues = z.infer<typeof formSchema>;

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (values: SubWorkflowFormValues) => void;
    defaultValues?: Partial<SubWorkflowFormValues>;
    nodeId?: string;
}

export const SubWorkflowDialog = ({
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
        nodeType: NodeType.SUB_WORKFLOW,
    });

    const trpc = useTRPC();
    const { data: workflows, isLoading } = useQuery(
        trpc.workflows.getMany.queryOptions({
            pageSize: 100,
        })
    );

    const form = useForm<SubWorkflowFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            subWorkflowId: defaultValues.subWorkflowId || "",
            variableName: defaultValues.variableName || "subWorkflowResult",
        },
    });

    useEffect(() => {
        if (open) {
            form.reset({
                subWorkflowId: defaultValues.subWorkflowId || "",
                variableName: defaultValues.variableName || "subWorkflowResult",
            });
        }
    }, [open, defaultValues, form]);

    const handleSubmit = (values: SubWorkflowFormValues) => {
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
                    <DialogTitle>Execute Workflow Configuration</DialogTitle>
                    <DialogDescription>
                        Select a workflow to execute as a sub-workflow.
                    </DialogDescription>
                </VisuallyHidden.Root>
                <NodeEditorWorkspace
                    title="Execute Workflow"
                    description="Run another workflow as a sub-process."
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
                                name="subWorkflowId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Selected Workflow</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            disabled={isLoading}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={isLoading ? "Loading..." : "Select a workflow"} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {workflows?.items.map((w) => (
                                                    <SelectItem key={w.id} value={w.id}>
                                                        {w.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="variableName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Output Variable Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="subWorkflowResult" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            The result of the trigger (execution ID).
                                        </FormDescription>
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
