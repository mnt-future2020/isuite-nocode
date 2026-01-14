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
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
    ssr: false,
    loading: () => <div className="h-[200px] w-full flex items-center justify-center border rounded bg-muted/20"><Loader2 className="animate-spin" /></div>
});

const formSchema = z.object({
    variableName: z.string().min(1, "Variable name is required").regex(/^[A-Za-z_$][A-Za-z0-9_$]*$/, "Invalid variable name"),
    credentialId: z.string().min(1, "Credential is required"),
    operation: z.enum(["EXECUTE_QUERY", "INSERT", "UPDATE", "DELETE"]),
    sql: z.string().min(1, "SQL query is required"),
});

export type PostgresFormValues = z.infer<typeof formSchema>;

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (values: PostgresFormValues) => void;
    defaultValues?: Partial<PostgresFormValues>;
    nodeId: string;
}

export const PostgresDialog = ({
    open,
    onOpenChange,
    onSubmit,
    defaultValues = {},
    nodeId,
}: Props) => {
    const { data: credentials } = useCredentialsByType(CredentialType.POSTGRES);
    const params = useParams();
    const workflowId = params.workflowId as string;
    const inputData = useNodeInputData(nodeId);
    const [contextInput, setContextInput] = useState('{}');

    const { testResult, testError, isPending, runTest } = useTestNode({
        workflowId,
        nodeId,
        nodeType: NodeType.POSTGRES,
    });

    const form = useForm<PostgresFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            variableName: "db_result",
            operation: "EXECUTE_QUERY",
            sql: "SELECT * FROM users LIMIT 10;",
            credentialId: "",
            ...defaultValues,
        },
    });

    useEffect(() => {
        if (open) {
            form.reset({
                variableName: defaultValues.variableName || "db_result",
                operation: defaultValues.operation || "EXECUTE_QUERY",
                sql: defaultValues.sql || "SELECT * FROM users LIMIT 10;",
                credentialId: defaultValues.credentialId || "",
            });
        }
    }, [open, defaultValues, form]);

    const handleRunTest = () => {
        runTest(form.getValues(), contextInput, inputData);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent fullScreen>
                <VisuallyHidden.Root>
                    <DialogTitle>Postgres Configuration</DialogTitle>
                    <DialogDescription>Setup your Postgres database connection and queries.</DialogDescription>
                </VisuallyHidden.Root>
                <NodeEditorWorkspace
                    title="Postgres"
                    description="Directly interact with your Postgres database using standard SQL."
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
                                            <FormControl><Input {...field} placeholder="db_result" /></FormControl>
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
                                                    <SelectTrigger><SelectValue placeholder="Select Database" /></SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {credentials?.map((c) => (
                                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                                    ))}
                                                    {!credentials?.length && (
                                                        <div className="p-2 text-xs text-muted-foreground">No Postgres credentials found.</div>
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
                                name="sql"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm font-bold">SQL Query</FormLabel>
                                        <FormControl>
                                            <div className="h-[300px] border rounded-md overflow-hidden bg-background shadow-inner">
                                                <MonacoEditor
                                                    height="100%"
                                                    language="sql"
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
                                            Write raw SQL. Supports <code>{"{{ variables }}"}</code> interpolation.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

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
