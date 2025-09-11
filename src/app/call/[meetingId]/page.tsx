import { auth } from "@/lib/auth"; 
import { trpc, getQueryClient } from "@/trpc/server"; 
import { headers } from "next/headers"; 
import { redirect } from "next/navigation";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query"; 
import { CallView } from "@/modules/call/ui/views/call-view"; 


interface Props {
    params: Promise<{
        meetingId: string;
    }>; 
}; 


const MeetingIdPage = async ({params}: Props) => {
    const { meetingId } = await params; 
    const session = await auth.api.getSession({
        headers: await headers(), 
    }); 

    if (!session) {
        redirect("/sign-in"); 
    }

    
    const queryClient = getQueryClient(); 
    // Prefetch the meeting data from the server so that the client can hydrate the data 
    void queryClient.prefetchQuery( 
        trpc.meetings.getOneMeeting.queryOptions({ id: meetingId}), 
    )

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
        <CallView meetingId={meetingId} />
        </HydrationBoundary>
    )
}


export default MeetingIdPage; 