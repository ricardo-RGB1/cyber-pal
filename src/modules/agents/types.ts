import { inferRouterOutputs } from "@trpc/server"; 

import type { AppRouter } from "@/trpc/routers/_app";

// Get a single agent by ID from the database 
export type AgentGetOne = inferRouterOutputs<AppRouter>["agents"]["getOneAgent"]; 


// Using this method returns the API instead of trying to get the schema from the database 