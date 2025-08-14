import { inferRouterOutputs } from "@trpc/server"; 

import { AppRouter } from "@/trpc/routers/_app"; 

// This is the type of the data that is returned from the getOneMeeting procedure
export type MeetingGetOne = inferRouterOutputs<AppRouter>["meetings"]["getOneMeeting"];