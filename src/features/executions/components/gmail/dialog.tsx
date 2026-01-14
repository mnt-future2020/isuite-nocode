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
import { ExpressionInput } from "@/components/expression-input";
import { NodeEditorWorkspace } from "@/components/node-editor-workspace";
import { useNodeInputData } from "@/hooks/use-node-input-schema";
import { useTestNode } from "@/hooks/use-test-node";
import { useParams } from "next/navigation";
import { useState } from "react";
import { NodeType, CredentialType } from "@/generated/prisma";
import { useCredentialsByType } from "@/features/credentials/hooks/use-credentials";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

const formSchema = z.object({
    variableName: z
        .string()
        .min(1, { message: "Variable name is required" })
        .regex(/^[A-Za-z_$][A-Za-z0-9_$]*$/, {
            message: "Must be a valid variable name",
        }),
    credentialId: z.string().min(1, "Credential is required"),
    operation: z.enum([
        "SEND_EMAIL",
        "CREATE_DRAFT",
        "GET_PROFILE",
        "GET_THREADS",
        "GET_MESSAGE",
        "DELETE_MESSAGE",
        "ADD_LABEL",
        "REMOVE_LABEL"
    ]),
    to: z.string().optional(),
    subject: z.string().optional(),
    body: z.string().optional(),
    maxResults: z.string().optional(),
    messageId: z.string().optional(),
    labelId: z.string().optional(),
}).superRefine((data, ctx) => {
    if ((data.operation === "SEND_EMAIL" || data.operation === "CREATE_DRAFT")) {
        if (!data.to && data.operation === "SEND_EMAIL") {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Recipient is required for sending email",
                path: ["to"],
            });
        }
    }
    if (["GET_MESSAGE", "DELETE_MESSAGE", "ADD_LABEL", "REMOVE_LABEL"].includes(data.operation)) {
        if (!data.messageId) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Message ID is required",
                path: ["messageId"],
            });
        }
    }
    if (["ADD_LABEL", "REMOVE_LABEL"].includes(data.operation)) {
        if (!data.labelId) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Label ID is required",
                path: ["labelId"],
            });
        }
    }
});

export type GmailFormValues = z.infer<typeof formSchema>;

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (values: GmailFormValues) => void;
    defaultValues?: Partial<GmailFormValues>;
    nodeId?: string;
}

export const GmailDialog = ({
    open,
    onOpenChange,
    onSubmit,
    defaultValues = {},
    nodeId,
}: Props) => {
    const params = useParams();
    const workflowId = params.workflowId as string;
    const { data: credentials } = useCredentialsByType(CredentialType.GMAIL);

    // Get available input variables from upstream nodes
    const inputData = useNodeInputData(nodeId);

    const [contextInput, setContextInput] = useState('{}');

    const { testResult, testError, isPending, runTest } = useTestNode({
        workflowId,
        nodeId,
        nodeType: NodeType.GMAIL,
    });

    const form = useForm<GmailFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            variableName: defaultValues.variableName || "gmail",
            credentialId: defaultValues.credentialId || "",
            operation: (defaultValues.operation as GmailFormValues["operation"]) || "SEND_EMAIL",
            to: defaultValues.to || "",
            subject: defaultValues.subject || "",
            body: defaultValues.body || "",
            maxResults: defaultValues.maxResults || "5",
            messageId: defaultValues.messageId || "",
            labelId: defaultValues.labelId || "",
        },
    });

    useEffect(() => {
        if (open) {
            form.reset({
                variableName: defaultValues.variableName || "gmail",
                credentialId: defaultValues.credentialId || "",
                operation: (defaultValues.operation as GmailFormValues["operation"]) || "SEND_EMAIL",
                to: defaultValues.to || "",
                subject: defaultValues.subject || "",
                body: defaultValues.body || "",
                maxResults: defaultValues.maxResults || "5",
                messageId: defaultValues.messageId || "",
                labelId: defaultValues.labelId || "",
            });
        }
    }, [open, defaultValues, form]);

    const handleSubmit = (values: GmailFormValues) => {
        onSubmit(values);
        onOpenChange(false);
    };

    const handleRunTest = () => {
        runTest(form.getValues(), contextInput, inputData);
    };

    const operation = form.watch("operation");

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent fullScreen>
                <VisuallyHidden.Root>
                    <DialogTitle>Gmail Configuration</DialogTitle>
                    <DialogDescription>
                        Perform various actions with Gmail (Send, Search, Labels, etc).
                    </DialogDescription>
                </VisuallyHidden.Root>
                <NodeEditorWorkspace
                    title="Gmail"
                    description="Perform actions on your Gmail account."
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
                                            <FormLabel>Output Variable</FormLabel>
                                            <FormControl>
                                                <Input placeholder="gmail" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="credentialId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Gmail Credential</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select Account" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {credentials?.map((c) => (
                                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                                    ))}
                                                    <div className="p-2 border-t">
                                                        <Button variant="ghost" size="sm" className="w-full justify-start h-8 px-2" asChild>
                                                            <Link href="/credentials" target="_blank">
                                                                + Add New Account
                                                            </Link>
                                                        </Button>
                                                    </div>
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
                                        <FormLabel>Operation</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Operation" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="SEND_EMAIL">Send Email</SelectItem>
                                                <SelectItem value="CREATE_DRAFT">Create Draft</SelectItem>
                                                <SelectItem value="GET_PROFILE">Get Profile</SelectItem>
                                                <SelectItem value="GET_THREADS">Get Threads (List)</SelectItem>
                                                <SelectItem value="GET_MESSAGE">Get Message</SelectItem>
                                                <SelectItem value="DELETE_MESSAGE">Delete Message</SelectItem>
                                                <SelectItem value="ADD_LABEL">Add Label to Message</SelectItem>
                                                <SelectItem value="REMOVE_LABEL">Remove Label from Message</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {(operation === "SEND_EMAIL" || operation === "CREATE_DRAFT") && (
                                <>
                                    <FormField
                                        control={form.control}
                                        name="to"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>To</FormLabel>
                                                <FormControl>
                                                    <ExpressionInput
                                                        placeholder="Recipient email address"
                                                        nodeId={nodeId}
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="subject"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Subject</FormLabel>
                                                <FormControl>
                                                    <ExpressionInput
                                                        placeholder="Email subject line"
                                                        nodeId={nodeId}
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="body"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Body (HTML)</FormLabel>
                                                <FormControl>
                                                    <ExpressionInput
                                                        multiline
                                                        placeholder="HTML content for email body"
                                                        className="min-h-[120px]"
                                                        nodeId={nodeId}
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </>
                            )}

                            {operation === "GET_THREADS" && (
                                <FormField
                                    control={form.control}
                                    name="maxResults"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Max Results</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="5" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            {["GET_MESSAGE", "DELETE_MESSAGE", "ADD_LABEL", "REMOVE_LABEL"].includes(operation) && (
                                <FormField
                                    control={form.control}
                                    name="messageId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Message ID</FormLabel>
                                            <FormControl>
                                                <ExpressionInput
                                                    placeholder="Gmail Message ID"
                                                    nodeId={nodeId}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            {["ADD_LABEL", "REMOVE_LABEL"].includes(operation) && (
                                <FormField
                                    control={form.control}
                                    name="labelId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Label ID</FormLabel>
                                            <FormControl>
                                                <ExpressionInput
                                                    placeholder="Label ID (e.g., INBOX, TRASH)"
                                                    nodeId={nodeId}
                                                    {...field}
                                                />
                                            </FormControl>
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
};
