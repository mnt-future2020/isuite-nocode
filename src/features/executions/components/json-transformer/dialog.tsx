"use client";

import { useTestNode } from "@/hooks/use-test-node";
import { useNodeInputData } from "@/hooks/use-node-input-schema";
import { NodeEditorWorkspace } from "@/components/node-editor-workspace";
import { VariablePicker } from "@/components/variable-picker";
import { ExpressionInput } from "@/components/expression-input";

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { NodeType } from "@/generated/prisma";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
    VisuallyHidden
} from "@/components/ui/dialog";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
    ssr: false,
    loading: () => <div className="h-[200px] w-full flex items-center justify-center border rounded bg-muted/20"><Loader2 className="animate-spin" /></div>
});

const jsonTransformerSchema = z.object({
    variableName: z.string().min(1, "Variable name is required").regex(/^[A-Za-z_$][A-Za-z0-9_$]*$/, "Invalid variable name"),
    mode: z.enum(["extract", "map"]),
    jsonPath: z.string().optional(),
    mappingTemplate: z.string().optional(),
});

export type JSONTransformerFormValues = z.infer<typeof jsonTransformerSchema>;

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (values: JSONTransformerFormValues) => void;
    defaultValues?: Partial<JSONTransformerFormValues>;
    nodeId: string;
}

export function JSONTransformerDialog({
    open,
    onOpenChange,
    onSubmit,
    defaultValues,
    nodeId
}: Props) {
    const params = useParams();
    const workflowId = params.workflowId as string;
    const [contextInput, setContextInput] = useState('{\n  "test": {\n    "data": "hello"\n  }\n}');
    const inputData = useNodeInputData(nodeId);
    const editorRef = useRef<any>(null);

    const form = useForm<JSONTransformerFormValues>({
        resolver: zodResolver(jsonTransformerSchema),
        defaultValues: {
            variableName: "transformed",
            mode: "extract",
            jsonPath: "$.steps.*",
            mappingTemplate: "{\n  \"newKey\": \"{{ previousStep.data }}\"\n}",
            ...defaultValues,
        },
    });

    const mode = form.watch("mode");

    useEffect(() => {
        if (open) {
            form.reset({
                variableName: defaultValues?.variableName || "transformed",
                mode: defaultValues?.mode || "extract",
                jsonPath: defaultValues?.jsonPath || "$.steps.*",
                mappingTemplate: defaultValues?.mappingTemplate || "{\n  \"newKey\": \"{{ previousStep.data }}\"\n}",
            });
        }
    }, [open, defaultValues, form]);

    const { testResult, testError, isPending, runTest } = useTestNode({
        workflowId,
        nodeId,
        nodeType: NodeType.JSON_TRANSFORMER
    });

    const handleRunTest = async () => {
        runTest(form.getValues(), contextInput, inputData);
    };

    const handleFormSubmit = (values: JSONTransformerFormValues) => {
        onSubmit(values);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent fullScreen>
                <VisuallyHidden.Root>
                    <DialogTitle>JSON Transformer Configuration</DialogTitle>
                    <DialogDescription>Configure JSON transformation settings.</DialogDescription>
                </VisuallyHidden.Root>
                <NodeEditorWorkspace
                    title="JSON Transformer"
                    testInput={contextInput}
                    onTestInputChange={setContextInput}
                    testResult={testResult}
                    testError={testError}
                    onRunTest={handleRunTest}
                    isPending={isPending}
                    inputData={inputData}
                    onClose={() => onOpenChange(false)}
                >
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="variableName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm font-bold">Output Variable Name</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="transformed" />
                                        </FormControl>
                                        <FormDescription className="text-xs">
                                            The variable name to store the result in. Access it via <code>{"{{variableName}}"}</code>.
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
                                        <FormLabel className="text-sm font-bold">Transformation Mode</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select mode" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="extract">JSONPath Extraction</SelectItem>
                                                <SelectItem value="map">JSON Mapping Template</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {mode === 'extract' && (
                                <FormField
                                    control={form.control}
                                    name="jsonPath"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-bold">JSONPath Expression</FormLabel>
                                            <FormControl>
                                                <ExpressionInput
                                                    {...field}
                                                    placeholder="$.data.items[*].id"
                                                    nodeId={nodeId}
                                                />
                                            </FormControl>
                                            <FormDescription className="text-xs">
                                                Use standard JSONPath to extract values. Example: <code>$.user.name</code>
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            {mode === 'map' && (
                                <FormField
                                    control={form.control}
                                    name="mappingTemplate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className="flex items-center justify-between">
                                                <FormLabel className="text-sm font-bold">JSON Mapping Template</FormLabel>
                                                <VariablePicker
                                                    currentId={nodeId}
                                                    onSelect={(variable) => {
                                                        if (editorRef.current) {
                                                            const editor = editorRef.current;
                                                            const position = editor.getPosition();

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

                                                            editor.executeEdits("variable-picker", [{
                                                                range: range,
                                                                text: variable,
                                                                forceMoveMarkers: true
                                                            }]);
                                                            editor.focus();
                                                            field.onChange(editor.getValue());
                                                        } else {
                                                            field.onChange((field.value || "") + variable);
                                                        }
                                                    }}
                                                />
                                            </div>
                                            <FormControl>
                                                <div className="h-[300px] border rounded-md overflow-hidden bg-background shadow-inner">
                                                    <MonacoEditor
                                                        height="100%"
                                                        language="json"
                                                        theme="vs-dark"
                                                        value={field.value}
                                                        onChange={(val) => field.onChange(val || "")}
                                                        onMount={(editor, monaco) => {
                                                            editorRef.current = editor;
                                                            (window as any).monaco = monaco;
                                                        }}
                                                        options={{
                                                            minimap: { enabled: false },
                                                            fontSize: 13,
                                                            lineNumbers: "on",
                                                            scrollBeyondLastLine: false,
                                                            automaticLayout: true,
                                                        }}
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormDescription className="text-xs">
                                                Define the output structure. Use <code>{"{{ variable }}"}</code> for dynamic data.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

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
}
