"use client";

import { BaseExecutionNode } from "../base-execution-node";
import type { NodeProps } from "@xyflow/react";
import { MailIcon } from "lucide-react";
import { useState } from "react";
import { EmailDialog, type EmailFormValues } from "./dialog";
import { useReactFlow } from "@xyflow/react";

export const EmailNode = (props: NodeProps) => {
    const { id, data } = props;
    const [dialogOpen, setDialogOpen] = useState(false);
    const { setNodes } = useReactFlow();

    const handleSubmit = (values: EmailFormValues) => {
        setNodes((nodes) =>
            nodes.map((node) => {
                if (node.id === id) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            ...values,
                        },
                    };
                }
                return node;
            })
        );
    };

    const toEmail = data?.to as string;
    const description = toEmail
        ? `To: ${toEmail.substring(0, 20)}${toEmail.length > 20 ? '...' : ''}`
        : "Configure";

    return (
        <>
            <EmailDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSubmit={handleSubmit}
                defaultValues={{
                    variableName: (data?.variableName as string) || "email",
                    to: (data?.to as string) || "",
                    subject: (data?.subject as string) || "",
                    body: (data?.body as string) || "",
                    from: (data?.from as string) || "",
                }}
                nodeId={props.id}
            />
            <BaseExecutionNode
                {...props}
                category="INTEGRATION"
                icon={MailIcon}
                name="Email"
                description={description}
                onDoubleClick={() => setDialogOpen(true)}
                onSettings={() => setDialogOpen(true)}
            />
        </>
    );
};
