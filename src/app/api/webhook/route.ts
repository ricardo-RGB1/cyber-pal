import { and, eq, not } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import {
  CallEndedEvent,
  CallTranscriptionReadyEvent,
  CallSessionParticipantLeftEvent,
  CallRecordingReadyEvent,
  CallSessionStartedEvent,
} from "@stream-io/node-sdk";

import { db } from "@/db";
import { agents, meetings } from "@/db/schema";
import { streamClient } from "@/lib/stream-video";
import { inngest } from "@/inngest/client";







/**
 * Verifies the webhook signature using the Stream Video SDK
 * @param body - The raw webhook request body
 * @param signature - The signature from the webhook headers
 * @returns true if the signature is valid, false otherwise
 */
function verifySignatureWithSDK(body: string, signature: string): boolean {
  return streamClient.verifyWebhook(body, signature);
}


/**
 * Webhook API Route for Stream Video Events
 * 
 * This route handles incoming webhook events from Stream Video service.
 * It processes call session events to manage meeting lifecycle and AI agent integration.
 * 
 * Supported Events:
 * - call.session_started: Triggered when a call session begins
 * - call.session_participant_left: Triggered when a participant leaves the call
 * 
 * Security:
 * - Verifies webhook signature using Stream Video SDK
 * - Validates API key presence in headers
 * 
 * Dependencies:
 * - Database: Uses Drizzle ORM to interact with meetings and agents tables
 * - Stream Video: Uses streamClient for call management and OpenAI integration
 * - Environment Variables: Requires OPEN_AI_KEY for AI agent functionality
 * 
 * @param request - NextRequest object containing webhook payload and headers
 * @returns NextResponse with success/error status
 */
export async function POST(request: NextRequest) {
    // Extract required headers for webhook verification
    const signature = request.headers.get("x-signature"); // Stream signature for webhook verification
    const apiKey = request.headers.get("x-api-key"); // API key for additional authentication

    // Validate required headers are present
    if (!signature || !apiKey) {
        return NextResponse.json({ error: "Missing signature or api key" }, { status: 400 });
    }

    // Get raw request body for signature verification
    const bodyOfSignature = await request.text();

    // Verify webhook signature using Stream Video SDK to ensure request authenticity
    if (!verifySignatureWithSDK(bodyOfSignature, signature)) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Parse JSON payload safely
    let payload: unknown; 
    try {
        payload = JSON.parse(bodyOfSignature) as Record<string, unknown>;
    } catch (error) {
        return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Extract event type from payload to determine which handler to use
    const eventType = (payload as Record<string, unknown>)?.type; 

    // Handle call session started event
    if (eventType === "call.session_started") {
        const event = payload as CallSessionStartedEvent;  
        
        // Extract meeting ID from call custom data
        const meetingId = event.call.custom?.meeting_id;  
        
        if (!meetingId) {
            return NextResponse.json({error: "Meeting ID is required"}, {status: 400});
        }

        // Find existing meeting in database that is eligible to be started
        // Only select meetings that are not already completed, active, cancelled, or processing
        const [existingMeeting] = await db
            .select()
            .from(meetings)
            .where(
                and(
                    eq(meetings.id, meetingId),
                    not(eq(meetings.status, "completed")), 
                    not(eq(meetings.status, "active")), 
                    not(eq(meetings.status, "cancelled")), 
                    not(eq(meetings.status, "processing")), 
                )
            );

        if (!existingMeeting) {
            return NextResponse.json({error: "Meeting not found"}, {status: 404});
        }

        // Update meeting status to active and set start time
        await db 
            .update(meetings)
            .set({
                status: "active",
                startedAt: new Date(),
            })
            .where(eq(meetings.id, existingMeeting.id));

        // Retrieve the agent associated with this meeting
        const [existingAgent] = await db
            .select()
            .from(agents)
            .where(eq(agents.id, existingMeeting.agentId)); 

        if (!existingAgent) {
            return NextResponse.json({error: "Agent not found"}, {status: 404}); 
        }

        // Initialize Stream Video call object
        const call = streamClient.video.call("default", meetingId); 

        // Connect OpenAI realtime client to the call for AI agent functionality
        const realtimeClient = await streamClient.video.connectOpenAi({
            call,
            openAiApiKey: process.env.OPEN_AI_KEY!, 
            agentUserId: existingAgent.id, 
        }); 

        // Configure AI agent with custom instructions from the database
        realtimeClient.updateSession({
            instructions: existingAgent.instructions, 
        })

    // Handle participant left event
    } else if (eventType === "call.session_participant_left") {
        const event = payload as CallSessionParticipantLeftEvent;  
        
        // Extract meeting ID from call_cid (format: "type:id")
        const meetingId = event.call_cid.split(":")[1];  

        if (!meetingId) {
            return NextResponse.json({error: "Meeting ID is required"}, {status: 400}); 
        }

        // End the call as a fail-safe to prevent AI agents from staying connected
        // This helps control costs by ensuring agents don't remain in calls indefinitely
        const call = streamClient.video.call("default", meetingId);  
        await call.end();

    // Handle call session ended event
    } else if (eventType === "call.session_ended") {
        const event = payload as CallEndedEvent;   
        const meetingId = event.call.custom?.meeting_id;   

        if(!meetingId) {
            return NextResponse.json({error: "Meeting ID is required"}, {status: 400}); 
        }

        // Update meeting status to be processing and set end time
        await db
            .update(meetings)
            .set({
                status: "processing",
                endedAt: new Date(),
            })
            .where(and(
                eq(meetings.id, meetingId),
                eq(meetings.status, "active")
            ));

    // Handle call transcription ready event and then call the inngest function to summarize the transcript and update the meeting record 
    } else if (eventType === "call.transcription_ready") {
        const event = payload as CallTranscriptionReadyEvent;   
        const meetingId = event.call_cid.split(":")[1]; // call_cid is formatted as "type:id"  

        const [updatedMeeting] = await db 
            .update(meetings)
            .set({ // 
                transcriptUrl: event.call_transcription.url,
            })
            .where(eq(meetings.id, meetingId))
            .returning(); 

            if(!updatedMeeting) {
                return NextResponse.json({error: "Meeting not found"}, {status: 404}); 
            }

           
            /**
             * Trigger the Inngest function to process the meeting transcript and generate a summary.
             * This sends an event named "meetings/processing" with the meeting ID and transcript URL.
             * The Inngest workflow will handle summarization and update the meeting record accordingly.
             */
            await inngest.send({
                name: "meetings/processing", 
                data: { 
                    meetingId: updatedMeeting.id, 
                    transcriptUrl: updatedMeeting.transcriptUrl, 
                }
            });

    // Handle call recording ready event
    } else if (eventType === "call.recording_ready") {
        const event = payload as CallRecordingReadyEvent;   
        const meetingId = event.call_cid.split(":")[1]; // call_cid is formatted as "type:id"  

        await db 
            .update(meetings) 
            .set({
                recordingUrl: event.call_recording.url, 
            })
            .where(eq(meetings.id, meetingId)); 

    }

    // Return success response for all processed events
    return NextResponse.json({status: "ok "})
}



