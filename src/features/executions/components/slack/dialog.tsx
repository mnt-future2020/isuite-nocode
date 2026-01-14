"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
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
import { Textarea } from "@/components/ui/textarea";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { VariablePicker } from "@/components/variable-picker";

import { NodeEditorWorkspace } from "@/components/node-editor-workspace";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useParams } from "next/navigation";
import { NodeType } from "@/generated/prisma";
import { ExpressionInput } from "@/components/expression-input";
import { useNodeInputData } from "@/hooks/use-node-input-schema";
import { useTestNode } from "@/hooks/use-test-node";

const formSchema = z.object({
  variableName: z
    .string()
    .min(1, { message: "Variable name is required" })
    .regex(/^[A-Za-z_$][A-Za-z0-9_$]*$/, {
      message: "Variable name must start with a letter or underscore and container only letters, numbers, and underscores",
    }),
  content: z
    .string()
    .min(1, "Message content is required"),
  webhookUrl: z.string().min(1, "Webhook URL is required"),
});

export type SlackFormValues = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: z.infer<typeof formSchema>) => void;
  defaultValues?: Partial<SlackFormValues>;
  nodeId?: string;
};

export const SlackDialog = ({
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

  const [contextInput, setContextInput] = useState('{}');

  const { testResult, testError, isPending, runTest } = useTestNode({
    workflowId,
    nodeId,
    nodeType: NodeType.SLACK,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      variableName: defaultValues.variableName || "slack",
      content: defaultValues.content || "",
      webhookUrl: defaultValues.webhookUrl || "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        variableName: defaultValues.variableName || "slack",
        content: defaultValues.content || "",
        webhookUrl: defaultValues.webhookUrl || "",
      });
    }
  }, [open]);

  const watchVariableName = form.watch("variableName") || "slack";

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
          <DialogTitle>Slack Configuration</DialogTitle>
          <DialogDescription>
            Configure settings for the Slack node.
          </DialogDescription>
        </VisuallyHidden.Root>
        <NodeEditorWorkspace
          title="Slack"
          description="Send messages to Slack channels using webhooks."
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
                      <Input
                        placeholder="slack"
                        className="font-medium"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-[10px]">
                      Access result via: {`{{${watchVariableName}.success}}`}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="webhookUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-bold">Webhook URL</FormLabel>
                    <FormControl>
                      <ExpressionInput
                        placeholder="https://hooks.slack.com/services/..."
                        nodeId={nodeId}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      The Slack Webhook URL to send the message to.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-bold">Message Content</FormLabel>
                    <FormControl>
                      <ExpressionInput
                        multiline
                        placeholder="Summary: {{myGemini.text}}"
                        className="min-h-[150px]"
                        nodeId={nodeId}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      The message text to send. Supports Slack markdown and variables.
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
