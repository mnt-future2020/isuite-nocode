"use client";

import { type NodeProps, Position, useReactFlow } from "@xyflow/react";
import type { LucideIcon } from "lucide-react";
import Image from "next/image";
import { memo, type ReactNode } from "react";
import { BaseNode, BaseNodeContent } from "@/components/react-flow/base-node";
import { BaseHandle } from "@/components/react-flow/base-handle";
import { WorkflowNode } from "@/components/workflow-node";
import { type NodeStatus, NodeStatusIndicator } from "@/components/react-flow/node-status-indicator";

interface BaseTriggerNodeProps extends NodeProps {
  icon: LucideIcon | string;
  name: string;
  description?: string;
  children?: ReactNode;
  status?: NodeStatus;
  onSettings?: () => void;
  onDoubleClick?: () => void;
};

export const BaseTriggerNode = memo(
  ({
    id,
    icon: Icon,
    name,
    description,
    children,
    status = "initial",
    onSettings,
    onDoubleClick,
  }: BaseTriggerNodeProps) => {
    const { setNodes, setEdges } = useReactFlow();
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
        onDelete={handleDelete}
        onSettings={onSettings}
      >
        <NodeStatusIndicator
          status={status}
          variant="border"
          className="rounded-xl"
        >
          <div className="relative flex flex-col items-center">
            <BaseNode
              status={status}
              onDoubleClick={onDoubleClick}
              className="min-w-[40px] w-[40px] h-[40px] flex items-center justify-center transition-all duration-200"
            >
              <BaseNodeContent className="flex items-center justify-center w-full h-full p-0">
                <div className="w-full h-full p-1.5 rounded-xl border shadow-sm flex items-center justify-center transition-colors duration-200 bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800">
                  {typeof Icon === "string" ? (
                    <Image src={Icon} alt={name} width={22} height={22} className="rounded-sm" />
                  ) : (
                    <Icon className="size-5" />
                  )}
                </div>
                {children}
                <BaseHandle
                  id="source-1"
                  type="source"
                  position={Position.Right}
                  className="!bg-muted-foreground w-2.5 h-2.5 border-2 border-background -right-1.5"
                />
              </BaseNodeContent>
            </BaseNode>
            <div className="absolute top-full mt-1.5 text-center w-[120px] pointer-events-none">
              <div className="text-[9px] font-medium leading-tight truncate text-foreground/80 px-1.5 py-0.5 rounded-md bg-background/80 backdrop-blur-sm shadow-sm border border-border/50 inline-block max-w-full">
                {name}
              </div>
            </div>
          </div>
        </NodeStatusIndicator>
      </WorkflowNode>
    )
  },
);

BaseTriggerNode.displayName = "BaseTriggerNode";
