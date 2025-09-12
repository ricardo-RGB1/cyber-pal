import { db } from "@/db";
import {
  createTRPCRouter,
  protectedProcedure,
  premiumProcedure,
} from "@/trpc/init";
import { agents, meetings } from "@/db/schema";
import { z } from "zod";
import { agentsUpdateSchema, agentsInsertSchema } from "../schemas";
import { and, count, desc, eq, getTableColumns, ilike } from "drizzle-orm";
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MIN_PAGE_SIZE,
} from "@/constants";
import { TRPCError } from "@trpc/server";

/**
 * Retrieves a single agent by its ID for the authenticated user.
 *
 * @input
 *   - id: The ID of the agent to retrieve.
 *
 * @returns
 *   - An agent object containing all columns from the agents table, plus a placeholder meetingCount.
 *
 * @throws
 *   - TRPCError with code "NOT_FOUND" if the agent does not exist or does not belong to the user.
 *
 * @remarks
 *   - Only agents belonging to the authenticated user can be retrieved.
 *   - The meetingCount field is currently a placeholder and should be replaced with the actual meeting count.
 */
export const agentsRouter = createTRPCRouter({
  getOneAgent: protectedProcedure
    .input(z.object({ id: z.string() })) // input is the id of the agent
    .query(async ({ input, ctx }) => {
      const [existingAgent] = await db
        .select({
          ...getTableColumns(agents),
          // select the agent and the count of meetings for the agent
          meetingCount: db.$count(meetings, eq(agents.id, meetings.agentId)),
        })
        .from(agents)
        .where(
          and(
            eq(agents.id, input.id),
            eq(agents.userId, ctx.session.user.id) // check if the agent belongs to the user
          )
        );

      if (!existingAgent) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Agent not found",
        });
      }

      return existingAgent;
    }),

  /**
   * Retrieves a paginated list of agents for the authenticated user.
   *
   * @input
   *   - page: The page number to retrieve (default: DEFAULT_PAGE)
   *   - pageSize: The number of agents per page (default: DEFAULT_PAGE_SIZE, min: MIN_PAGE_SIZE, max: MAX_PAGE_SIZE)
   *   - search: Optional search string to filter agents by name (case-insensitive, partial match)
   *
   * @returns
   *   - items: Array of agent objects (all columns from the agents table plus a placeholder meetingCount)
   *   - total: Total number of agents matching the query for the user
   *   - totalPages: Total number of pages available
   *
   * @remarks
   *   - Only agents belonging to the authenticated user are returned.
   *   - The meetingCount field is currently a placeholder and should be replaced with the actual meeting count.
   */
  getAllAgents: protectedProcedure
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

      const data = await db
        .select({
          // select the agent and the count of meetings for the agent
          ...getTableColumns(agents),
          meetingCount: db.$count(meetings, eq(agents.id, meetings.agentId)),
        })
        .from(agents)
        .where(
          // load agents the user created
          and(
            eq(agents.userId, ctx.session.user.id),
            search ? ilike(agents.name, `%${search}%`) : undefined
          )
        )
        .orderBy(desc(agents.createdAt), desc(agents.id))
        .limit(pageSize)
        .offset((page - 1) * pageSize); // offset is the number of records to skip

      // get the total number of agents the user has created
      const [totalCount] = await db
        .select({ count: count() })
        .from(agents)
        .where(
          and(
            eq(agents.userId, ctx.session.user.id),
            search ? ilike(agents.name, `%${search}%`) : undefined
          )
        );

      const totalPages = Math.ceil(totalCount.count / pageSize); // totalPages is the total number of pages

      return {
        items: data,
        total: totalCount.count,
        totalPages,
      };
    }),

  /**
   * Creates a new agent for the authenticated user.
   *
   * This mutation inserts a new agent record into the database, associating it with the current user's ID.
   * The input must conform to the `agentsInsertSchema`.
   *
   * @input
   *   - All fields required by the agentsInsertSchema (name, instructions, etc.)
   *   - userId is automatically set from the authenticated user's session
   *
   * @returns
   *   - The newly created agent record with all fields populated
   *
   * @throws
   *   - Validation errors if input doesn't match agentsInsertSchema
   *   - Database errors if the insert operation fails
   *
   * @example
   * ```typescript
   * createAgent({
   *   name: "Customer Support Bot",
   *   instructions: "Help customers with their inquiries"
   * })
   * ```
   */
  createAgent: premiumProcedure("agents")
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

  /**
   * Removes an agent belonging to the authenticated user.
   *
   * This mutation deletes an agent record from the database, ensuring that the agent belongs to the current user.
   * If the agent does not exist or does not belong to the user, a NOT_FOUND error is thrown.
   *
   * @input
   *   - id: The ID of the agent to remove (string)
   *
   * @returns
   *   - The removed agent record containing all fields from the deleted row
   *
   * @throws
   *   - TRPCError with code "NOT_FOUND" if the agent is not found or does not belong to the user
   *   - Database errors if the delete operation fails
   *
   * @remarks
   *   - This operation is irreversible - once an agent is deleted, it cannot be recovered
   *   - Only the agent owner can delete their agents
   *
   * @example
   * ```typescript
   * remove({ id: "agent_123" })
   * ```
   */
  remove: protectedProcedure
    .input(z.object({ id: z.string() })) // input is the id of the agent to remove
    .mutation(async ({ input, ctx }) => {
      const [removeAgent] = await db
        .delete(agents)
        .where(
          and(eq(agents.id, input.id), eq(agents.userId, ctx.session.user.id))
        )
        .returning(); // returning the agent that was deleted

      if (!removeAgent) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Agent not found",
        });
      }

      return removeAgent;
    }),

  /**
   * Updates an existing agent belonging to the authenticated user.
   *
   * This mutation allows the authenticated user to update one or more fields of an agent they own.
   * The mutation first checks that the agent with the specified ID exists and belongs to the current user.
   * If the agent is found, it updates the agent record in the database with the provided fields.
   * The mutation uses the `agentsUpdateSchema` to validate the input, ensuring only allowed fields are updated.
   *
   * @input
   *   - id: The ID of the agent to update (required string)
   *   - name: The new name for the agent (optional string)
   *   - instructions: The new instructions for the agent (optional string)
   *   - Any other updatable fields defined in the agentsUpdateSchema
   *
   * @returns
   *   - The updated agent record with all fields after the changes have been applied
   *
   * @throws
   *   - TRPCError with code "NOT_FOUND" if the agent is not found or does not belong to the user
   *   - Validation errors if input doesn't match agentsUpdateSchema
   *   - Database errors if the update operation fails
   *
   * @remarks
   *   - Only the agent owner can update their agents
   *   - Partial updates are supported - you only need to provide the fields you want to change
   *   - The updatedAt timestamp is automatically updated by the database
   *
   * @example
   * ```typescript
   * // Update only the name
   * update({ id: "agent_123", name: "New Agent Name" })
   *
   * // Update both name and instructions
   * update({
   *   id: "agent_123",
   *   name: "Customer Support Bot",
   *   instructions: "Updated instructions for handling customer queries"
   * })
   * ```
   */
  update: protectedProcedure
    .input(agentsUpdateSchema) // input is the id of the agent to update and the name and instructions of the agent
    .mutation(async ({ input, ctx }) => {
      const [updatedAgent] = await db // updatedAgent is the agent that was updated
        .update(agents)
        .set(input) // set the input to the agents table
        .where(
          and(eq(agents.id, input.id), eq(agents.userId, ctx.session.user.id))
        ) // where the id of the agent is the same as the id of the agent in the input and the user id is the same as the user id in the context
        .returning();

      if (!updatedAgent) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Agent not found",
        });
      }

      return updatedAgent;
    }),
});
