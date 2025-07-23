import { createTRPCRouter } from '../init';
import { agentsRouter } from '@/modules/agents/server/procedures';



// The main application router for tRPC.
// This router defines all available API endpoints for the app.

export const appRouter = createTRPCRouter({
  // The agents router is a key that maps to the agentsRouter object, which contains all the procedures for the agents module.
  agents: agentsRouter,
});

export type AppRouter = typeof appRouter;

// The AppRouter type is a union of all the routers in the app