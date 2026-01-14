"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
    cronExpression: z.string().min(1, "Cron expression is required"),
    timezone: z.string().min(1, "Timezone is required"),
});

export type ScheduleFormValues = z.infer<typeof formSchema>;

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (values: z.infer<typeof formSchema>) => void;
    defaultValues?: Partial<ScheduleFormValues>;
}

const cronPresets = [
    { label: "Every minute", value: "* * * * *" },
    { label: "Every 5 minutes", value: "*/5 * * * *" },
    { label: "Every 15 minutes", value: "*/15 * * * *" },
    { label: "Every hour", value: "0 * * * *" },
    { label: "Every day at 9 AM", value: "0 9 * * *" },
    { label: "Every day at midnight", value: "0 0 * * *" },
    { label: "Every Monday at 9 AM", value: "0 9 * * 1" },
    { label: "Every 1st of month", value: "0 0 1 * *" },
];

const timezones = [
    { label: "UTC", value: "UTC" },
    { label: "Asia/Kolkata (IST)", value: "Asia/Kolkata" },
    { label: "America/New_York (EST)", value: "America/New_York" },
    { label: "America/Los_Angeles (PST)", value: "America/Los_Angeles" },
    { label: "Europe/London (GMT)", value: "Europe/London" },
    { label: "Asia/Tokyo (JST)", value: "Asia/Tokyo" },
];

export const ScheduleDialog = ({
    open,
    onOpenChange,
    onSubmit,
    defaultValues = {},
}: Props) => {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            cronExpression: defaultValues.cronExpression || "0 9 * * *",
            timezone: defaultValues.timezone || "Asia/Kolkata",
        },
    });

    useEffect(() => {
        if (open) {
            form.reset({
                cronExpression: defaultValues.cronExpression || "0 9 * * *",
                timezone: defaultValues.timezone || "Asia/Kolkata",
            });
        }
    }, [open, defaultValues, form]);

    const handleSubmit = (values: z.infer<typeof formSchema>) => {
        onSubmit(values);
        onOpenChange(false);
    };

    const handlePresetSelect = (preset: string) => {
        form.setValue("cronExpression", preset);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Schedule Configuration</DialogTitle>
                    <DialogDescription>
                        Configure when this workflow should automatically run.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(handleSubmit)}
                        className="space-y-4 mt-4"
                    >
                        <div className="mb-4">
                            <p className="text-sm font-medium mb-2">Quick Presets</p>
                            <div className="flex flex-wrap gap-2">
                                {cronPresets.map((preset) => (
                                    <Button
                                        key={preset.value}
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="text-xs"
                                        onClick={() => handlePresetSelect(preset.value)}
                                    >
                                        {preset.label}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <FormField
                            control={form.control}
                            name="cronExpression"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Cron Expression</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="0 9 * * *"
                                            className="font-mono"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Format: minute hour day month weekday (e.g., "0 9 * * 1" = Every Monday at 9 AM)
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="timezone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Timezone</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select timezone" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {timezones.map((tz) => (
                                                <SelectItem key={tz.value} value={tz.value}>
                                                    {tz.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="mt-4">
                            <Button type="submit">Save</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};
