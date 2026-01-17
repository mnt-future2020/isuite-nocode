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
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { NodeType } from "@/generated/prisma";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { NodeEditorWorkspace } from "@/components/node-editor-workspace";
import { useNodeInputData } from "@/hooks/use-node-input-schema";
import { useTestNode } from "@/hooks/use-test-node";
import { VariablePicker } from "@/components/variable-picker";

// Dynamically import Monaco to avoid SSR issues
const MonacoEditor = dynamic(
    () => import("@monaco-editor/react").then((mod) => mod.default),
    { ssr: false, loading: () => <div className="h-[400px] bg-muted animate-pulse rounded-md" /> }
);

const formSchema = z.object({
    variableName: z
        .string()
        .min(1, { message: "Variable name is required" })
        .regex(/^[A-Za-z_$][A-Za-z0-9_$]*$/, {
            message:
                "Variable name must start with a letter or underscore and contain only letters, numbers, and underscores",
        }),
    code: z.string().min(1, "Code is required"),
});

export type CodeFormValues = z.infer<typeof formSchema>;

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (values: z.infer<typeof formSchema>) => void;
    defaultValues?: Partial<CodeFormValues>;
    nodeId?: string;
}

const defaultCode = `// Access data from previous nodes using $input
// Example: $input.webhook.body.email

// Your code must return a value
return {
  message: "Hello from Code Node!",
  timestamp: new Date().toISOString()
};
`;

export const CodeDialog = ({
    open,
    onOpenChange,
    onSubmit,
    defaultValues = {},
    nodeId,
}: Props) => {
    const params = useParams();
    const trpc = useTRPC();
    const workflowId = params.workflowId as string;

    // Get available input variables from upstream nodes
    const inputData = useNodeInputData(nodeId);

    const editorRef = useRef<any>(null);

    const [contextInput, setContextInput] = useState('{}');

    const { testResult, testError, isPending, runTest } = useTestNode({
        workflowId,
        nodeId,
        nodeType: NodeType.CODE,
    });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            variableName: defaultValues.variableName || "codeResult",
            code: defaultValues.code || defaultCode,
        },
    });

    useEffect(() => {
        if (open) {
            form.reset({
                variableName: defaultValues.variableName || "codeResult",
                code: defaultValues.code || defaultCode,
            });
        }
    }, [open]);

    const watchVariableName = form.watch("variableName") || "codeResult";

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
                    <DialogTitle>Code Node Configuration</DialogTitle>
                    <DialogDescription>
                        Configure settings for the Code node.
                    </DialogDescription>
                </VisuallyHidden.Root>
                <NodeEditorWorkspace
                    title="Code"
                    description="Run custom JavaScript to transform or process data."
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
                                            <Input placeholder="codeResult" className="font-semibold" {...field} />
                                        </FormControl>
                                        <FormDescription className="text-[10px]">
                                            Reference: {`{{${watchVariableName}.propertyName}}`}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="code"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex items-center justify-between">
                                            <FormLabel className="text-sm font-bold">JavaScript Code</FormLabel>
                                            <VariablePicker
                                                currentId={nodeId}
                                                mode="code"
                                                onSelect={(variable) => {
                                                    if (editorRef.current) {
                                                        const editor = editorRef.current;
                                                        const position = editor.getPosition();

                                                        // Construct range safely - if no position, insert at start
                                                        const range = position ? {
                                                            startLineNumber: position.lineNumber,
                                                            startColumn: position.column,
                                                            endLineNumber: position.lineNumber,
                                                            endColumn: position.column
                                                        } : {
                                                            startLineNumber: 1,
                                                            startColumn: 1,
                                                            endLineNumber: 1,
                                                            endColumn: 1
                                                        };

                                                        // Execute edit
                                                        editor.executeEdits("variable-picker", [{
                                                            range: range,
                                                            text: variable,
                                                            forceMoveMarkers: true
                                                        }]);

                                                        // Important: Restore focus
                                                        editor.focus();

                                                        // Important: Manually update form state because programmatic edits might not trigger onChange
                                                        field.onChange(editor.getValue());
                                                    } else {
                                                        // Fallback append
                                                        field.onChange((field.value || "") + variable);
                                                    }
                                                }}
                                            />
                                        </div>
                                        <FormControl>
                                            <div className="border rounded-xl overflow-hidden shadow-sm">
                                                <MonacoEditor
                                                    height="400px"
                                                    defaultLanguage="javascript"
                                                    value={field.value}
                                                    onChange={(value) => field.onChange(value || "")}
                                                    onMount={(editor, monaco) => {
                                                        editorRef.current = editor;
                                                        (window as any).monaco = monaco;
                                                    }}
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
                                        <FormDescription className="text-xs">
                                            Use <code className="text-xs bg-muted/50 px-1 rounded text-primary">$input</code> to access data from all upstream nodes.
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
