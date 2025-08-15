import { createTRPCRouter } from '../init';
import { agentsRouter } from '@/modules/agents/server/procedures';
import { meetingsRouter } from '@/modules/meetings/server/procedures';


/**
 * Main application router that combines all feature-specific routers.
 * 
 * This is the central tRPC router that serves as the entry point for all API endpoints
 * in the application. It aggregates individual feature routers (like agentsRouter) 
 * into a single unified router that can be used by both the server and client.
 * 
 * The appRouter is used to:
 * - Define the complete API surface of the application
 * - Generate TypeScript types for end-to-end type safety
 * - Enable tRPC's client-side utilities and React Query integration
 * - Provide a single source of truth for all available procedures
 * 
 * @example
 * ```typescript
 * // Client usage
 * const agent = await trpc.agents.getOneAgent.query({ id: "123" });
 * 
 * // Server usage  
 * const result = await appRouter.createCaller(ctx).agents.getOneAgent({ id: "123" });
 * ```
 */
export const appRouter = createTRPCRouter({
  agents: agentsRouter, 
  meetings: meetingsRouter,
});

export type AppRouter = typeof appRouter;

// The AppRouter type is a union of all the routers in the app