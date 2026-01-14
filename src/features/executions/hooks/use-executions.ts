import { useTRPC } from "@/trpc/client"
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useExecutionsParams } from "./use-executions-params";

/**
 * Hook to fetch all executions using suspense
 */
export const useSuspenseExecutions = () => {
  const trpc = useTRPC();
  const [params] = useExecutionsParams();

  return useSuspenseQuery(trpc.executions.getMany.queryOptions(params));
};

/**
 * Hook to fetch a single execution using suspense
 */
export const useSuspenseExecution = (id: string) => {
  const trpc = useTRPC();
  return useSuspenseQuery(trpc.executions.getOne.queryOptions({ id }));
};

/**
 * Hook to fetch a single execution (conditional)
 */
export const useExecution = (id: string | null) => {
  const trpc = useTRPC();
  return useQuery({
    ...trpc.executions.getOne.queryOptions({ id: id! }),
    enabled: !!id,
  });
};

/**
 * Hook to fetch the latest execution for a workflow
 */
export const useLatestExecution = (workflowId: string) => {
  const trpc = useTRPC();
  return useQuery(trpc.executions.getLatestForWorkflow.queryOptions({ workflowId }));
};

/**
 * Hook to poll for execution updates
 */
export const useWorkflowExecutionPoll = (workflowId: string, enabled: boolean) => {
  const trpc = useTRPC();
  return useQuery({
    ...trpc.executions.getLatestForWorkflow.queryOptions({ workflowId }),
    enabled,
    refetchInterval: 1000, // Poll every second
  });
};
