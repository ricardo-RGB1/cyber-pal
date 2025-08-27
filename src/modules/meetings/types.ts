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