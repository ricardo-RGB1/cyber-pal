import { inngest } from "./client";
import JSONL from "jsonl-parse-stringify";
import { StreamTranscriptItem } from "@/modules/meetings/types";
import { db } from "@/db";
import { agents, meetings, user } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { createAgent, openai, TextMessage } from "@inngest/agent-kit";

const summarizerAgent = createAgent({
  name: "summarizer",
  system:
    `You are an expert summarizer. You write readable, concise, simple content. You are given a transcript of a meeting and you need to summarize it.

Use the following markdown structure for every output:

### Overview
Provide a detailed, engaging summary of the session's content. Focus on major features, user workflows, and any key takeaways. Write in a narrative style, using full sentences. Highlight unique or powerful aspects of the product, platform, or discussion.

### Notes
Break down key content into thematic sections with timestamp ranges. Each section should summarize key points, actions, or demos in bullet format.

Example:
#### Section Name
- Main point or demo shown here
- Another key insight or interaction
- Follow-up tool or explanation provided

#### Next Section
- Feature X automatically does Y
- Mention of integration with Z
`.trim(),
  model: openai({ model: "gpt-4o-mini", apiKey: process.env.OPEN_AI_KEY }),
});

/**
 * Inngest Function: meetingProcessing
 *
 * This function is triggered by the "meetings/processing" event and is responsible for
 * processing a meeting's transcript, generating a summary using an AI agent, and updating
 * the meeting record in the database with the generated summary and a completed status.
 *
 * Detailed Steps:
 *
 * 1. Fetch the Transcript:
 *    - Downloads the transcript file from the provided `transcriptUrl` (in the event data).
 *    - The transcript is expected to be in JSONL format (JSON Lines).
 *
 * 2. Parse the Transcript:
 *    - Parses the downloaded transcript text into an array of `StreamTranscriptItem` objects.
 *    - Each item represents a segment of the meeting, including speaker information and content.
 *
 * 3. Enrich Transcript with Speaker Information:
 *    - Extracts all unique speaker IDs from the transcript.
 *    - Queries the database for both user and agent records matching these speaker IDs.
 *    - Merges user and agent records into a single list of possible speakers.
 *    - For each transcript item, attempts to match the `speaker_id` to a user or agent:
 *        - If a match is found, attaches the speaker's name to the transcript item.
 *        - If no match is found, assigns a default "Unknown Speaker" label.
 *    - The result is a transcript array where each item includes a `user` field with speaker info.
 *
 * 4. Generate a Summary Using the Summarizer Agent:
 *    - Invokes the `summarizerAgent` (an OpenAI-powered agent) with a prompt to summarize
 *      the enriched transcript.
 *    - The transcript is stringified and included in the prompt.
 *    - The agent returns a summary in markdown format, following a specific structure.
 *
 * 5. Save the Summary to the Database:
 *    - Updates the corresponding meeting record (by `meetingId` from the event data) in the database.
 *    - Sets the `summary` field to the generated summary content.
 *    - Updates the meeting's `status` to "completed".
 *
 * This function is designed to be idempotent and safe to run as part of an automated workflow.
 * It ensures that meeting transcripts are processed, summarized, and stored for later retrieval.
 */
export const meetingProcessing = inngest.createFunction(
  { id: "meeting/processing" },
  { event: "meetings/processing" },
  async ({ event, step }) => {
    // Step 1: Fetch the transcript from the provided URL
    const response = await step.run("fetch-transcript", async () => {
      return fetch(event.data.transcriptUrl).then((res) => res.text());
    });

    // Step 2: Parse the transcript from JSONL format into an array of transcript items
    const transcript = await step.run("parse-transcript", async () => {
      return JSONL.parse<StreamTranscriptItem>(response);
    });

    // Step 3: Enrich transcript items with speaker information (user or agent)
    const transcriptWithSpeakers = await step.run("add-speakers", async () => {
      // Collect all unique speaker IDs from the transcript
      const speakerIds = [
        ...new Set(transcript.map((item) => item.speaker_id)),
      ];

      // Fetch user records for speaker IDs
      const userSpeakers = await db
        .select()
        .from(user)
        .where(inArray(user.id, speakerIds))
        .then((users) =>
          users.map((user) => ({
            ...user,
          }))
        );

      // Fetch agent records for speaker IDs
      const agentSpeakers = await db
        .select()
        .from(agents)
        .where(inArray(agents.id, speakerIds))
        .then((agents) =>
          agents.map((agent) => ({
            ...agent,
          }))
        );

      // Combine all possible speakers
      const speakers = [...userSpeakers, ...agentSpeakers];

      // Attach speaker info to each transcript item
      return transcript.map((item) => {
        const speaker = speakers.find(
          (speaker) => speaker.id === item.speaker_id
        );

        if (!speaker) {
          // If no matching speaker, label as unknown
          return {
            ...item,
            user: {
              name: "Unknown Speaker",
              image: null,
            },
          };
        }

        // Attach speaker's name (and optionally image, if available)
        return {
          ...item,
          user: speaker.name,
        };
      });
    });

    // Step 4: Generate a summary using the summarizer agent
    const { output: summary } = await summarizerAgent.run(
      "Summarize the following transcript: " +
        JSON.stringify(transcriptWithSpeakers)
    );

    // Step 5: Save the summary and mark the meeting as completed in the database
    await step.run("save-summary", async () => {
      await db
        .update(meetings)
        .set({
          summary: (summary[0] as TextMessage).content as string,
          status: "completed",
        })
        .where(eq(meetings.id, event.data.meetingId));
    });
  }
);
