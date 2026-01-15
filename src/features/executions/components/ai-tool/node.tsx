
import { Handle, Position, NodeProps } from '@xyflow/react';
import { HammerIcon, Settings2Icon, SearchIcon, CalculatorIcon } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState } from 'react';
import { AiToolDialog } from './dialog';

export const AiToolNode = ({ id, data, selected }: NodeProps) => {
    const [open, setOpen] = useState(false);
    const toolType = (data.toolType as string) || "duckduckgo_search";

    const getIcon = () => {
        switch (toolType) {
            case 'duckduckgo_search': return SearchIcon;
            case 'calculator': return CalculatorIcon;
            default: return HammerIcon;
        }
    };

    const Icon = getIcon();

    return (
        <>
            <div className={cn(
                "relative min-w-[240px] rounded-xl border-2 bg-card p-4 shadow-sm transition-all group",
                selected ? "border-amber-500 shadow-md ring-2 ring-amber-500/20" : "border-border hover:border-amber-500/50"
            )}>
                {/* Node Header */}
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                        <Icon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold leading-none tracking-tight">AI Tool</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                            {toolType === 'custom' ? (data.name as string || 'Custom Tool') :
                                toolType === 'calculator' ? 'Calculator' : 'Internet Search'}
                        </p>
                    </div>
                </div>

                {/* Handles */}
                <div className="relative mt-4 flex justify-end">
                    <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mr-2">
                        Output
                    </div>
                    <Handle
                        type="source"
                        position={Position.Right}
                        id="output"
                        className="!w-4 !h-4 !bg-amber-500 !border-2 !border-background hover:!bg-amber-600 transition-colors"
                    />
                </div>

                {/* Badges */}
                <div className={cn(
                    "absolute -top-3 -right-3 flex gap-1 transition-opacity",
                    selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setOpen(true);
                        }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-1 rounded-full shadow-sm border border-slate-200 transition-colors"
                        title="Configure Tool"
                    >
                        <Settings2Icon className="w-3 h-3" />
                    </button>
                    <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200">
                        {toolType === 'custom' ? 'Fn' : toolType === 'calculator' ? 'Calc' : 'Search'}
                    </Badge>
                </div>
            </div>

            <AiToolDialog nodeId={id} open={open} onOpenChange={setOpen} />
        </>
    );
};
