"use client";

import { useReactFlow } from "@xyflow/react";
import { Braces, ChevronRight, Search } from "lucide-react";
import { useState, useMemo } from "react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { getNodeVariables } from "@/features/nodes/types";
import { cn } from "@/lib/utils";

interface VariablePickerProps {
    onSelect: (variable: string) => void;
    currentId?: string; // ID of the node currently being edited
}
const getNodeOutputVariables = (nodeType: string): Array<{ key: string, label: string }> => {
    // Map the strict schema to the UI format required here
    const vars = getNodeVariables(nodeType);
    return vars.map(v => ({ key: v.key, label: v.label }));
}

const SYSTEM_VARIABLES = [
    { key: 'system.now', label: 'Current ISO Time', description: '2024-01-01T12:00:00Z' },
    { key: 'system.today', label: 'Today\'s Date', description: '1/1/2024' },
    { key: 'system.timestamp', label: 'Unix Timestamp', description: '1704067200000' },
    { key: 'system.random', label: 'Random String', description: 'a1b2c3d4' },
];

const COMMON_FILTERS = [
    { key: 'json', label: 'Convert to JSON', description: '| json' },
    { key: 'upper', label: 'Uppercase', description: '| upper' },
    { key: 'lower', label: 'Lowercase', description: '| lower' },
    { key: 'length', label: 'Get Length', description: '| length' },
    { key: 'trim', label: 'Trim Whitespace', description: '| trim' },
];

export const VariablePicker = ({ onSelect, currentId }: VariablePickerProps) => {
    const { getNodes, getEdges } = useReactFlow();
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState<'variables' | 'system' | 'filters'>('variables');

    const availableVariables = useMemo(() => {
        const nodes = getNodes();
        const availableNodes = nodes.filter(n => n.id !== currentId);

        return availableNodes.map(node => {
            const outputs = getNodeOutputVariables(node.type as string);
            const rawPrefix = node.data.variableName || node.data.name || node.type;
            const variablePrefix = String(rawPrefix)
                .toLowerCase()
                .replace(/\s+/g, '_')
                .replace(/[^a-z0-9_]/g, '');

            return {
                nodeId: node.id,
                nodeName: node.data.name as string || node.type,
                variablePrefix: variablePrefix,
                outputs
            }
        }).filter(item => item.outputs.length > 0);
    }, [getNodes, currentId]);

    const filteredVariables = availableVariables.filter(group => {
        if (!search) return true;
        const searchLower = search.toLowerCase();
        return (
            group.nodeName?.toString().toLowerCase().includes(searchLower) ||
            group.outputs.some(out => out.label.toLowerCase().includes(searchLower))
        );
    });

    const filteredSystem = SYSTEM_VARIABLES.filter(sys =>
        !search || sys.label.toLowerCase().includes(search.toLowerCase()) || sys.key.toLowerCase().includes(search.toLowerCase())
    );

    const filteredFilters = COMMON_FILTERS.filter(f =>
        !search || f.label.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-muted-foreground hover:text-primary">
                    <Braces className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-0 shadow-xl border-primary/20" align="end" side="right">
                <div className="p-3 border-b space-y-3">
                    <div className="flex items-center gap-2 px-2 bg-muted/50 rounded-md border h-9">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <input
                            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div className="flex p-0.5 bg-muted rounded-lg">
                        {(['variables', 'system', 'filters'] as const).map((tab) => (
                            <button
                                key={tab}
                                type="button"
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    "flex-1 px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all",
                                    activeTab === tab
                                        ? "bg-background text-primary shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                <ScrollArea className="h-[350px]">
                    <div className="p-2">
                        {activeTab === 'variables' && (
                            filteredVariables.length === 0 ? (
                                <div className="p-8 text-center text-xs text-muted-foreground">
                                    No node variables found.
                                </div>
                            ) : (
                                filteredVariables.map((group) => (
                                    <div key={group.nodeId} className="mb-4 last:mb-0">
                                        <div className="px-2 py-1 flex items-center gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                                {group.nodeName}
                                            </span>
                                        </div>
                                        <div className="mt-1 space-y-0.5">
                                            {group.outputs.map((output) => {
                                                const varPath = `${group.variablePrefix}.${output.key}`;
                                                const displayStr = `{{ ${varPath} }}`;
                                                return (
                                                    <button
                                                        key={output.key}
                                                        type="button"
                                                        className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-primary/5 rounded-md group transition-all text-left border border-transparent hover:border-primary/10 cursor-grab active:cursor-grabbing"
                                                        draggable="true"
                                                        onDragStart={(e) => {
                                                            e.dataTransfer.setData("text/plain", displayStr);
                                                            e.dataTransfer.effectAllowed = "copy";
                                                        }}
                                                        onClick={() => {
                                                            onSelect(displayStr);
                                                            setOpen(false);
                                                        }}
                                                    >
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="font-semibold text-foreground group-hover:text-primary transition-colors">{output.label}</span>
                                                            <code className="text-[10px] text-muted-foreground/70 font-mono">
                                                                {varPath}
                                                            </code>
                                                        </div>
                                                        <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))
                            )
                        )}

                        {activeTab === 'system' && (
                            <div className="space-y-1">
                                {filteredSystem.map((sys) => (
                                    <button
                                        key={sys.key}
                                        type="button"
                                        className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-primary/5 rounded-md group transition-all text-left border border-transparent hover:border-primary/10 cursor-grab active:cursor-grabbing"
                                        draggable="true"
                                        onDragStart={(e) => {
                                            e.dataTransfer.setData("text/plain", `{{ ${sys.key} }}`);
                                            e.dataTransfer.effectAllowed = "copy";
                                        }}
                                        onClick={() => {
                                            onSelect(`{{ ${sys.key} }}`);
                                            setOpen(false);
                                        }}
                                    >
                                        <div className="flex flex-col gap-0.5">
                                            <span className="font-semibold text-foreground group-hover:text-primary">{sys.label}</span>
                                            <span className="text-[10px] text-muted-foreground italic font-mono">{sys.description}</span>
                                        </div>
                                        <div className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                            {sys.key}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {activeTab === 'filters' && (
                            <div className="space-y-1">
                                <div className="px-3 py-2 mb-2 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
                                    <p className="text-[10px] text-yellow-600 font-medium">
                                        Tip: Type "|" inside your variable brackets followed by a filter name.
                                        Example: {"{{ variable | json }}"}
                                    </p>
                                </div>
                                {filteredFilters.map((f) => (
                                    <button
                                        key={f.key}
                                        type="button"
                                        className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-primary/5 rounded-md group transition-all text-left border border-transparent hover:border-primary/10"
                                        onClick={() => {
                                            onSelect(` | ${f.key} `);
                                            setOpen(false);
                                        }}
                                    >
                                        <div className="flex flex-col gap-0.5">
                                            <span className="font-semibold text-foreground group-hover:text-primary">{f.label}</span>
                                            <code className="text-[10px] text-muted-foreground">{f.description}</code>
                                        </div>
                                        <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
};
