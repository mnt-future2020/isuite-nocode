"use client";

import { useTestNode } from "@/hooks/use-test-node";
import { useNodeInputData } from "@/hooks/use-node-input-schema";
import { NodeEditorWorkspace } from "@/components/node-editor-workspace";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useEffect, useState } from "react";
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

const formSchema = z.object({
    variableName: z.string().min(1, "Variable name is required").regex(/^[A-Za-z_$][A-Za-z0-9_$]*$/, "Invalid variable name"),
    htmlContent: z.string().min(1, "HTML content is required"),
    fileName: z.string().optional(),
});

export type PDFGeneratorFormValues = z.infer<typeof formSchema>;

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (values: PDFGeneratorFormValues) => void;
    defaultValues?: Partial<PDFGeneratorFormValues>;
    nodeId: string;
}

export const PDFGeneratorDialog = ({
    open,
    onOpenChange,
    onSubmit,
    defaultValues = {},
    nodeId,
}: Props) => {
    const params = useParams();
    const workflowId = params.workflowId as string;
    const [contextInput, setContextInput] = useState('{}');
    const inputData = useNodeInputData(nodeId);

    const form = useForm<PDFGeneratorFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            variableName: "invoice_pdf",
            htmlContent: "<html><body><h1>Invoice</h1><p>Processed at: {{ context.executionTime }}</p></body></html>",
            fileName: "document.pdf",
            ...defaultValues,
        },
    });

    useEffect(() => {
        if (open) {
            form.reset({
                variableName: defaultValues.variableName || "invoice_pdf",
                htmlContent: defaultValues.htmlContent || "<html><body><h1>Invoice</h1><p>Processed at: {{ context.executionTime }}</p></body></html>",
                fileName: defaultValues.fileName || "document.pdf",
            });
        }
    }, [open, defaultValues, form]);

    const { testResult, testError, isPending, runTest } = useTestNode({
        workflowId,
        nodeId,
        nodeType: NodeType.PDF_GENERATOR
    });

    const handleRunTest = async () => {
        runTest(form.getValues(), contextInput, inputData);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent fullScreen>
                <VisuallyHidden.Root>
                    <DialogTitle>PDF Generator Configuration</DialogTitle>
                    <DialogDescription>Convert HTML content into high-quality PDF documents.</DialogDescription>
                </VisuallyHidden.Root>
                <NodeEditorWorkspace
                    title="PDF Generator"
                    description="Design professional PDF documents using standard HTML/CSS templates."
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
                        <form onSubmit={form.handleSubmit((v) => { onSubmit(v); onOpenChange(false); })} className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="variableName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-bold">Output Variable Name</FormLabel>
                                            <FormControl><Input {...field} placeholder="invoice_pdf" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="fileName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-bold">Default File Name</FormLabel>
                                            <FormControl>
                                                <ExpressionInput
                                                    placeholder="document.pdf"
                                                    nodeId={nodeId}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="htmlContent"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm font-bold">HTML Template</FormLabel>
                                        <FormControl>
                                            <div className="h-[400px] border rounded-md overflow-hidden bg-background shadow-inner">
                                                <MonacoEditor
                                                    height="100%"
                                                    language="html"
                                                    theme="vs-dark"
                                                    value={field.value}
                                                    onChange={(val) => field.onChange(val || "")}
                                                    options={{
                                                        minimap: { enabled: false },
                                                        fontSize: 13,
                                                        lineNumbers: "on",
                                                        automaticLayout: true,
                                                    }}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormDescription className="text-xs">
                                            Supports <code>{"{{ variables }}"}</code> interpolation. Use CSS for styling inside <code>&lt;style&gt;</code> tags.
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
}
