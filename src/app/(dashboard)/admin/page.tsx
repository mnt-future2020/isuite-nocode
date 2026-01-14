"use client";

import { useAdminStats, useAdminUsers } from "@/features/admin/hooks/use-admin";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UsersIcon, WorkflowIcon, PlayIcon, CircleDollarSignIcon } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

import { authClient } from "@/lib/auth-client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PackageManagement } from "@/features/admin/components/package-management";

export default function AdminDashboardPage() {
    const { data: session, isPending: sessionPending } = authClient.useSession();
    const { data: stats, isLoading: statsLoading } = useAdminStats();
    const { data: users, isLoading: usersLoading } = useAdminUsers();

    if (sessionPending || statsLoading || usersLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Spinner className="size-8" />
            </div>
        );
    }

    if ((session?.user as any)?.role !== "ADMIN") {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
                <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
                <p>You do not have permission to view this page.</p>
            </div>
        );
    }

    const statCards = [
        { title: "Total Users", value: stats?.users ?? 0, icon: UsersIcon },
        { title: "Total Workflows", value: stats?.workflows ?? 0, icon: WorkflowIcon },
        { title: "Total Executions", value: stats?.executions ?? 0, icon: PlayIcon },
        { title: "Revenue", value: `$${stats?.revenue ?? 0}`, icon: CircleDollarSignIcon },
    ];

    return (
        <div className="flex flex-col gap-8 p-8 max-w-7xl mx-auto w-full">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Super Admin Dashboard</h1>
                <p className="text-muted-foreground">Manage your application, users, and subscription packages.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statCards.map((card) => (
                    <Card key={card.title}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                            <card.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{card.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Tabs defaultValue="users" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="users">User Management</TabsTrigger>
                    <TabsTrigger value="packages">Package Management</TabsTrigger>
                </TabsList>

                <TabsContent value="users" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Users</CardTitle>
                            <p className="text-sm text-muted-foreground">List of all users registered in the system.</p>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Workflows</TableHead>
                                        <TableHead>Joined</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users?.map((user: any) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">{user.name}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>
                                                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${user.role === "ADMIN" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                                                    }`}>
                                                    {user.role}
                                                </span>
                                            </TableCell>
                                            <TableCell>{user._count.workflows}</TableCell>
                                            <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="packages" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Packages</CardTitle>
                            <p className="text-sm text-muted-foreground">Configure dynamic membership plans and connect them to Polar.sh products.</p>
                        </CardHeader>
                        <CardContent>
                            <PackageManagement />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

