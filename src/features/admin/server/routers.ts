import prisma from "@/lib/db";
import { adminProcedure, createTRPCRouter } from "@/trpc/init";
import { polarClient } from "@/lib/polar";

import { z } from "zod";

export const adminRouter = createTRPCRouter({
    getStats: adminProcedure.query(async () => {
        const [userCount, workflowCount, executionCount] = await Promise.all([
            prisma.user.count(),
            prisma.workflow.count(),
            prisma.execution.count(),
        ]);

        return {
            users: userCount,
            workflows: workflowCount,
            executions: executionCount,
            revenue: 0,
        };
    }),

    getUsers: adminProcedure.query(async () => {
        return prisma.user.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                _count: {
                    select: { workflows: true }
                }
            }
        });
    }),

    getPackages: adminProcedure.query(async () => {
        return prisma.package.findMany({
            orderBy: { createdAt: "desc" },
        });
    }),

    createPackage: adminProcedure
        .input(z.object({
            name: z.string().min(1),
            description: z.string().optional(),
            price: z.number().min(0),
            polarProductId: z.string().min(1),
            slug: z.string().min(1),
            features: z.array(z.string()).default([]),
            isActive: z.boolean().default(true),
        }))
        .mutation(async ({ input }) => {
            return prisma.package.create({
                data: {
                    ...input,
                    features: input.features as any,
                },
            });
        }),

    updatePackage: adminProcedure
        .input(z.object({
            id: z.string(),
            name: z.string().min(1).optional(),
            description: z.string().optional(),
            price: z.number().min(0).optional(),
            polarProductId: z.string().min(1).optional(),
            slug: z.string().min(1).optional(),
            features: z.array(z.string()).optional(),
            isActive: z.boolean().optional(),
        }))
        .mutation(async ({ input }) => {
            const { id, ...data } = input;
            return prisma.package.update({
                where: { id },
                data: {
                    ...data,
                    features: data.features ? (data.features as any) : undefined,
                },
            });
        }),

    deletePackage: adminProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input }) => {
            return prisma.package.delete({
                where: { id: input.id },
            });
        }),
});

