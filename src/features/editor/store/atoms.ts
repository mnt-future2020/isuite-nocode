import type { ReactFlowInstance } from "@xyflow/react";
import { atom } from "jotai";

export const editorAtom = atom<ReactFlowInstance | null>(null);

export const executionAtom = atom<any>(null);

export const selectedExecutionIdAtom = atom<string | null>(null);
