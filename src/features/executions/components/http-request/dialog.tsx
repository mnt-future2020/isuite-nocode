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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ExpressionInput } from "@/components/expression-input";
import { NodeTester } from "@/components/node-tester";
import { useParams } from "next/navigation";
import { NodeType } from "@/generated/prisma";

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
  endpoint: z.string()
    .min(1, { message: "Please enter a valid URL" }),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
  body: z
    .string()
    .optional()
});

export type HttpRequestFormValues = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: z.infer<typeof formSchema>) => void;
  defaultValues?: Partial<HttpRequestFormValues>;
  nodeId?: string;
};

export const HttpRequestDialog = ({
  open,
  onOpenChange,
  onSubmit,
  defaultValues = {},
  nodeId,
}: Props) => {
  const params = useParams();
  const trpc = useTRPC();
  const workflowId = params.workflowId as string;

  const [contextInput, setContextInput] = useState('{}');

  const { testResult, testError, isPending, runTest } = useTestNode({
    workflowId,
    nodeId,
    nodeType: NodeType.HTTP_REQUEST,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      variableName: defaultValues.variableName || "",
      endpoint: defaultValues.endpoint || "",
      method: defaultValues.method || "GET",
      body: defaultValues.body || "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        variableName: defaultValues.variableName || "",
        endpoint: defaultValues.endpoint || "",
        method: defaultValues.method || "GET",
        body: defaultValues.body || "",
      });
    }
  }, [open]);

  const watchVariableName = form.watch("variableName") || "myApiCall";
  const watchMethod = form.watch("method");
  const showBodyField = ["POST", "PUT", "PATCH"].includes(watchMethod);

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit(values);
    onOpenChange(false);
  };

  const handleRunTest = () => {
    runTest(form.getValues(), contextInput, inputData);
  };

  // Get available input variables from upstream nodes
  const inputData = useNodeInputData(nodeId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent fullScreen>
        <VisuallyHidden.Root>
          <DialogTitle>HTTP Request Configuration</DialogTitle>
          <DialogDescription>
            Configure settings for the HTTP Request node.
          </DialogDescription>
        </VisuallyHidden.Root>
        <NodeEditorWorkspace
          title="HTTP Request"
          description="Fetch data from an external API or send data to a webhook."
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
                          placeholder="myApiCall"
                          className="font-medium"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-[10px]">
                        Access via: {`{{${watchVariableName}.httpResponse.data}}`}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-bold">Method</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="GET">GET</SelectItem>
                          <SelectItem value="POST">POST</SelectItem>
                          <SelectItem value="PUT">PUT</SelectItem>
                          <SelectItem value="PATCH">PATCH</SelectItem>
                          <SelectItem value="DELETE">DELETE</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="endpoint"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-bold">Endpoint URL</FormLabel>
                    <FormControl>
                      <ExpressionInput
                        placeholder="https://api.example.com/data"
                        nodeId={nodeId}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {showBodyField && (
                <FormField
                  control={form.control}
                  name="body"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-bold">Request Body (JSON)</FormLabel>
                      <FormControl>
                        <ExpressionInput
                          multiline
                          placeholder='{"key": "value"}'
                          className="min-h-[150px] font-mono"
                          nodeId={nodeId}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="pt-4 border-t flex justify-end">
                <Button type="submit" size="lg" className="px-8 font-bold shadow-md">
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
