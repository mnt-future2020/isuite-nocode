"use client";

import React, { useState } from "react";
import { ChevronRight, ChevronDown, Package, FileJson, List, Hash, Type, Braces } from "lucide-react";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface JsonTreeViewProps {
    data: any;
    label?: string;
    level?: number;
    isLast?: boolean;
    defaultExpanded?: boolean;
    path?: string;
}

export const JsonTreeViewComponent = ({ data, label, level = 0, isLast = true, defaultExpanded = false, path }: JsonTreeViewProps) => {
    const [isOpen, setIsOpen] = useState(defaultExpanded || level < 2); // Expand first 2 levels by default or if defaultExpanded is true

    const getType = (val: any) => {
        if (Array.isArray(val)) return "array";
        if (val === null) return "null";
        return typeof val;
    };

    const type = getType(data);
    const isExpandable = type === "object" || type === "array";

    const handleDragStart = (e: React.DragEvent) => {
        if (path) {
            e.stopPropagation();
            e.dataTransfer.setData("text/plain", `{{ ${path} }}`);
            e.dataTransfer.effectAllowed = "copy";
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case "object": return <Package className="h-3 w-3 text-blue-500" />;
            case "array": return <List className="h-3 w-3 text-orange-500" />;
            case "number": return <Hash className="h-3 w-3 text-emerald-500" />;
            case "string": return <Type className="h-3 w-3 text-indigo-500" />;
            case "boolean": return <Braces className="h-3 w-3 text-rose-500" />;
            default: return <FileJson className="h-3 w-3 text-muted-foreground" />;
        }
    };

    if (!isExpandable) {
        return (
            <div
                className={cn(
                    "flex items-center gap-2 py-0.5 group rounded hover:bg-muted/50 transition-colors px-1",
                    level > 0 && "ml-4",
                    path && "cursor-grab active:cursor-grabbing hover:bg-primary/5 border border-transparent hover:border-primary/10"
                )}
                draggable={!!path}
                onDragStart={handleDragStart}
            >
                <div className="flex items-center gap-1.5 min-w-[100px]">
                    {getIcon(type)}
                    <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">{label}:</span>
                </div>
                <span className={cn(
                    "text-xs font-mono break-all",
                    type === "number" && "text-emerald-600",
                    type === "string" && "text-indigo-600",
                    type === "boolean" && "text-rose-600",
                    type === "null" && "text-muted-foreground italic"
                )}>
                    {type === "string" ? `"${data}"` : String(data)}
                </span>
            </div>
        );
    }

    const items = Object.entries(data);

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className={cn("py-0.5", level > 0 && "ml-4")}>
            <div className="flex items-center gap-1">
                <CollapsibleTrigger className="flex items-center gap-1.5 hover:bg-muted/50 rounded px-1 transition-colors w-full text-left">
                    {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    <div
                        className={cn(
                            "flex items-center gap-1.5 flex-1",
                            path && "cursor-grab active:cursor-grabbing hover:text-primary transition-colors"
                        )}
                        draggable={!!path}
                        onDragStart={handleDragStart}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {getIcon(type)}
                        <span className="text-xs font-semibold">{label || (type === "array" ? "Items" : "Object")}</span>
                        <span className="text-[10px] text-muted-foreground lowercase">
                            ({type === "array" ? `${items.length} items` : "object"})
                        </span>
                    </div>
                </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="border-l border-muted-foreground/10 ml-1.5 pl-2 mt-0.5 space-y-0.5">
                {items.map(([key, value], index) => (
                    <JsonTreeView
                        key={key}
                        label={key}
                        data={value}
                        level={level + 1}
                        isLast={index === items.length - 1}
                        path={path ? (Array.isArray(data) ? `${path}[${key}]` : `${path}.${key}`) : undefined}
                    />
                ))}
                {items.length === 0 && (
                    <div className="text-xs text-muted-foreground italic ml-4 py-1">Empty {type}</div>
                )}
            </CollapsibleContent>
        </Collapsible>
    );
};

export const JsonTreeView = React.memo(JsonTreeViewComponent);
