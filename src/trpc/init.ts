import { auth } from '@/lib/auth';
import { polarClient } from '@/lib/polar';
import { initTRPC, TRPCError } from '@trpc/server';
import { headers } from 'next/headers';
import { cache } from 'react';
import superjson from "superjson"
export const createTRPCContext = cache(async () => {
  /**
   * @see: https://trpc.io/docs/server/context
   */
  return { userId: 'user_123' };
});
// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.
const t = initTRPC.create({
  /**
   * @see https://trpc.io/docs/server/data-transformers
   */
  transformer: superjson,
});
// Base router and procedure helpers
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;
export const protectedProcedure = baseProcedure.use(async ({ ctx, next }) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Unathorized",
    });
  }

  return next({ ctx: { ...ctx, auth: session } });
});
export const premiumProcedure = protectedProcedure.use(
  async ({ ctx, next }) => {
    // Allow specific user for testing
    if (ctx.auth.user.email === "rjseelan53@gmail.com") {
      return next({ ctx });
    }

    // Allow Admins to bypass subscription check
    if (ctx.auth.user.role === "ADMIN") {
      return next({ ctx });
    }

    try {
      const customer = await polarClient.customers.getStateExternal({
        externalId: ctx.auth.user.id,
      });

      if (
        !customer.activeSubscriptions ||
        customer.activeSubscriptions.length === 0
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Active subscription required. Please upgrade your plan.",
        });
      }

      return next({ ctx: { ...ctx, customer } });
    } catch (error: any) {
      // If customer is not found or other API issues, they don't have an active subscription
      if (error.name === "ResourceNotFound" || error.status === 404) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Active subscription required. Please upgrade your plan.",
        });
      }
      // Re-throw other unexpected errors
      throw error;
    }
  },
);

export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.auth.user.role !== "ADMIN") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }

  return next({ ctx });
});

