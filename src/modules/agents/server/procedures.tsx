import { db } from "@/db";
import { createTRPCRouter, baseProcedure } from "@/trpc/init"; 
import { agents } from "@/db/schema";
import { TRPCError } from "@trpc/server";



// TRPC router for agents with a getAllAgents query to fetch all agents from the database - the agentsRouter is an object that contains all the procedures for the agents module, and the getAllAgents is a key that maps to a function that fetches all agents from the database. 
export const agentsRouter = createTRPCRouter({

    getAllAgents: baseProcedure.query(async () => {
        const data = await db.select().from(agents);


        return data;
    }),
});







