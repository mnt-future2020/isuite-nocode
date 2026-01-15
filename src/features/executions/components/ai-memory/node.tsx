
import { Handle, Position, NodeProps } from '@xyflow/react';
import { DatabaseIcon } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const AiMemoryNode = ({ data, selected }: NodeProps) => {
    return (
        <div className={cn(
            "relative min-w-[240px] rounded-xl border-2 bg-card p-4 shadow-sm transition-all",
            selected ? "border-purple-500 shadow-md ring-2 ring-purple-500/20" : "border-border hover:border-purple-500/50"
        )}>
            {/* Node Header */}
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                    <DatabaseIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                    <h3 className="font-semibold leading-none tracking-tight">AI Memory</h3>
                    <p className="text-xs text-muted-foreground mt-1">Saves chat history</p>
                </div>
            </div>

            {/* Handles */}
            {/* Connects TO the AI Agent (bottom of Memory -> Bottom of Agent) 
          Wait, usually Memory connects TO the Agent. The Agent has a "Memory" input handle.
          So this node should have a Source handle.
      */}
            <div className="relative mt-4 flex justify-end">
                <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mr-2">
                    Output
                </div>
                <Handle
                    type="source"
                    position={Position.Right}
                    id="output"
                    className="!w-4 !h-4 !bg-purple-500 !border-2 !border-background hover:!bg-purple-600 transition-colors"
                />
            </div>

            {/* Settings Action (Visible on Hover/Select) */}
            <div className={cn(
                "absolute -top-3 -right-3 flex gap-1 transition-opacity",
                selected ? "opacity-100" : "opacity-0 hover:opacity-100"
            )}>
                <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200">
                    Buffer Window
                </Badge>
            </div>

        </div>
    );
};
