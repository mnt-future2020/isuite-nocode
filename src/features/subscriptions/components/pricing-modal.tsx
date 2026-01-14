"use client";

import { useState } from "react";
import { useSubscriptionPackages, useCreateDynamicCheckout } from "../hooks/use-subscription";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StarIcon, CheckIcon } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

export const PricingModal = ({ trigger }: { trigger?: React.ReactNode }) => {
    const { data: packages, isLoading } = useSubscriptionPackages();
    const createCheckout = useCreateDynamicCheckout();

    return (
        <Dialog>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" className="w-full justify-start gap-x-4 h-10 px-4">
                        <StarIcon className="size-4" />
                        <span>Upgrade Plan</span>
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl text-center">Choose Your Plan</DialogTitle>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Spinner className="size-8" />
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 py-6">
                        {packages?.map((pkg: any) => (
                            <div
                                key={pkg.id}
                                className="flex flex-col p-6 rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="mb-4">
                                    <h3 className="text-lg font-bold">{pkg.name}</h3>
                                    <p className="text-sm text-muted-foreground line-clamp-2">{pkg.description}</p>
                                </div>
                                <div className="mb-6">
                                    <span className="text-3xl font-bold">${pkg.price}</span>
                                    <span className="text-muted-foreground"> / month</span>
                                </div>
                                <div className="flex-1 space-y-2 mb-6">
                                    {Array.isArray(pkg.features) && pkg.features.map((feature: string, i: number) => (
                                        <div key={i} className="flex items-center gap-2 text-sm">
                                            <CheckIcon className="size-4 text-green-500" />
                                            <span>{feature}</span>
                                        </div>
                                    ))}
                                </div>
                                <Button
                                    className="w-full"
                                    disabled={createCheckout.isPending}
                                    onClick={() => createCheckout.mutate({ packageId: pkg.id })}
                                >
                                    {createCheckout.isPending && createCheckout.variables?.packageId === pkg.id ? "Connecting..." : "Choose Plan"}
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};
