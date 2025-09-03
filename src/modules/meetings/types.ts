import { inferRouterOutputs } from "@trpc/server"; 

import { AppRouter } from "@/trpc/routers/_app"; 


// This is the type of the data that is returned from the getAllMeetings procedure
export type MeetingGetAll = inferRouterOutputs<AppRouter>["meetings"]["getAllMeetings"]["items"][number]; 


// This is the type of the data that is returned from the getOneMeeting procedure
export type MeetingGetOne = inferRouterOutputs<AppRouter>["meetings"]["getOneMeeting"];


export enum MeetingStatus {
    Upcoming = "upcoming",
    Processing = "processing",
    Active = "active", 
    Completed = "completed",
    Cancelled = "cancelled",
}


// These types come directly from the transcriptUrl ex: {"speaker_id": "1", "type": "text", "text": "Hello, how are you?", "start_ts": 0, "stop_ts": 1000}
export type StreamTranscriptItem = {
    speaker_id: string; 
    type: string; 
    text: string; 
    start_ts: number;  
    stop_ts: number;   
}