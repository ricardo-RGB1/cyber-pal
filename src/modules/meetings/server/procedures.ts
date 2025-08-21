import { db } from "@/db";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { agents, meetings } from "@/db/schema";
import { z } from "zod";
import { and, count, desc, eq, getTableColumns, ilike, min, sql } from "drizzle-orm";
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MIN_PAGE_SIZE,
} from "@/constants";
import { TRPCError } from "@trpc/server";
import { meetingsInsertSchema, meetingsUpdateSchema } from "../schemas";






export const meetingsRouter = createTRPCRouter({
  update: protectedProcedure
    .input(meetingsUpdateSchema)
    .mutation(async ({ input, ctx }) => {
      // Update the meeting in the database with the user's ID
      const [updatedMeeting] = await db
        .update(meetings)
        .set(input)
        .where(
          and(
            eq(meetings.id, input.id), // check if the meeting exists
            eq(meetings.userId, ctx.session.user.id)
          )
        )
        .returning();

      if (!updatedMeeting) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Meeting not found or you don't have permission to update it",
        });
      }

      return updatedMeeting;
    }),

  createMeeting: protectedProcedure
  .input(meetingsInsertSchema) 
  .mutation(async ({ input, ctx }) => {
    // Insert the new meeting into the database with the user's ID
    const [createdMeeting] = await db
      .insert(meetings)
      .values({
        ...input,
        userId: ctx.session.user.id, 
      })
      .returning();

      // TODO: Create Stream Call, Upsert Stream Users

    return createdMeeting;
  }),
  getOneMeeting: protectedProcedure
    .input(z.object({ id: z.string() })) // input is the id of the meeting
    .query(async ({ input, ctx }) => {
      const [existingMeeting] = await db
        .select({
          ...getTableColumns(meetings),
        })
        .from(meetings)
        .where(
          and(
            eq(meetings.id, input.id),
            eq(meetings.userId, ctx.session.user.id) // check if the meeting belongs to the user
          )
        );

      if (!existingMeeting) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Meeting not found",
        });
      }

      return existingMeeting;
    }),




  /**
   * Retrieves a paginated list of meetings for the authenticated user.
   *
   * @input
   *   - page: The page number to retrieve (default: DEFAULT_PAGE)
   *   - pageSize: The number of meetings per page (default: DEFAULT_PAGE_SIZE, min: MIN_PAGE_SIZE, max: MAX_PAGE_SIZE)
   *   - search: Optional search string to filter meetings by name (case-insensitive, partial match)
   *
   * @returns
   *   - items: Array of meeting objects (all columns from the meetings table plus a placeholder meetingCount)
   *   - total: Total number of meetings matching the query for the user
   *   - totalPages: Total number of pages available
   *
   * @remarks
   *   - Only meetings belonging to the authenticated user are returned.
   *   - The meetingCount field is currently a placeholder and should be replaced with the actual meeting count.
   */
  getAllMeetings: protectedProcedure
    .input(
      z.object({
        page: z.number().default(DEFAULT_PAGE),
        pageSize: z
          .number()
          .min(MIN_PAGE_SIZE)
          .max(MAX_PAGE_SIZE)
          .default(DEFAULT_PAGE_SIZE),
        search: z.string().nullish(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize, search } = input;
      // get the meetings the user created
      const data = await db
        .select({
          ...getTableColumns(meetings), // get all the columns from the meetings table from the db
          agent: agents, // get the agent from the agents table from the db
          duration: sql<number>`EXTRACT(EPOCH FROM(ended_at - started_at))`.as("duration"), // get the duration of the meeting in minutes
        })
        .from(meetings) // this is the left table in the join 
        .innerJoin(agents, eq(meetings.agentId, agents.id)) // join the meetings table with the agents table on the agentId column
        .where(
          // load meetings the user created
          and(
            eq(meetings.userId, ctx.session.user.id),
            search ? ilike(meetings.name, `%${search}%`) : undefined // search is the search string to filter meetings by name (case-insensitive, partial match)
          )
        )
        .orderBy(desc(meetings.createdAt), desc(meetings.id))
        .limit(pageSize)
        .offset((page - 1) * pageSize); // offset is the number of records to skip

      // get the total number of meetings the user has created
      const [totalCount] = await db
        .select({ count: count() })
        .from(meetings)
        .innerJoin(agents, eq(meetings.agentId, agents.id))
        .where(
          and(
            eq(meetings.userId, ctx.session.user.id),
            search ? ilike(meetings.name, `%${search}%`) : undefined
          )
        );

      const totalPages = Math.ceil(totalCount.count / pageSize); // totalPages is the total number of pages

      return {
        items: data,
        total: totalCount.count,
        totalPages,
      };
    }),
});
