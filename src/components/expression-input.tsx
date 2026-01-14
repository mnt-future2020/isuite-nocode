"use client";

import React, { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { VariablePicker } from "./variable-picker";
import { cn } from "@/lib/utils";

interface ExpressionInputProps {
    value?: string;
    onChange: (value: string) => void;
    onBlur?: () => void;
    name?: string;
    placeholder?: string;
    multiline?: boolean;
    className?: string;
    nodeId?: string;
}

export const ExpressionInput = ({
    value = "",
    onChange,
    onBlur,
    name,
    placeholder,
    multiline = false,
    className,
    nodeId,
}: ExpressionInputProps) => {
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [isDraggingOver, setIsDraggingOver] = useState(false);

    const handleSelect = (variable: string) => {
        const input = inputRef.current;
        if (!input) {
            onChange(value + variable);
            return;
        }

        const start = input.selectionStart || 0;
        const end = input.selectionEnd || 0;

        const newValue =
            value.substring(0, start) +
            variable +
            value.substring(end);

        onChange(newValue);

        // Focus and position cursor after inserted variable
        setTimeout(() => {
            input.focus();
            const newPos = start + variable.length;
            input.setSelectionRange(newPos, newPos);
        }, 10);
    };

    const InputComponent = multiline ? Textarea : Input;

    return (
        <div className={cn("group flex flex-col gap-1.5", className)}>
            <div
                className={cn(
                    "relative flex flex-col transition-all duration-200 rounded-lg border bg-background",
                    isFocused ? "ring-2 ring-primary/20 border-primary shadow-sm" : "border-input hover:border-muted-foreground/30 shadow-xs",
                    isDraggingOver && "ring-2 ring-primary border-primary border-dashed bg-primary/5"
                )}
                onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingOver(true);
                }}
                onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDraggingOver(false);
                }}
                onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingOver(false);
                    const droppedText = e.dataTransfer.getData("text/plain");
                    if (droppedText) {
                        handleSelect(droppedText);
                    }
                }}
            >
                <div className="flex items-center min-h-[44px]">
                    <div className="pl-3 pr-2 shrink-0 select-none">
                        <span className={cn(
                            "flex items-center justify-center w-5 h-5 rounded-[4px] text-[9px] font-black uppercase tracking-tighter border transition-colors",
                            value.includes("{{")
                                ? "bg-primary text-white border-primary"
                                : "bg-muted text-muted-foreground border-muted-foreground/20"
                        )}>
                            fx
                        </span>
                    </div>

                    <InputComponent
                        ref={(el: any) => {
                            (inputRef as any).current = el;
                        }}
                        name={name}
                        onFocus={() => setIsFocused(true)}
                        onBlur={(e) => {
                            setIsFocused(false);
                            onBlur?.();
                        }}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        className={cn(
                            "flex-1 border-none bg-transparent focus-visible:ring-0 shadow-none px-1 h-full font-medium text-[13px]",
                            multiline ? "py-3 min-h-[120px] resize-none" : "h-11"
                        )}
                    />

                    <div className={cn(
                        "pr-2 shrink-0 transition-opacity duration-200",
                        isFocused || value ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    )}>
                        <VariablePicker onSelect={handleSelect} currentId={nodeId} />
                    </div>
                </div>

                {value && value.includes("{{") && (
                    <div className="px-3 py-1.5 bg-muted/30 border-t border-dashed overflow-hidden flex items-center gap-2">
                        <div className="text-[10px] font-bold text-muted-foreground shrink-0 uppercase tracking-widest opacity-50 italic">Resolve</div>
                        <div className="text-[11px] text-primary font-mono truncate font-medium">
                            {value.length > 80 ? value.substring(0, 80) + "..." : value}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
