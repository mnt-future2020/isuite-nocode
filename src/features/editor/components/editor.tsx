"use client";

import { useState, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type Connection,
  Background,
  Controls,
  MiniMap,
  Panel,
} from '@xyflow/react';
import { ErrorView, LoadingView } from "@/components/entity-components";
import { useSuspenseWorkflow } from "@/features/workflows/hooks/use-workflows";

import '@xyflow/react/dist/style.css';
import { nodeComponents } from '@/config/node-components';
import { AddNodeButton } from './add-node-button';
import { NodeType } from '@/generated/prisma';
import { ExecuteWorkflowButton } from './execute-workflow-button';
import { useWorkflowExecutionPoll } from '@/features/executions/hooks/use-executions';
import { editorAtom, executionAtom, selectedExecutionIdAtom } from '../store/atoms';
import { useEffect } from 'react';
import { useSetAtom, useAtom } from 'jotai';
import { useExecution } from '@/features/executions/hooks/use-executions';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { HistoryIcon, DownloadIcon, UploadIcon } from "lucide-react";
import { WorkflowExecutionsList } from "./workflow-executions-list";
import { toast } from 'sonner';
import { useSearchParams } from 'next/navigation';
import { TEMPLATES } from '@/config/templates';

export const EditorLoading = () => {
  return <LoadingView message="Loading editor..." />;
};

export const EditorError = () => {
  return <ErrorView message="Error loading editor" />;
};

