"use client";

import { useState } from "react";
import {
    useAdminPackages,
    useCreatePackage,
    useUpdatePackage,
    useDeletePackage
} from "../hooks/use-admin";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { PlusIcon, PencilIcon, TrashIcon } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const PackageManagement = () => {
    const { data: packages, isLoading } = useAdminPackages();
    const createMutation = useCreatePackage();
    const updateMutation = useUpdatePackage();
    const deleteMutation = useDeletePackage();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingPackage, setEditingPackage] = useState<any>(null);

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        price: 0,
        polarProductId: "",
        slug: "",
        features: "",
        isActive: true,
    });

    const handleOpenDialog = (pkg: any = null) => {
        if (pkg) {
            setEditingPackage(pkg);
            setFormData({
                name: pkg.name,
                description: pkg.description || "",
                price: pkg.price,
                polarProductId: pkg.polarProductId,
                slug: pkg.slug,
                features: Array.isArray(pkg.features) ? pkg.features.join("\n") : "",
                isActive: pkg.isActive,
            });
        } else {
            setEditingPackage(null);
            setFormData({
                name: "",
                description: "",
                price: 0,
                polarProductId: "",
                slug: "",
                features: "",
                isActive: true,
            });
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            ...formData,
            features: formData.features.split("\n").filter(f => f.trim() !== ""),
        };

        if (editingPackage) {
            await updateMutation.mutateAsync({ id: editingPackage.id, ...payload });
        } else {
            await createMutation.mutateAsync(payload);
        }
        setIsDialogOpen(false);
    };

    if (isLoading) return <Spinner className="size-8 mx-auto" />;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Subscription Packages</h2>
                <Button onClick={() => handleOpenDialog()}>
                    <PlusIcon className="size-4 mr-2" />
                    New Package
                </Button>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {packages?.map((pkg: any) => (
                        <TableRow key={pkg.id}>
                            <TableCell className="font-medium">{pkg.name}</TableCell>
                            <TableCell>{pkg.slug}</TableCell>
                            <TableCell>${pkg.price}</TableCell>
                            <TableCell>
                                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${pkg.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                                    }`}>
                                    {pkg.isActive ? "Active" : "Inactive"}
                                </span>
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    <Button variant="outline" size="icon" onClick={() => handleOpenDialog(pkg)}>
                                        <PencilIcon className="size-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="text-red-600 hover:text-red-700"
                                        onClick={() => {
                                            if (confirm("Are you sure you want to delete this package?")) {
                                                deleteMutation.mutate({ id: pkg.id });
                                            }
                                        }}
                                    >
                                        <TrashIcon className="size-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingPackage ? "Edit Package" : "Create New Package"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Plan Name</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Pro Plan"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="slug">Slug</Label>
                            <Input
                                id="slug"
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                placeholder="e.g. pro"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="polarProductId">Polar Product ID</Label>
                            <Input
                                id="polarProductId"
                                value={formData.polarProductId}
                                onChange={(e) => setFormData({ ...formData, polarProductId: e.target.value })}
                                placeholder="Get from Polar.sh dashboard"
                                required
                            />
                        </div>
                        <div className="flex gap-4">
                            <div className="grid gap-2 flex-1">
                                <Label htmlFor="price">Price ($)</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                                    required
                                />
                            </div>
                            <div className="flex items-center gap-2 pt-6">
                                <Switch
                                    id="isActive"
                                    checked={formData.isActive}
                                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                                />
                                <Label htmlFor="isActive">Active</Label>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Short description of the plan"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="features">Features (One per line)</Label>
                            <Textarea
                                id="features"
                                value={formData.features}
                                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                                placeholder="Feature 1&#10;Feature 2"
                                className="h-32"
                            />
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                                {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save Package"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};
