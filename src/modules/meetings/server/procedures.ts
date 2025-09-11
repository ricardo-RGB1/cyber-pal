import { db } from "@/db";
import { createTRPCRouter, protectedProcedure, premiumProcedure } from "@/trpc/init";
import { agents, meetings, user } from "@/db/schema";
import { z } from "zod";
import JSONL from "jsonl-parse-stringify";
import {
  and,
  count,
  desc,
  eq,
  getTableColumns,
  ilike,
  min,
  sql,
  inArray,
} from "drizzle-orm";
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE, 
  MAX_PAGE_SIZE,
  MIN_PAGE_SIZE,
} from "@/constants";
import { TRPCError } from "@trpc/server";
import { meetingsInsertSchema, meetingsUpdateSchema } from "../schemas";
import { MeetingStatus, StreamTranscriptItem } from "../types";
import { streamClient } from "@/lib/stream-video";
import { generateAvatarUri } from "@/lib/avatar";
import { streamChat } from "@/lib/stream-chat";







export const meetingsRouter = createTRPCRouter({
  
  /**
   * generateChatToken - Generates a chat token for the authenticated user
   * 
   * This procedure generates a chat token for the authenticated user using the Stream Chat API.
   * 
   * @returns The generated chat token
   */
  generateChatToken: protectedProcedure.mutation(async ({ctx}) => { 
    const token = streamChat.createToken(ctx.session.user.id);
    await streamChat.upsertUser({
      id: ctx.session.user.id, 
      role: "admin", 
    });

    return token;
  }),

  /**
   * getTranscript - Retrieves and enriches meeting transcript data
   * 
   * This procedure fetches a meeting transcript from a stored URL and enriches it with
   * speaker information (names and avatars) from both users and agents tables.
   * 
   * @param input.id - The meeting ID to fetch the transcript for
   * @returns Array of transcript items with speaker information, or empty array if no transcript
   * 
   * Process:
   * 1. Validates meeting exists and belongs to authenticated user
   * 2. Returns empty array if no transcript URL is stored
   * 3. Fetches and parses JSONL transcript from the stored URL
   * 4. Collects unique speaker IDs from transcript items
   * 5. Fetches speaker details from users and agents tables
   * 6. Enriches transcript items with speaker names and avatars
   * 7. Handles unknown speakers with fallback information
   */
  getTranscript: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      // Step 1: Verify meeting exists and belongs to the authenticated user
      const [existingMeeting] = await db
        .select()
        .from(meetings)
        .where(
          and(
            eq(meetings.id, input.id), // check if the meeting exists
            eq(meetings.userId, ctx.session.user.id) // check if the meeting belongs to the user
          )
        );

      if (!existingMeeting) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Meeting not found",
        });
      }

      // Step 2: Return empty array if no transcript URL is available
      if (!existingMeeting.transcriptUrl) {
        return [];
      }

      // Step 3: Fetch and parse the JSONL transcript from the stored URL
      const transcript = await fetch(existingMeeting.transcriptUrl)
        .then((res) => res.text())
        .then((text) => JSONL.parse<StreamTranscriptItem>(text))
        .catch((err) => {
          // Return empty array if transcript parsing fails
          return [];
        });

      // Step 4: Extract all unique speaker IDs from transcript items
      const speakerIds = [
        ...new Set(transcript.map((item) => item.speaker_id)),
      ];

      // Step 5: Fetch user details for speaker IDs from users table
      const userSpeakers = await db
        .select()
        .from(user)
        .where(inArray(user.id, speakerIds))
        .then((users) =>
          users.map((user) => ({
            ...user,
            // Generate avatar if user doesn't have one
            image:
              user.image ??
              generateAvatarUri({ seed: user.name, variant: "initials" }),
          }))
        );

      // Step 6: Fetch agent details for speaker IDs from agents table
      const agentSpeakers = await db
        .select()
        .from(agents)
        .where(inArray(agents.id, speakerIds))
        .then((agents) =>
          agents.map((agent) => ({
            ...agent,
            // Generate bot-style avatar for agents
            image: generateAvatarUri({
              seed: agent.name,
              variant: "botttsNeutral",
            }),
          }))
        );

        // Step 7: Combine all speakers (users and agents) into single array
        const speakers = [...userSpeakers, ...agentSpeakers]; 

        // Step 8: Enrich transcript items with speaker information
        const transcriptWithSpeakers = transcript.map((item) => {
          // Find speaker details for current transcript item
          const speaker = speakers.find(
            (speaker) => speaker.id === item.speaker_id
          );

          // Handle unknown speakers with fallback information
          if(!speaker) {
            return {
              ...item,
              user: {
                name: "Unknown Speaker",
                image: generateAvatarUri({ seed: "Unknown Speaker", variant: "initials"}) 
              },
            };
          } 

          // Return transcript item with speaker details
          return { 
            ...item,
            user: {
              name: speaker.name, 
              image: speaker.image,
            },
          }; 
        })

        return transcriptWithSpeakers; 
    }),
  generateToken: protectedProcedure.mutation(async ({ ctx }) => {
    await streamClient.upsertUsers([
      // upsert the user into the stream database
      {
        id: ctx.session.user.id,
        name: ctx.session.user.name,
        image:
          ctx.session.user.image ??
          generateAvatarUri({ seed: ctx.session.user.id, variant: "initials" }),
      },
    ]);

    const expirationTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
    const issuedAt = Math.floor(Date.now() / 1000) - 60; // 1 minute ago

    const token = streamClient.generateUserToken({
      user_id: ctx.session.user.id,
      expiration_time: expirationTime,
      issued_at: issuedAt,
    });

    return token;
  }),
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
          message:
            "Meeting not found or you don't have permission to update it",
        });
      }

      return updatedMeeting;
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const [deletedMeeting] = await db
        .delete(meetings)
        .where(
          and(
            eq(meetings.id, input.id), // check if the meeting exists
            eq(meetings.userId, ctx.session.user.id)
          )
        )
        .returning();

      if (!deletedMeeting) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message:
            "Meeting not found or you don't have permission to delete it",
        });
      }

      return deletedMeeting;
    }),

  /**
   * Creates a new meeting with an associated agent and Stream video call.
   *
   * This procedure performs the following operations:
   * 1. Creates a meeting record in the database with the authenticated user as the owner
   * 2. Creates a corresponding Stream video call with recording and transcription enabled
   * 3. Validates that the specified agent exists in the database
   * 4. Registers the agent as a Stream user for video call participation
   *
   * @input meetingsInsertSchema - Meeting data including name, description, agentId, etc.
   *
   * @returns The created meeting object from the database
   *
   * @throws TRPCError with code "NOT_FOUND" if the specified agent doesn't exist
   *
   * @remarks
   * - The meeting is automatically associated with the authenticated user (ctx.session.user.id)
   * - Stream video call is configured with automatic recording (1080p quality) and transcription (English)
   * - The agent is upserted into Stream with a generated avatar for video call participation
   * - The Stream call ID matches the meeting ID for easy correlation
   */
  createMeeting: premiumProcedure("meetings")
    .input(meetingsInsertSchema)
    .mutation(async ({ input, ctx }) => {
      // Step 1: Insert the new meeting record into the database
      // The meeting is automatically associated with the authenticated user
      const [createdMeeting] = await db
        .insert(meetings)
        .values({
          ...input,
          userId: ctx.session.user.id,
        })
        .returning();

      // Step 2: Create a Stream video call for the meeting
      // The call ID matches the meeting ID for easy identification
      const call = streamClient.video.call("default", createdMeeting.id);
      await call.create({
        data: {
          created_by_id: ctx.session.user.id,
          custom: {
            meeting_id: createdMeeting.id,
            meeting_name: createdMeeting.name,
          },
          // Configure automatic recording and transcription for the meeting
          settings_override: {
            transcription: {
              language: "en",
              mode: "auto-on",
              closed_caption_mode: "auto-on",
            },
            recording: {
              mode: "auto-on",
              quality: "1080p",
            },
          },
        },
      });

      // Step 3: Validate that the specified agent exists in the database
      const [existingAgent] = await db
        .select()
        .from(agents)
        .where(eq(agents.id, createdMeeting.agentId));

      if (!existingAgent) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Agent not found",
        });
      }

      // Step 4: Register the agent as a Stream user for video call participation
      // This allows the agent to join the video call and interact with participants
      await streamClient.upsertUsers([
        {
          id: existingAgent.id,
          name: existingAgent.name,
          role: "user",
          // Generate a consistent avatar for the agent based on their name
          image: generateAvatarUri({
            seed: existingAgent.name,
            variant: "botttsNeutral",
          }),
        },
      ]);

      return createdMeeting;
    }),

  getOneMeeting: protectedProcedure
    .input(z.object({ id: z.string() })) // input is the id of the meeting
    .query(async ({ input, ctx }) => {
      const [existingMeeting] = await db
        .select({
          ...getTableColumns(meetings),
          agent: agents,
          duration: sql<number>`EXTRACT(EPOCH FROM(ended_at - started_at))`.as(
            "duration"
          ),
        })
        .from(meetings)
        .innerJoin(agents, eq(meetings.agentId, agents.id)) // join the meetings table with the agents table on the agentId column
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
        search: z.string().nullish(), // search is the search string to filter meetings by name (case-insensitive, partial match)
        agentId: z.string().nullish(), // agentId is the id of the agent to filter meetings by
        status: z
          .enum([
            MeetingStatus.Upcoming,
            MeetingStatus.Processing,
            MeetingStatus.Active,
            MeetingStatus.Completed,
            MeetingStatus.Cancelled,
          ])
          .nullish(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize, search, agentId, status } = input;
      // get the meetings the user created
      const data = await db
        .select({
          ...getTableColumns(meetings), // get all the columns from the meetings table from the db
          agent: agents, // get the agent from the agents table from the db
          duration: sql<number>`EXTRACT(EPOCH FROM(ended_at - started_at))`.as(
            "duration"
          ), // get the duration of the meeting in minutes
        })
        .from(meetings) // this is the left table in the join
        .innerJoin(agents, eq(meetings.agentId, agents.id)) // join the meetings table with the agents table on the agentId column
        .where(
          // load meetings the user created
          and(
            eq(meetings.userId, ctx.session.user.id),
            search ? ilike(meetings.name, `%${search}%`) : undefined, // search is the search string to filter meetings by name (case-insensitive, partial match)
            status ? eq(meetings.status, status) : undefined, // status is the status to filter meetings by
            agentId ? eq(meetings.agentId, agentId) : undefined // agentId is the id of the agent to filter meetings by
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
            search ? ilike(meetings.name, `%${search}%`) : undefined,
            status ? eq(meetings.status, status) : undefined,
            agentId ? eq(meetings.agentId, agentId) : undefined
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
