import { db } from "@/db";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { agents } from "@/db/schema";
import { z } from "zod";
import { agentsInsertSchema } from "../schemas";
import { and, count, desc, eq, getTableColumns, ilike, sql } from "drizzle-orm";
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, MIN_PAGE_SIZE } from "@/constants";

export const agentsRouter = createTRPCRouter({

  getOneAgent: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const [existingAgent] = await db
        .select({
          // TODO: Get the actual meeting count from the database
          meetingCount: sql<number>`5`,
          ...getTableColumns(agents),
        })
        .from(agents)
        .where(eq(agents.id, input.id));

      return existingAgent;
    }),

  getAllAgents: protectedProcedure
    .input(
      z
        .object({
          page: z.number().default(DEFAULT_PAGE),
          pageSize: z.number().min(MIN_PAGE_SIZE).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
          search: z.string().nullish(),
        })
    )    .query(async ( {ctx, input} ) => {
      const {page, pageSize, search} = input;
      const data = await db
        .select({
          // TODO: Get the actual meeting count from the database
          meetingCount: sql<number>`1`,
          ...getTableColumns(agents),
        })
        .from(agents)
        .where( // load agents the user created 
          and(
            eq(agents.userId, ctx.session.user.id),
            search ? ilike(agents.name, `%${search}%`) : undefined,
          )
        )
        .orderBy(desc(agents.createdAt), desc(agents.id))
        .limit(pageSize)
        .offset((page - 1) * pageSize); // offset is the number of records to skip

        // get the total number of agents the user has created 
        const [totalCount] = await db 
          .select({count: count()}) 
          .from(agents)
          .where(
            and(
              eq(agents.userId, ctx.session.user.id),
              search ? ilike(agents.name, `%${search}%`) : undefined, 
            )
          );

          const totalPages = Math.ceil(totalCount.count / pageSize);  // totalPages is the total number of pages

          return {
            items: data,
            total: totalCount.count,
            totalPages
          };
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
