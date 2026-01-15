import { createId } from "@paralleldrive/cuid2";
import { useReactFlow } from "@xyflow/react";
import {
  GlobeIcon,
  MousePointerIcon,
  GitBranchIcon,
  ClockIcon,
  SplitIcon,
  WebhookIcon,
  CodeIcon,
  RepeatIcon,
  CalendarClockIcon,
  MailIcon,
  MergeIcon,
  PenLineIcon,
  AlertTriangleIcon,
  LayersIcon,
  DatabaseIcon,
  MessageSquareIcon,
  FileTextIcon,
  PlayCircleIcon,
  SearchIcon,
  XIcon,
  Settings2Icon,
  HammerIcon,
} from "lucide-react";
import { useCallback, useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NodeType } from "@/generated/prisma";
import { Separator } from "./ui/separator";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export type NodeTypeOption = {
  type: NodeType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }> | string;
  category?: string;
};

type NodeCategory = {
  id: string;
  label: string;
  description: string;
  nodes: NodeTypeOption[];
  color: string;
};

const triggerNodes: NodeTypeOption[] = [
  {
    type: NodeType.MANUAL_TRIGGER,
    label: "Trigger manually",
    description: "Runs the flow on clicking a button",
    icon: MousePointerIcon,
  },
  {
    type: NodeType.SCHEDULE,
    label: "Schedule (Cron)",
    description: "Runs the flow on a schedule",
    icon: CalendarClockIcon,
  },
  {
    type: NodeType.WEBHOOK,
    label: "Webhook",
    description: "Triggers via unique URL (POST)",
    icon: WebhookIcon,
  },
  {
    type: NodeType.ERROR_TRIGGER,
    label: "Error Trigger",
    description: "Runs when another node fails",
    icon: AlertTriangleIcon,
  },
  {
    type: NodeType.GOOGLE_FORM_TRIGGER,
    label: "Google Form",
    description: "Runs when a form is submitted",
    icon: "/logos/googleform.svg",
  },
  {
    type: NodeType.STRIPE_TRIGGER,
    label: "Stripe Event",
    description: "Runs on Stripe events",
    icon: "/logos/stripe.svg",
  },
];

const aiNodes: NodeTypeOption[] = [
  {
    type: NodeType.OPENAI,
    label: "OpenAI",
    description: "Generate text using GPT-4/3.5",
    icon: "/logos/openai.svg",
  },
  {
    type: NodeType.GEMINI,
    label: "Gemini",
    description: "Generate text using Google Gemini",
    icon: "/logos/gemini.svg",
  },
  {
    type: NodeType.ANTHROPIC,
    label: "Anthropic",
    description: "Generate text using Claude",
    icon: "/logos/anthropic.svg",
  },
  {
    type: NodeType.AI_AGENT,
    label: "AI Agent",
    description: "Orchestrate models, memory & tools",
    icon: "/logos/ai-agent.svg",
  },
  {
    type: NodeType.AI_MEMORY,
    label: "AI Memory",
    description: "Store conversation history",
    icon: DatabaseIcon,
  },
  {
    type: NodeType.AI_TOOL,
    label: "AI Tool",
    description: "Define custom tools",
    icon: HammerIcon, // Using HammerIcon as a placeholder for Tool
  },
];

const logicNodes: NodeTypeOption[] = [
  {
    type: NodeType.CONDITION,
    label: "If / Condition",
    description: "Branch based on conditions",
    icon: GitBranchIcon,
  },
  {
    type: NodeType.SWITCH,
    label: "Switch / Router",
    description: "Route based on multiple values",
    icon: SplitIcon,
  },
  {
    type: NodeType.LOOP,
    label: "Loop / For Each",
    description: "Iterate over list items",
    icon: RepeatIcon,
  },
  {
    type: NodeType.MERGE,
    label: "Merge",
    description: "Combine multiple branches",
    icon: MergeIcon,
  },
  {
    type: NodeType.WAIT,
    label: "Wait",
    description: "Delay execution flow",
    icon: ClockIcon,
  },
  {
    type: NodeType.SUB_WORKFLOW,
    label: "Execute Workflow",
    description: "Trigger another workflow",
    icon: LayersIcon,
  },
];

const integrationNodes: NodeTypeOption[] = [
  {
    type: NodeType.GOOGLE_SHEETS,
    label: "Google Sheets",
    description: "Append/Read rows dynamically",
    icon: "/logos/google-sheets.png",
  },
  {
    type: NodeType.GMAIL,
    label: "Gmail",
    description: "Send, Read & Manage Emails",
    icon: "/logos/google.svg",
  },
  {
    type: NodeType.POSTGRES,
    label: "Postgres",
    description: "Execute SQL queries",
    icon: "/logos/postgres.png",
  },
  {
    type: NodeType.MYSQL,
    label: "MySQL",
    description: "Execute SQL queries",
    icon: "/logos/mysql.png",
  },
  {
    type: NodeType.HTTP_REQUEST,
    label: "HTTP Request",
    description: "Call external APIs or webhooks",
    icon: GlobeIcon,
  },
  {
    type: NodeType.EMAIL,
    label: "Email",
    description: "Send emails via SMTP/API",
    icon: MailIcon,
  },
  {
    type: NodeType.SLACK,
    label: "Slack",
    description: "Send messages to Slack",
    icon: "/logos/slack.svg",
  },
  {
    type: NodeType.DISCORD,
    label: "Discord",
    description: "Send messages to Discord",
    icon: "/logos/discord.svg",
  },
];

