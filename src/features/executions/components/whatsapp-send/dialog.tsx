"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
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
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { NodeEditorWorkspace } from "@/components/node-editor-workspace";
import { useReactFlow } from "@xyflow/react";
import { useEffect, useState } from "react";
import { useNodeData } from "@/hooks/use-node-data";
import { useTestNode } from "@/hooks/use-test-node";
import { useNodeInputData } from "@/hooks/use-node-input-schema";
import { useCredentialsByType } from "@/features/credentials/hooks/use-credentials";
import { CredentialType, NodeType } from "@/generated/prisma";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Textarea } from "@/components/ui/textarea";
import { useParams } from "next/navigation";

const formSchema = z.object({
    variableName: z.string().min(1, "Variable name is required"),
    credentialId: z.string().min(1, "Credential is required"),
    to: z.string().min(1, "Phone number is required"),
    message: z.string().min(1, "Message is required"),
});

export type WhatsAppSendFormValues = z.infer<typeof formSchema>;

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    nodeId: string;
    defaultValues?: WhatsAppSendFormValues;
    onSubmit: (values: WhatsAppSendFormValues) => void;
}

export const WhatsAppSendDialog = ({
    open,
    onOpenChange,
    nodeId,
    defaultValues,
    onSubmit,
}: Props) => {
    const params = useParams();
    const workflowId = params?.workflowId as string;

    const { data: credentials, isLoading: isLoadingCreds } = useCredentialsByType({
        type: CredentialType.WHATSAPP
    });

    const form = useForm<WhatsAppSendFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: defaultValues || {
            variableName: "whatsappParams",
            credentialId: "",
            to: "",
            message: "",
        },
    });

    const {
        testResult,
        testError,
        isPending: isTestPending,
        runTest,
    } = useTestNode({
        workflowId,
        nodeId,
        nodeType: NodeType.WHATSAPP_SEND
    });

    const [testInput, setTestInput] = useState("{}");
    const inputData = useNodeInputData(nodeId);

    useEffect(() => {
        if (defaultValues) {
            form.reset(defaultValues);
        }
    }, [defaultValues, form, open]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[90vh] p-0 flex flex-col gap-0">
                <NodeEditorWorkspace
                    title="WhatsApp Send"
                    description="Send a message via WhatsApp Cloud API"
                    onClose={() => onOpenChange(false)}
                    onRunTest={() => runTest(form.getValues(), testInput, inputData)}
                    isPending={isTestPending}
                    testResult={testResult}
                    testError={testError || null}
                    testInput={testInput}
                    onTestInputChange={setTestInput}
                    inputData={inputData}
                >
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="variableName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Output Variable Name</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            The variable to store the API response in.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="space-y-4 rounded-lg border p-4">
                                <h3 className="font-medium text-sm">Configuration</h3>
                                <FormField
                                    control={form.control}
                                    name="credentialId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>WhatsApp Credential</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a credential" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {isLoadingCreds ? (
                                                        <div className="p-2 flex items-center justify-center text-sm"><Loader2 className="w-4 h-4 animate-spin mr-2" />Loading...</div>
                                                    ) : credentials?.length === 0 ? (
                                                        <div className="p-2 text-sm text-center text-muted-foreground">No credentials found</div>
                                                    ) : (
                                                        credentials?.map(c => (
                                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                                        ))
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            <Button variant="link" className="px-0 h-auto text-xs" asChild>
                                                <Link href="/credentials/new?type=WHATSAPP" target="_blank">Create new credential</Link>
                                            </Button>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="to"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>To (Phone Number)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. 15551234567" {...field} />
                                            </FormControl>
                                            <FormDescription>Recipient's phone number with country code (no +)</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="message"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Message Body</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="Hello {{ name }}!" className="min-h-[100px] font-mono text-sm" {...field} />
                                            </FormControl>
                                            <FormDescription>Message text. Supports mapped variables like {`{{variable}}`}.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </form>
                    </Form>
                </NodeEditorWorkspace>
            </DialogContent>
        </Dialog>
    );
};