export const Editor = ({ workflowId }: { workflowId: string }) => {
  const {
    data: workflow
  } = useSuspenseWorkflow(workflowId);

  const searchParams = useSearchParams();

  const setEditor = useSetAtom(editorAtom);
  const setExecution = useSetAtom(executionAtom);
  const [selectedExecutionId, setSelectedExecutionId] = useAtom(selectedExecutionIdAtom);

  const [nodes, setNodes] = useState<Node[]>(workflow.nodes);
  const [edges, setEdges] = useState<Edge[]>(workflow.edges);

  // Restore Execution Logic
  // 1. Poll for latest if no history selected
  const { data: latestExecution } = useWorkflowExecutionPoll(workflowId, !selectedExecutionId);

  // 2. Fetch specific history if selected
  const { data: historyExecution } = useExecution(selectedExecutionId);

  // 3. Determine which execution to show
  const activeExecution = selectedExecutionId ? historyExecution : latestExecution;

  useEffect(() => {
    setExecution(activeExecution);
  }, [activeExecution, setExecution]);

  // Reset selection on unmount or workflow change
  useEffect(() => {
    return () => setSelectedExecutionId(null);
  }, [workflowId, setSelectedExecutionId]);

  useEffect(() => {
    const templateId = searchParams.get('template');
    if (templateId) {
      const template = TEMPLATES.find(t => t.id === templateId);
      if (template) {
        setNodes(template.nodes);
        setEdges(template.edges);
        toast.info(`Loaded "${template.name}" template`);

        // Remove query param
        const params = new URLSearchParams(searchParams.toString());
        params.delete('template');
        window.history.replaceState(null, '', `?${params.toString()}`);
      }
    }
  }, [searchParams, workflow.nodes, workflow.edges]);

  const exportWorkflow = useCallback(() => {
    const data = {
      nodes,
      edges,
      name: workflow.name,
      version: "1.0",
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflow.name.replace(/\s+/g, '_')}_export.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Workflow scheme exported to JSON");
  }, [nodes, edges, workflow.name]);

  const importWorkflow = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);

        if (Array.isArray(data.nodes) && Array.isArray(data.edges)) {
          setNodes(data.nodes);
          setEdges(data.edges);
          toast.success("Workflow imported successfully (save to persist)");
        } else {
          toast.error("Invalid workflow file format");
        }
      } catch (err) {
        toast.error("Failed to parse JSON file");
      }
      // Reset input
      e.target.value = '';
    };
    reader.readAsText(file);
  }, []);

  const styledNodes = useMemo(() => {
    if (!activeExecution) return nodes;

    return nodes.map(node => {
      const stepExecution = activeExecution.stepExecutions.find((s: any) => s.nodeId === node.id);

      // If we are viewing history, and this node wasn't part of it, it should probably look "inactive"
      // But for now, let's just leave it as is, or maybe dim it?
      if (!stepExecution) {
        return {
          ...node,
          data: { ...node.data, status: 'initial', execution: undefined }
        };
      }

      return {
        ...node,
        data: {
          ...node.data,
          status: stepExecution.status,
          execution: stepExecution
        }
      };
    });
  }, [nodes, activeExecution]);

  const styledEdges = useMemo(() => {
    if (!activeExecution) return edges;

    return edges.map(edge => {
      const sourceStep = activeExecution.stepExecutions.find((s: any) => s.nodeId === edge.source);

      // Check if target was executed (meaning flow went there)
      const isTargetExecuted = activeExecution.stepExecutions.some((s: any) => s.nodeId === edge.target);

      // Check for branching logic (if source is switch/condition, did it take this path?)
      const sourceNode = nodes.find(n => n.id === edge.source);
      let isPathTaken = isTargetExecuted;

      if (sourceStep?.output && (sourceNode?.type === NodeType.SWITCH || sourceNode?.type === NodeType.CONDITION)) {
        const branchId = (sourceStep.output as any).__branch;
        if (branchId) {
          isPathTaken = branchId === edge.sourceHandle || (branchId === edge.target); // Simplified check
          // Actually, for Switch/Condition, the 'sourceHandle' of the edge usually matches the branch value
          if (edge.sourceHandle) {
            isPathTaken = edge.sourceHandle === branchId;
          }
        }
      }

      const isActive = sourceStep?.status === 'SUCCESS' && isPathTaken;

      return {
        ...edge,
        animated: isActive,
        style: {
          stroke: isActive ? '#22c55e' : '#94a3b8', // Green for active path
          strokeWidth: isActive ? 3 : 1,
          opacity: isActive ? 1 : 0.5
        }
      };
    });
  }, [edges, activeExecution, nodes]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
    [],
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
    [],
  );
  const onConnect = useCallback(
    (params: Connection) => setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
    [],
  );

  const hasManualTrigger = useMemo(() => {
    return nodes.some((node) => node.type === NodeType.MANUAL_TRIGGER);
  }, [nodes]);

  return (
    <div className='size-full relative'>
      {selectedExecutionId && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-background/80 backdrop-blur border rounded-full px-4 py-1.5 text-xs font-medium flex items-center gap-2 shadow-sm text-foreground">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          Viewing History Mode
          <button
            onClick={() => setSelectedExecutionId(null)}
            className="ml-2 hover:bg-muted rounded-full p-0.5"
          >
            ✕
          </button>
        </div>
      )}
      <ReactFlow
        nodes={styledNodes}
        edges={styledEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeComponents}
        onInit={setEditor}
        fitView
        snapGrid={[10, 10]}
        snapToGrid
        panOnScroll
        panOnDrag={false}
        selectionOnDrag
      >
        <Background />
        <Controls />
        <MiniMap />
        <Panel position="top-right" className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            className="bg-background h-9 w-9 p-0"
            onClick={exportWorkflow}
            title="Export to JSON"
          >
            <DownloadIcon className="size-4" />
          </Button>

          <label className="cursor-pointer">
            <div className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 w-9">
              <UploadIcon className="size-4" />
              <input
                type="file"
                className="hidden"
                accept=".json"
                onChange={importWorkflow}
              />
            </div>
          </label>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="bg-background h-9 w-9 p-0">
                <HistoryIcon className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Execution History</SheetTitle>
              </SheetHeader>
              <div className="mt-4 border rounded-md h-[calc(100vh-100px)] overflow-y-auto">
                <WorkflowExecutionsList workflowId={workflowId} />
              </div>
            </SheetContent>
          </Sheet>
          <AddNodeButton />
        </Panel>
        {hasManualTrigger && (
          <Panel position="bottom-center">
            <ExecuteWorkflowButton workflowId={workflowId} />
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
};