const dataNodes: NodeTypeOption[] = [
  {
    type: NodeType.CODE,
    label: "Code",
    description: "Run custom JavaScript",
    icon: CodeIcon,
  },
  {
    type: NodeType.SET_FIELDS,
    label: "Set Fields",
    description: "Add/modify data fields",
    icon: PenLineIcon,
  },
  {
    type: NodeType.JSON_TRANSFORMER,
    label: "JSON Transformer",
    description: "Map or extract JSON data",
    icon: Settings2Icon,
  },
  {
    type: NodeType.PDF_GENERATOR,
    label: "PDF Generator",
    description: "HTML to PDF document",
    icon: FileTextIcon,
  },
];

const categories: NodeCategory[] = [
  {
    id: "trigger",
    label: "Triggers",
    description: "Start your workflow",
    nodes: triggerNodes,
    color: "text-rose-600 bg-rose-100 dark:bg-rose-900/20",
  },
  {
    id: "ai",
    label: "AI Intelligence",
    description: "Generative AI models",
    nodes: aiNodes,
    color: "text-purple-600 bg-purple-100 dark:bg-purple-900/20",
  },
  {
    id: "logic",
    label: "Logic & Flow",
    description: "Control execution path",
    nodes: logicNodes,
    color: "text-blue-600 bg-blue-100 dark:bg-blue-900/20",
  },
  {
    id: "integration",
    label: "Integrations",
    description: "Connect to external apps",
    nodes: integrationNodes,
    color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/20",
  },
  {
    id: "data",
    label: "Data & Utilities",
    description: "Transform and manage data",
    nodes: dataNodes,
    color: "text-amber-600 bg-amber-100 dark:bg-amber-900/20",
  },
];

interface NodeSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
};

export function NodeSelector({
  open,
  onOpenChange,
  children
}: NodeSelectorProps) {
  const { setNodes, getNodes, screenToFlowPosition } = useReactFlow();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;

    const lowerQuery = searchQuery.toLowerCase();

    return categories.map(category => {
      // Check if category matches or if any of its nodes match
      const matchingNodes = category.nodes.filter(node =>
        node.label.toLowerCase().includes(lowerQuery) ||
        node.description.toLowerCase().includes(lowerQuery)
      );

      return {
        ...category,
        nodes: matchingNodes
      };
    }).filter(category => category.nodes.length > 0);
  }, [searchQuery]);

  const handleNodeSelect = useCallback((selection: NodeTypeOption) => {
    // Check if trying to add a manual trigger when one already exists
    if (selection.type === NodeType.MANUAL_TRIGGER) {
      const nodes = getNodes();
      const hasManualTrigger = nodes.some(
        (node) => node.type === NodeType.MANUAL_TRIGGER,
      );

      if (hasManualTrigger) {
        toast.error("Only one manual trigger is allowed per workflow");
        return;
      }
    }

    setNodes((nodes) => {
      const hasInitialTrigger = nodes.some(
        (node) => node.type === NodeType.INITIAL,
      );

      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;

      const flowPosition = screenToFlowPosition({
        x: centerX + (Math.random() - 0.5) * 200,
        y: centerY + (Math.random() - 0.5) * 200,
      });

      const newNode = {
        id: createId(),
        data: {},
        position: flowPosition,
        type: selection.type,
      };

      if (hasInitialTrigger) {
        return [newNode];
      }

      return [...nodes, newNode];
    });

    onOpenChange(false);
    setSearchQuery(""); // clear search on selection
  }, [
    setNodes,
    getNodes,
    onOpenChange,
    screenToFlowPosition,
  ]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="right" className="w-[400px] sm:w-[540px] overflow-y-auto p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b bg-muted/40 sticky top-0 bg-background z-10 backdrop-blur-sm support-backdrop-blur:bg-background/60">
          <SheetTitle>Add Node</SheetTitle>
          <SheetDescription>
            Choose a node to add to your workflow
          </SheetDescription>
          <div className="relative mt-2">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 bg-background/50"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <XIcon className="h-3 w-3" />
              </button>
            )}
          </div>
        </SheetHeader>

        <div className="flex flex-col gap-6 p-6 overflow-y-auto flex-1">
          {filteredCategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <span className="bg-muted p-4 rounded-full mb-3">
                <SearchIcon className="h-6 w-6 opacity-50" />
              </span>
              <p className="font-medium">No nodes found</p>
              <p className="text-sm opacity-80 mt-1">Try searching for something else</p>
            </div>
          ) : (
            filteredCategories.map((category) => (
              <div key={category.id} className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className={cn("px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider", category.color)}>
                    {category.label}
                  </div>
                  <span className="text-xs text-muted-foreground">{category.description}</span>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {category.nodes.map((nodeType) => {
                    const Icon = nodeType.icon;
                    return (
                      <button
                        key={nodeType.type}
                        className="flex items-center gap-4 p-3 rounded-xl border bg-card hover:bg-accent/50 hover:border-primary/50 transition-all text-left shadow-sm hover:shadow-md group"
                        onClick={() => handleNodeSelect(nodeType)}
                      >
                        <div className={cn("p-2 rounded-lg bg-background border shadow-sm group-hover:scale-110 transition-transform duration-200", category.color.replace('text-', 'border-').split(' ')[0])}>
                          {typeof Icon === "string" ? (
                            <img
                              src={Icon}
                              alt={nodeType.label}
                              className="size-5 object-contain"
                            />
                          ) : (
                            <Icon className={cn("size-5", category.color.split(' ')[0])} />
                          )}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-sm text-foreground/90">
                            {nodeType.label}
                          </span>
                          <span className="text-xs text-muted-foreground line-clamp-1">
                            {nodeType.description}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {category.id !== filteredCategories[filteredCategories.length - 1].id && <Separator className="mt-4 opacity-50" />}
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
