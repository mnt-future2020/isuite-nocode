"use client";

import React, { useState } from "react";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JsonTreeView } from "./json-tree-view";
import { Button } from "@/components/ui/button";
import { Play, Settings2, Database, Terminal, FileJson, X, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { InputSchemaPanel } from "./input-schema-panel";

interface NodeInputData {
    nodeId: string;
    nodeName: string;
    variableName: string;
    nodeType: string;
    output: any;
}

interface NodeEditorWorkspaceProps {
    title: string;
    description?: string;
    children: React.ReactNode; // The form
    testInput: any;
    onTestInputChange: (val: string) => void;
    testResult: any;
    testError: string | null;
    onRunTest: () => void;
    isPending: boolean;
    onClose: () => void;
    inputData?: NodeInputData[]; // Data from upstream nodes
}

export const NodeEditorWorkspace = ({
    title,
    description,
    children,
    testInput,
    onTestInputChange,
    testResult,
    testError,
    onRunTest,
    isPending,
    onClose,
    inputData = [],
}: NodeEditorWorkspaceProps) => {
    return (
        <div className="fixed top-0 left-0 right-0 bottom-0 w-screen h-screen z-[9999] flex flex-col bg-background">
            {/* Professional n8n-style Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30 h-14 shrink-0">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-md hover:bg-muted font-bold">
                        <X className="h-5 w-5" />
                    </Button>
                    <div className="h-6 w-px bg-border" />
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-primary/10 rounded-md border border-primary/20">
                            <Settings2 className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex flex-col">
                            <h3 className="text-sm font-bold leading-none">{title}</h3>
                            <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">{description}</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-muted/50 rounded-md p-1 border shadow-sm">
                        <Button
                            onClick={onRunTest}
                            disabled={isPending}
                            variant="ghost"
                            size="sm"
                            className="h-8 px-4 text-xs font-bold hover:bg-primary hover:text-white transition-all group"
                        >
                            {isPending ? (
                                <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                            ) : (
                                <Play className="h-3.5 w-3.5 mr-2 fill-current group-hover:fill-white" />
                            )}
                            Test Step
                        </Button>
                    </div>
                    <div className="h-6 w-px bg-border mx-1" />
                    <Button variant="default" size="sm" className="h-8 px-6 font-bold shadow-md bg-blue-600 hover:bg-blue-700">
                        Save
                    </Button>
                </div>
            </div>

            {/* Main Content Area */}
            <ResizablePanelGroup direction="horizontal" className="flex-1 overflow-hidden">
                {/* Left Panel: Input Data (Shows available variables from upstream nodes) */}
                <ResizablePanel defaultSize={25} minSize={18} className="bg-[#fcfcfc] dark:bg-[#0c0c0c]">
                    <div className="h-full flex flex-col">
                        <div className="px-4 py-2 border-b flex items-center justify-between h-10 shrink-0">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Database className="h-3 w-3" />
                                Input Data
                            </span>
                            <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-sm text-muted-foreground hover:text-foreground">
                                    <Maximize2 className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                        <ScrollArea className="flex-1">
                            <div className="p-3">
                                <InputSchemaPanel nodeInputs={inputData} />
                            </div>
                        </ScrollArea>
                    </div>
                </ResizablePanel>

                <ResizableHandle className="w-1.5 bg-border/50 hover:bg-primary/30 transition-colors" />

                {/* Middle Panel: Configuration (The Focus) */}
                <ResizablePanel defaultSize={50} minSize={30} className="bg-white dark:bg-zinc-950">
                    <Tabs defaultValue="parameters" className="h-full flex flex-col">
                        <div className="border-b shrink-0 h-10 flex items-center px-4 bg-muted/5">
                            <TabsList className="bg-transparent h-10 p-0 gap-8">
                                <TabsTrigger value="parameters" className="relative h-10 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent shadow-none px-0 text-xs font-bold uppercase tracking-wide transition-all">
                                    Parameters
                                </TabsTrigger>
                                <TabsTrigger value="settings" className="relative h-10 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent shadow-none px-0 text-xs font-bold uppercase tracking-wide transition-all">
                                    Settings
                                </TabsTrigger>
                            </TabsList>
                        </div>
                        <ScrollArea className="flex-1">
                            <TabsContent value="parameters" className="mt-0 h-full">
                                <div className="p-10">
                                    <div className="space-y-8">
                                        {children}
                                    </div>
                                </div>
                            </TabsContent>
                            <TabsContent value="settings" className="mt-0 h-full">
                                <div className="p-10 space-y-6">
                                    <div className="space-y-2">
                                        <h4 className="font-bold text-sm">Node Settings</h4>
                                        <p className="text-sm text-muted-foreground">Configure general settings for this node.</p>
                                    </div>

                                    <div className="p-4 rounded-lg border bg-muted/10 space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold uppercase text-muted-foreground">Node Name & Description</label>
                                            <div className="text-sm font-medium">{title}</div>
                                            <div className="text-xs text-muted-foreground">{description || "No description"}</div>
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-lg border bg-yellow-50/50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-900/30">
                                        <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                                            Retry policies and Error handling settings coming soon.
                                        </p>
                                    </div>
                                </div>
                            </TabsContent>
                        </ScrollArea>
                    </Tabs>
                </ResizablePanel>

                <ResizableHandle className="w-1.5 bg-border/50 hover:bg-primary/30 transition-colors" />

                {/* Right Panel: Output Result (Rich Result Display) */}
                <ResizablePanel defaultSize={25} minSize={20} className="bg-[#fcfcfc] dark:bg-[#0c0c0c]">
                    <div className="h-full flex flex-col">
                        <div className="px-4 py-2 border-b flex items-center justify-between h-10 shrink-0">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Terminal className="h-3 w-3" />
                                Output Result
                            </span>
                            {testResult && (
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
                                    <div className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]" />
                                    <span className="text-[9px] font-bold text-green-600">SUCCESS</span>
                                </div>
                            )}
                        </div>
                        <ScrollArea className="flex-1">
                            <div className="p-4">
                                {testResult ? (() => {
                                    // Unwrap the result - executors return { variableName: actualData }
                                    const keys = Object.keys(testResult);
                                    const variableName = keys.length === 1 ? keys[0] : null;
                                    const actualData = variableName ? testResult[variableName] : testResult;

                                    return (
                                        <div className="space-y-4">
                                            {variableName && (
                                                <div className="px-3 py-2 bg-muted/50 rounded-lg border border-dashed mb-3">
                                                    <p className="text-[10px] text-muted-foreground mb-1">Access this data using:</p>
                                                    <code className="text-xs font-mono text-primary font-semibold">
                                                        {`{{ ${variableName} }}`}
                                                    </code>
                                                </div>
                                            )}
                                            <JsonTreeView data={actualData} label="Output" />
                                        </div>
                                    );
                                })() : testError ? (
                                    <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30">
                                        <div className="flex items-center gap-2 mb-2 text-red-600">
                                            <X className="h-3.5 w-3.5" />
                                            <span className="text-[10px] font-black uppercase">Execution Failed</span>
                                        </div>
                                        <p className="text-[11px] font-medium font-mono text-red-700 dark:text-red-400 break-words leading-relaxed whitespace-pre-wrap">{testError}</p>
                                    </div>
                                ) : (
                                    <div className="py-32 flex flex-col items-center justify-center text-center opacity-30 select-none">
                                        <div className="relative mb-6">
                                            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                                            <FileJson className="h-12 w-12 text-muted-foreground relative z-10" />
                                        </div>
                                        <p className="text-xs font-bold leading-tight mb-1">Waiting for Test Run</p>
                                        <p className="text-[10px] text-muted-foreground max-w-[140px]">Configure your node and click "Test Step" to see results</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
};
