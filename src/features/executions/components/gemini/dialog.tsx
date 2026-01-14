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
import { ExpressionInput } from "@/components/expression-input";
import { NodeTester } from "@/components/node-tester";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useCredentialsByType } from "@/features/credentials/hooks/use-credentials";
import { CredentialType, NodeType } from "@/generated/prisma";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";

import { NodeEditorWorkspace } from "@/components/node-editor-workspace";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useNodeInputData } from "@/hooks/use-node-input-schema";
import { useTestNode } from "@/hooks/use-test-node";

const formSchema = z.object({
  variableName: z
    .string()
    .min(1, { message: "Variable name is required" })
    .regex(/^[A-Za-z_$][A-Za-z0-9_$]*$/, {
      message: "Variable name must start with a letter or underscore and container only letters, numbers, and underscores",
    }),
  credentialId: z.string().min(1, "Credential is required"),
  systemPrompt: z.string().optional(),
  userPrompt: z.string().min(1, "User prompt is required"),
});

export type GeminiFormValues = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: z.infer<typeof formSchema>) => void;
  defaultValues?: Partial<GeminiFormValues>;
  nodeId?: string;
};

export const GeminiDialog = ({
  open,
  onOpenChange,
  onSubmit,
  defaultValues = {},
  nodeId,
}: Props) => {
  const {
    data: credentials,
    isLoading: isLoadingCredentials,
  } = useCredentialsByType(CredentialType.GEMINI);

  const params = useParams();
  const trpc = useTRPC();
  const workflowId = params.workflowId as string;

  // Get available input variables from upstream nodes
  const inputData = useNodeInputData(nodeId);

  const [contextInput, setContextInput] = useState('{}');

  const { testResult, testError, isPending, runTest } = useTestNode({
    workflowId,
    nodeId,
    nodeType: NodeType.GEMINI,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      variableName: defaultValues.variableName || "",
      credentialId: defaultValues.credentialId || "",
      systemPrompt: defaultValues.systemPrompt || "",
      userPrompt: defaultValues.userPrompt || "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        variableName: defaultValues.variableName || "",
        credentialId: defaultValues.credentialId || "",
        systemPrompt: defaultValues.systemPrompt || "",
        userPrompt: defaultValues.userPrompt || "",
      });
    }
  }, [open]);

  const watchVariableName = form.watch("variableName") || "myGemini";

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
          <DialogTitle>Gemini Configuration</DialogTitle>
          <DialogDescription>
            Configure settings for the Google Gemini node.
          </DialogDescription>
        </VisuallyHidden.Root>
        <NodeEditorWorkspace
          title="Google Gemini"
          description="Use Google's most capable AI models to complete tasks."
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
              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="variableName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-bold">Variable Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="myGemini"
                          className="font-medium"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-[10px]">
                        Access text via: {`{{${watchVariableName}.text}}`}
                      </FormDescription>
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
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a credential" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {credentials?.map((credential) => (
                            <SelectItem
                              key={credential.id}
                              value={credential.id}
                            >
                              {credential.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="systemPrompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-bold">System Prompt (Optional)</FormLabel>
                    <FormControl>
                      <ExpressionInput
                        placeholder="You are a helpful assistant."
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
                name="userPrompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-bold">User Prompt</FormLabel>
                    <FormControl>
                      <ExpressionInput
                        multiline
                        placeholder="Summarize this text: {{json httpResponse.data}}"
                        className="min-h-[200px]"
                        nodeId={nodeId}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      The prompt to send to the AI. Use {"{{variables}}"} for mapping.
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
