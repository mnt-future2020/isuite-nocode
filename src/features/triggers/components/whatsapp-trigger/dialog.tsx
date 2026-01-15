"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { CredentialType } from "@/generated/prisma";
import { useCredentialsByType } from "@/features/credentials/hooks/use-credentials";
import { CopyIcon, Loader2, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useReactFlow } from "@xyflow/react";
import Link from "next/link";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    nodeId: string;
    defaultValues?: any;
}

export const WhatsAppTriggerDialog = ({
    open,
    onOpenChange,
    nodeId,
    defaultValues,
}: Props) => {
    const { data: credentials, isLoading } = useCredentialsByType(
        CredentialType.WHATSAPP,
    );
    const { setNodes } = useReactFlow();

    const [credentialId, setCredentialId] = useState<string>(
        defaultValues?.credentialId || ""
    );

    // Sync state with defaultValues when they change (e.g. initial load)
    useEffect(() => {
        if (defaultValues?.credentialId) {
            setCredentialId(defaultValues.credentialId);
        }
    }, [defaultValues]);

    // Construct Webhook URL
    const [baseUrl, setBaseUrl] = useState("");
    useEffect(() => {
        if (typeof window !== "undefined") {
            setBaseUrl(window.location.origin);
        }
    }, []);

    const webhookUrl = credentialId && baseUrl
        ? `${baseUrl}/api/webhooks/whatsapp?credentialId=${credentialId}`
        : "Select a credential to generate URL";

    const handleSave = () => {
        setNodes((nodes) =>
            nodes.map((node) => {
                if (node.id === nodeId) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            credentialId,
                        },
                    };
                }
                return node;
            })
        );
        onOpenChange(false);
        toast.success("Configuration saved");
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success("Copied to clipboard");
        } catch {
            toast.error("Failed to copy");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>WhatsApp Trigger Configuration</DialogTitle>
                    <DialogDescription>
                        Configure your Meta App to send webhooks to this URL.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-2">
                    <div className="space-y-2">
                        <Label>WhatsApp Credential</Label>
                        <div className="flex gap-2">
                            <Select value={credentialId} onValueChange={setCredentialId}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select a credential" />
                                </SelectTrigger>
                                <SelectContent>
                                    {isLoading ? (
                                        <div className="p-2 flex items-center justify-center text-muted-foreground text-sm">
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Loading credentials...
                                        </div>
                                    ) : credentials?.length === 0 ? (
                                        <div className="p-2 text-center text-muted-foreground text-sm">
                                            No WhatsApp credentials found
                                        </div>
                                    ) : (
                                        credentials?.map((cred) => (
                                            <SelectItem key={cred.id} value={cred.id}>
                                                {cred.name}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                            <Button variant="outline" asChild>
                                <Link href="/credentials/new?type=WHATSAPP" target="_blank">
                                    New
                                </Link>
                            </Button>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                            Select the credential that contains the Verify Token you will use in Meta.
                        </p>
                    </div>

                    {credentialId && (
                        <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
                            <div className="space-y-2">
                                <Label>Webhook URL</Label>
                                <div className="flex gap-2">
                                    <Input value={webhookUrl} readOnly className="font-mono text-xs" />
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        onClick={() => copyToClipboard(webhookUrl)}
                                    >
                                        <CopyIcon className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Setup Instructions</Label>
                                <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                                    <li>Go to your <Link href="https://developers.facebook.com/apps/" target="_blank" className="underline text-primary">Meta App Dashboard</Link>.</li>
                                    <li>Go to <strong>WhatsApp</strong> &gt; <strong>Configuration</strong>.</li>
                                    <li>Click <strong>Edit</strong> under Webhook.</li>
                                    <li>Paste the <strong>Webhook URL</strong> from above.</li>
                                    <li>Enter the <strong>Verify Token</strong> you saved in the selected credential.</li>
                                    <li>Click <strong>Verify and Save</strong>.</li>
                                    <li>Under Webhook fields, click <strong>Manage</strong> and subscribe to <code>messages</code>.</li>
                                </ol>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={!credentialId}>
                            Save
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
