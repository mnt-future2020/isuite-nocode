import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useAdminStats = () => {
    const trpc = useTRPC();
    return useQuery(trpc.admin.getStats.queryOptions());
};

export const useAdminUsers = () => {
    const trpc = useTRPC();
    return useQuery(trpc.admin.getUsers.queryOptions());
};

export const useAdminPackages = () => {
    const trpc = useTRPC();
    return useQuery(trpc.admin.getPackages.queryOptions());
};

export const useCreatePackage = () => {
    const queryClient = useQueryClient();
    const trpc = useTRPC();

    return useMutation(
        trpc.admin.createPackage.mutationOptions({
            onSuccess: () => {
                toast.success("Package created successfully");
                queryClient.invalidateQueries(trpc.admin.getPackages.queryFilter());
            },
            onError: (error) => {
                toast.error(`Failed to create package: ${error.message}`);
            },
        })
    );
};

export const useUpdatePackage = () => {
    const queryClient = useQueryClient();
    const trpc = useTRPC();

    return useMutation(
        trpc.admin.updatePackage.mutationOptions({
            onSuccess: () => {
                toast.success("Package updated successfully");
                queryClient.invalidateQueries(trpc.admin.getPackages.queryFilter());
            },
            onError: (error) => {
                toast.error(`Failed to update package: ${error.message}`);
            },
        })
    );
};

export const useDeletePackage = () => {
    const queryClient = useQueryClient();
    const trpc = useTRPC();

    return useMutation(
        trpc.admin.deletePackage.mutationOptions({
            onSuccess: () => {
                toast.success("Package deleted successfully");
                queryClient.invalidateQueries(trpc.admin.getPackages.queryFilter());
            },
            onError: (error) => {
                toast.error(`Failed to delete package: ${error.message}`);
            },
        })
    );
};
