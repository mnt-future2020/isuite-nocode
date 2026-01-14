import prisma from "@/lib/db";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { z } from "zod";
import { polarClient } from "@/lib/polar";

export const subscriptionRouter = createTRPCRouter({
    getPackages: protectedProcedure.query(async () => {
        return prisma.package.findMany({
            where: { isActive: true },
            orderBy: { price: "asc" },
        });
    }),

    createCheckoutSession: protectedProcedure
        .input(z.object({ packageId: z.string() }))
        .mutation(async ({ input, ctx }) => {
            const pkg = await prisma.package.findUnique({
                where: { id: input.packageId },
            });

            if (!pkg) {
                throw new Error("Package not found");
            }

            // Detect environment based on token
            const isSandbox = process.env.POLAR_ACCESS_TOKEN?.includes("sandbox");
            const baseUrl = isSandbox
                ? "https://sandbox-api.polar.sh/v1"
                : "https://api.polar.sh/v1";

            const response = await fetch(`${baseUrl}/checkouts/`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.POLAR_ACCESS_TOKEN}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    product_id: pkg.polarProductId,
                    return_url:
                        process.env.POLAR_SUCCESS_URL ||
                        `${process.env.NEXT_PUBLIC_APP_URL}/workflows?checkout_id={CHECKOUT_ID}`,
                    customer_email: ctx.auth.user.email,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                console.error("Polar API Error:", error);
                throw new Error(error.detail || error.message || JSON.stringify(error));
            }

            const data = await response.json();
            return { url: data.url };
        }),
});
