import { useMutation, useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";

export const useSubscription = () => {
  return useQuery({
    queryKey: ["subscription"],
    queryFn: async () => {
      const { data } = await authClient.customer.state();
      return data;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    gcTime: 1000 * 60 * 10,   // Keep in memory for 10 minutes
  });
};


export const useHasActiveSubscription = () => {
  const { data: customerState, isLoading, ...rest } =
    useSubscription();
  const { data: session } = authClient.useSession();

  // Mock active subscription for testing user
  const isTestingUser = session?.user?.email === "rjseelan53@gmail.com";

  const hasActiveSubscription =
    isTestingUser || (
      customerState?.activeSubscriptions &&
      customerState.activeSubscriptions.length > 0
    );

  return {
    hasActiveSubscription,
    subscription: isTestingUser ? { plan: "Yearly Pro (Mock)" } : customerState?.activeSubscriptions?.[0],
    isLoading,
    ...rest,
  };
};

export const useSubscriptionPackages = () => {
  const trpc = useTRPC();
  return useQuery(trpc.subscriptions.getPackages.queryOptions());
};

export const useCreateDynamicCheckout = () => {
  const trpc = useTRPC();
  return useMutation(
    trpc.subscriptions.createCheckoutSession.mutationOptions({
      onSuccess: (data) => {
        if (data.url) {
          window.location.href = data.url;
        }
      },
      onError: (error) => {
        toast.error(`Failed to start checkout: ${error.message}`);
      },
    })
  );
};

