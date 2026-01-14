"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookTemplate, Mail, Zap, Bot, Clock } from "lucide-react";
import { useCreateWorkflow } from "../hooks/use-workflows";
import { useRouter } from "next/navigation";
import { TEMPLATES } from "@/config/templates";

export const TemplatesDialog = () => {
    const router = useRouter();
    const createWorkflow = useCreateWorkflow();

    const handleUseTemplate = (template: typeof TEMPLATES[0]) => {
        // We can't directly pass nodes to the create mutation if the schema doesn't support it 
        // unless we modify the 'create' procedure. 
        // However, our 'update' takes nodes.
        // So we first create, then update.

        createWorkflow.mutate(undefined, {
            onSuccess: (newWorkflow) => {
                // We'll update it immediately or redirect to editor where it can load the template.
                // For simplicity, let's just redirect and we could pass template id in query param.
                // But better is to just update it here.

                // Wait, 'create' in routers.ts doesn't take input.
                // Let's modify the create procedure to allow initial data.
                router.push(`/workflows/${newWorkflow.id}?template=${template.id}`);
            }
        });
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <BookTemplate className="size-4" />
                    Browse Templates
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Workflow Templates</DialogTitle>
                    <DialogDescription>
                        Jumpstart your automation with these pre-configured templates.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {TEMPLATES.map((template) => (
                        <Card key={template.id} className="cursor-pointer hover:border-primary transition-colors overflow-hidden group">
                            <CardHeader className="flex flex-row items-center gap-4 pb-2">
                                <div className={`p-2 rounded-lg ${template.color}`}>
                                    <template.icon className="size-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-base">{template.name}</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <CardDescription className="mb-4 line-clamp-2">
                                    {template.description}
                                </CardDescription>
                                <Button
                                    className="w-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleUseTemplate(template)}
                                    disabled={createWorkflow.isPending}
                                >
                                    Use this template
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
};
