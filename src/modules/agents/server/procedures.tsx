import { db } from "@/db";
import {
  createTRPCRouter,
  protectedProcedure,
} from "@/trpc/init";
import { agents } from "@/db/schema";
import { z } from "zod";
import { agentsInsertSchema } from "../schemas";
import { eq } from "drizzle-orm";

// TRPC router for agents with a getAllAgents query to fetch all agents from the database
export const agentsRouter = createTRPCRouter({
  // Get a single agent by ID from the database
  getOneAgent: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const [existingAgent] = await db
        .select()
      .from(agents)
        .where(eq(agents.id, input.id));

      return existingAgent;
    }),

  
  getAllAgents: protectedProcedure.query(async () => {
    const data = await db.select().from(agents);

    return data;
  }),
  // Create a new agent with the provided input data
  // Requires user authentication via protectedProcedure
  createAgent: protectedProcedure
    .input(agentsInsertSchema)
    .mutation(async ({ input, ctx }) => {
      // Insert the new agent into the database with the user's ID
      const [createdAgent] = await db
        .insert(agents)
        .values({
          ...input,
          userId: ctx.session.user.id,
        })
        .returning();

      return createdAgent;
    }),
});
