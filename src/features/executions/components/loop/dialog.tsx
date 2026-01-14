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
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
import { NodeEditorWorkspace } from "@/components/node-editor-workspace";
import { ExpressionInput } from "@/components/expression-input";
import { useNodeInputData } from "@/hooks/use-node-input-schema";
import { useTestNode } from "@/hooks/use-test-node";
import { NodeType } from "@/generated/prisma";
import { useParams } from "next/navigation";
import { useState } from "react";

// Dynamically import Monaco to avoid SSR issues
const MonacoEditor = dynamic(
    () => import("@monaco-editor/react").then((mod) => mod.default),
    { ssr: false, loading: () => <div className="h-[200px] bg-muted animate-pulse rounded-md" /> }
);

const formSchema = z.object({
    variableName: z
        .string()
        .min(1, { message: "Variable name is required" })
        .regex(/^[A-Za-z_$][A-Za-z0-9_$]*$/, {
            message:
                "Variable name must start with a letter or underscore and contain only letters, numbers, and underscores",
        }),
    inputVariable: z.string().min(1, "Input array variable is required"),
    code: z.string().min(1, "Transformation code is required"),
});

export type LoopFormValues = z.infer<typeof formSchema>;

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (values: z.infer<typeof formSchema>) => void;
    defaultValues?: Partial<LoopFormValues>;
    nodeId?: string;
}

const defaultCode = `// Available variables:
// $item  - Current item in the array
// $index - Current index (0-based)
// $items - The full array
// $input - All data from previous nodes

// Transform and return the item
return {
  ...($item),
  processed: true,
  index: $index
};
`;

export const LoopDialog = ({
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
        nodeType: NodeType.LOOP,
    });
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            variableName: defaultValues.variableName || "loopResult",
            inputVariable: defaultValues.inputVariable || "",
            code: defaultValues.code || defaultCode,
        },
    });

    useEffect(() => {
        if (open) {
            form.reset({
                variableName: defaultValues.variableName || "loopResult",
                inputVariable: defaultValues.inputVariable || "",
                code: defaultValues.code || defaultCode,
            });
        }
    }, [open, defaultValues, form]);

    const watchVariableName = form.watch("variableName") || "loopResult";

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
                    <DialogTitle>Loop Configuration</DialogTitle>
                    <DialogDescription>Loop configuration dialog</DialogDescription>
                </VisuallyHidden.Root>
                <NodeEditorWorkspace
                    title="Loop / For Each"
                    description="Iterate over an array and transform each item using JavaScript."
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
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="variableName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Output Variable Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="loopResult" {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                Access results: <code className="text-xs bg-muted px-1 py-0.5 rounded">{`{{${watchVariableName}}}`}</code>
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="inputVariable"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Input Array</FormLabel>
                                            <div className="flex gap-2">
                                                <FormControl>
                                                    <ExpressionInput
                                                        placeholder="{{ webhook.body.items }}"
                                                        className="font-mono text-sm"
                                                        nodeId={nodeId}
                                                        {...field}
                                                    />
                                                </FormControl>
                                            </div>
                                            <FormDescription>
                                                The array to iterate over
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="code"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Transformation Code</FormLabel>
                                        <FormControl>
                                            <div className="border rounded-md overflow-hidden">
                                                <MonacoEditor
                                                    height="200px"
                                                    defaultLanguage="javascript"
                                                    value={field.value}
                                                    onChange={(value) => field.onChange(value || "")}
                                                    theme="vs-dark"
                                                    options={{
                                                        minimap: { enabled: false },
                                                        fontSize: 13,
                                                        lineNumbers: "on",
                                                        scrollBeyondLastLine: false,
                                                        wordWrap: "on",
                                                        tabSize: 2,
                                                        automaticLayout: true,
                                                    }}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormDescription>
                                            Code runs for each item. Use <code className="text-xs bg-muted px-1 py-0.5 rounded">$item</code> for current item, <code className="text-xs bg-muted px-1 py-0.5 rounded">$index</code> for position.
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
