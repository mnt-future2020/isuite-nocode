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
import { useParams } from "next/navigation";
import { NodeType, CredentialType } from "@/generated/prisma";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useCredentialsByType } from "@/features/credentials/hooks/use-credentials";
import { ExpressionInput } from "@/components/expression-input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useNodeInputData } from "@/hooks/use-node-input-schema";
import { useTestNode } from "@/hooks/use-test-node";
import { NodeEditorWorkspace } from "@/components/node-editor-workspace";

const formSchema = z.object({
    variableName: z.string().min(1, "Variable name is required").regex(/^[A-Za-z_$][A-Za-z0-9_$]*$/, "Invalid variable name"),
    credentialId: z.string().min(1, "Credential is required"),
    operation: z.enum(["READ_ROWS", "APPEND_ROW", "UPDATE_ROW", "CLEAR_SHEET"]),
    spreadsheetId: z.string().min(1, "Spreadsheet ID is required"),
    sheetName: z.string().min(1, "Sheet Name is required"),
    range: z.string().optional(),
    data: z.string().optional(),
});

export type GoogleSheetsFormValues = z.infer<typeof formSchema>;

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (values: GoogleSheetsFormValues) => void;
    defaultValues?: Partial<GoogleSheetsFormValues>;
    nodeId: string;
}

export const GoogleSheetsDialog = ({
    open,
    onOpenChange,
    onSubmit,
    defaultValues = {},
    nodeId,
}: Props) => {
    const { data: credentials } = useCredentialsByType(CredentialType.GOOGLE_SHEETS);
    const params = useParams();
    const workflowId = params.workflowId as string;
    const inputData = useNodeInputData(nodeId);
    const [contextInput, setContextInput] = useState('{}');

    const { testResult, testError, isPending, runTest } = useTestNode({
        workflowId,
        nodeId,
        nodeType: NodeType.GOOGLE_SHEETS,
    });

    const form = useForm<GoogleSheetsFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            variableName: "sheets_data",
            operation: "READ_ROWS",
            spreadsheetId: "",
            sheetName: "Sheet1",
            range: "A:Z",
            credentialId: "",
            ...defaultValues,
        },
    });

    useEffect(() => {
        if (open) {
            form.reset({
                variableName: defaultValues.variableName || "sheets_data",
                operation: defaultValues.operation || "READ_ROWS",
                spreadsheetId: defaultValues.spreadsheetId || "",
                sheetName: defaultValues.sheetName || "Sheet1",
                range: defaultValues.range || "A:Z",
                credentialId: defaultValues.credentialId || "",
            });
        }
    }, [open, defaultValues, form]);

    const handleRunTest = () => {
        runTest(form.getValues(), contextInput, inputData);
    };

    const operation = form.watch("operation");

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent fullScreen>
                <VisuallyHidden.Root>
                    <DialogTitle>Google Sheets Configuration</DialogTitle>
                    <DialogDescription>Setup your Google Sheets integration</DialogDescription>
                </VisuallyHidden.Root>
                <NodeEditorWorkspace
                    title="Google Sheets"
                    description="Read, write and manage Google Sheets data effortlessly."
                    testInput={contextInput}
                    onTestInputChange={setContextInput}
                    testResult={testResult}
                    testError={testError}
                    onRunTest={handleRunTest}
                    isPending={isPending}
                    onClose={() => onOpenChange(false)}
                    inputData={inputData}
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
                                            <FormControl><Input {...field} placeholder="sheets_data" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="credentialId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-bold">Credential</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select Google OAuth" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {credentials?.map((c) => (
                                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                                    ))}
                                                    {!credentials?.length && (
                                                        <div className="p-2 text-xs text-muted-foreground">No Google Sheets credentials found.</div>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="operation"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm font-bold">Operation</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="READ_ROWS">Read Rows</SelectItem>
                                                <SelectItem value="APPEND_ROW">Append Row</SelectItem>
                                                <SelectItem value="UPDATE_ROW">Update Row</SelectItem>
                                                <SelectItem value="CLEAR_SHEET">Clear Sheet</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="spreadsheetId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-bold">Spreadsheet ID</FormLabel>
                                            <FormControl>
                                                <ExpressionInput
                                                    placeholder="1abc123..."
                                                    nodeId={nodeId}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormDescription className="text-[10px]">Found in the URL of your Google Sheet</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="sheetName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-bold">Sheet Name</FormLabel>
                                            <FormControl>
                                                <ExpressionInput
                                                    placeholder="Sheet1"
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
                                name="range"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm font-bold">Range</FormLabel>
                                        <FormControl>
                                            <ExpressionInput
                                                placeholder="A1:B10 or A:Z"
                                                nodeId={nodeId}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription className="text-xs">Optional. Default is A:Z</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {(operation === 'APPEND_ROW' || operation === 'UPDATE_ROW') && (
                                <FormField
                                    control={form.control}
                                    name="data"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-bold">Values / Data (JSON Array or CSV)</FormLabel>
                                            <FormControl>
                                                <ExpressionInput
                                                    multiline
                                                    placeholder='["Value1", "Value2"]'
                                                    nodeId={nodeId}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormDescription className="text-xs">Provide a JSON array for multiple columns, or a comma-separated string.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            <div className="pt-6 border-t flex justify-end">
                                <Button type="submit" size="lg" className="px-10 font-bold shadow-lg">Save Changes</Button>
                            </div>
                        </form>
                    </Form>
                </NodeEditorWorkspace>
            </DialogContent>
        </Dialog>
    );
};
