"use client";

import { type NodeProps, Position, useReactFlow } from "@xyflow/react";
import type { LucideIcon } from "lucide-react";
import Image from "next/image";
import { memo, type ReactNode } from "react";
import { BaseNode, BaseNodeContent } from "@/components/react-flow/base-node";
import { BaseHandle } from "@/components/react-flow/base-handle";
import { WorkflowNode } from "@/components/workflow-node";
import { type NodeStatus, NodeStatusIndicator } from "@/components/react-flow/node-status-indicator";
import { useState } from "react";
import { ExecutionDetailsDialog } from "./execution-details-dialog";
import { HistoryIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NodeToolbar } from "@xyflow/react";
import { cn } from "@/lib/utils";

export type NodeCategory = 'AI' | 'LOGIC' | 'DATA' | 'INTEGRATION' | 'TRIGGER' | 'DEFAULT';

interface BaseExecutionNodeProps extends NodeProps {
  icon: LucideIcon | string;
  name: string;
  description?: string;
  children?: ReactNode;
  status?: NodeStatus;
  onSettings?: () => void;
  onDoubleClick?: () => void;
  disableDefaultHandles?: boolean;
  category?: NodeCategory;
  style?: React.CSSProperties;
  className?: string;
};

const categoryStyles: Record<NodeCategory, string> = {
  AI: "bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  LOGIC: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  DATA: "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  INTEGRATION: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  TRIGGER: "bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800",
  DEFAULT: "bg-muted text-muted-foreground border-border",
};

export const BaseExecutionNode = memo(
  (props: BaseExecutionNodeProps) => {
    const {
      id,
      icon: Icon,
      name,
      description,
      onSettings,
      onDoubleClick,
      data,
      children,
      category = 'DEFAULT',
      style,
      className
    } = props as BaseExecutionNodeProps;
    const status = (data?.status as NodeStatus) || props.status || "initial";
    const execution = data?.execution;

    const { setNodes, setEdges } = useReactFlow();
    const [detailsOpen, setDetailsOpen] = useState(false);

    const handleDelete = () => {
      setNodes((currentNodes) => {
        const updatedNodes = currentNodes.filter((node) => node.id !== id);
        return updatedNodes;
      });

      setEdges((currentEdges) => {
        const updatedEdges = currentEdges.filter(
          (edge) => edge.source !== id && edge.target !== id
        );
        return updatedEdges;
      });
    };

    return (
      <WorkflowNode
        name={name}
        description={description}
        onDelete={handleDelete}
        onSettings={onSettings}
      >
        {!!execution && (
          <NodeToolbar position={Position.Top} className="flex gap-2 p-1 bg-background border rounded-md shadow-sm">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-[10px] flex gap-1 items-center"
              onClick={() => setDetailsOpen(true)}
            >
              <HistoryIcon className="size-3" />
              Results
            </Button>
          </NodeToolbar>
        )}
        <ExecutionDetailsDialog
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          execution={execution}
          nodeName={name}
        />
        <NodeStatusIndicator
          status={status}
          variant="border"
        >
          <BaseNode
            status={status}
            onDoubleClick={onDoubleClick}
            className={cn("min-w-[50px] transition-all duration-200", className)}
            style={style}
          >
            <BaseNodeContent className="flex flex-col items-center justify-center p-2">
              <div className={`p-2 rounded-xl border-2 mb-1 shadow-sm transition-colors duration-200 ${categoryStyles[category]}`}>
                {typeof Icon === "string" ? (
                  <Image src={Icon} alt={name} width={20} height={20} className="rounded-sm" />
                ) : (
                  <Icon className="size-5" />
                )}
              </div>
              {children}

              {!props.disableDefaultHandles && (
                <>
                  <BaseHandle
                    id="target-1"
                    type="target"
                    position={Position.Left}
                    className="!bg-muted-foreground"
                  />
                  <BaseHandle
                    id="source-1"
                    type="source"
                    position={Position.Right}
                    className="!bg-muted-foreground"
                  />
                </>
              )}
            </BaseNodeContent>
          </BaseNode>
        </NodeStatusIndicator>
      </WorkflowNode>
    );
  },
);

BaseExecutionNode.displayName = "BaseExecutionNode";
