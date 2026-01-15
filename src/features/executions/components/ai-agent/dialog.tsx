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
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ExpressionInput } from "@/components/expression-input";
import { useNodeInputData } from "@/hooks/use-node-input-schema";
import { NodeEditorWorkspace } from "@/components/node-editor-workspace";
import { useParams } from "next/navigation";

const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
    role: z.string().optional(),
    systemPrompt: z.string().optional(),
});

export type AiAgentFormValues = z.infer<typeof formSchema>;

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (values: z.infer<typeof formSchema>) => void;
    defaultValues?: Partial<AiAgentFormValues>;
    nodeId?: string;
};

export const AiAgentDialog = ({
    open,
    onOpenChange,
    onSubmit,
    defaultValues = {},
    nodeId,
}: Props) => {
    const params = useParams();
    const nodeIdStr = nodeId || "";
    const inputData = useNodeInputData(nodeIdStr);
    const [contextInput, setContextInput] = useState('{}');

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: defaultValues.name || "My Agent",
            role: defaultValues.role || "Assistant",
            systemPrompt: defaultValues.systemPrompt || "You are a helpful assistant.",
        },
    });

    useEffect(() => {
        if (open) {
            form.reset({
                name: defaultValues.name || "My Agent",
                role: defaultValues.role || "Assistant",
                systemPrompt: defaultValues.systemPrompt || "You are a helpful assistant.",
            });
        }
    }, [open]);

    const handleSubmit = (values: z.infer<typeof formSchema>) => {
        onSubmit(values);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent fullScreen>
                <VisuallyHidden.Root>
                    <DialogTitle>AI Agent Configuration</DialogTitle>
                    <DialogDescription>
                        Configure your AI Agent's persona and logic.
                    </DialogDescription>
                </VisuallyHidden.Root>
                <NodeEditorWorkspace
                    title="AI Agent"
                    description="Configure the brain of your workflow."
                    testInput={JSON.parse(contextInput || '{}')}
                    onTestInputChange={setContextInput}
                    testResult={null}
                    testError={null}
                    onRunTest={() => { }}
                    isPending={false}
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
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm font-bold">Agent Name</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Support Bot"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="role"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm font-bold">Role (Optional)</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Customer Support Specialist"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription className="text-xs">
                                            Brief description of the agent's role.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="systemPrompt"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm font-bold">System Prompt</FormLabel>
                                        <FormControl>
                                            <ExpressionInput
                                                multiline
                                                placeholder="You are a helpful AI..."
                                                className="min-h-[200px]"
                                                nodeId={nodeId}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription className="text-xs">
                                            Define the agent's behavior and constraints.
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
