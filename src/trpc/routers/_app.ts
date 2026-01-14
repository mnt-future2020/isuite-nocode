import { createTRPCRouter } from '../init';
import { workflowsRouter } from '@/features/workflows/server/routers';
import { credentialsRouter } from '@/features/credentials/server/routers';
import { executionsRouter } from '@/features/executions/server/routers';
import { adminRouter } from '@/features/admin/server/routers';
import { subscriptionRouter } from '@/features/subscriptions/server/routers';

export const appRouter = createTRPCRouter({
  workflows: workflowsRouter,
  credentials: credentialsRouter,
  executions: executionsRouter,
  admin: adminRouter,
  subscriptions: subscriptionRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
