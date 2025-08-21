import { inferRouterOutputs } from "@trpc/server"; 

import type { AppRouter } from "@/trpc/routers/_app";


/**
 * Type definition for the return value of the getOneAgent tRPC procedure.
 * 
 * This type is inferred from the AppRouter's agents.getOneAgent procedure output,
 * which includes all columns from the agents table plus additional computed fields
 * like meetingCount. It represents a single agent entity with its complete data
 * as returned by the API.
 * 
 * @example
 * ```typescript
 * const agent: AgentGetOne = {
 *   id: "123",
 *   name: "My Agent", 
 *   userId: "456",
 *   meetingCount: 5,
 *   // ... other agent properties
 * };
 * ```
 */
export type AgentGetOne = inferRouterOutputs<AppRouter>["agents"]["getOneAgent"]; 


// type for the return value of the getAllAgents tRPC procedure
export type AgentGetAll = inferRouterOutputs<AppRouter>["agents"]["getAllAgents"]["items"][number]; 






// Using this method returns the API instead of trying to get the schema from the database 