import { auth } from "@/lib/auth";
import { getQueryClient, trpc } from "@/trpc/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { MeetingIdView, MeetingIdViewError, MeetingIdViewLoading } from "@/modules/meetings/ui/views/meeting-id-view";


interface Props {
  params: Promise<{ meetingId: string }>;  
}

const MeetingPageId = async ({ params }: Props) => {
  const { meetingId } = await params; 

  const session = await auth.api.getSession({
    headers: await headers(), 
  });

  if (!session) {
    redirect("/sign-in");
  }

  // prefetch the individual meeting
  const queryClient = getQueryClient();  
  void queryClient.prefetchQuery(trpc.meetings.getOneMeeting.queryOptions({ id: meetingId })); 

  // TODO: Prefetch "meetings.getTranscript"


  // dehydrate the query client to send the data to the client - the purpose of this is to avoid the hydration error due to the data being fetched on the server side 
  const dehydratedState = dehydrate(queryClient); 

  return (
    <HydrationBoundary state={dehydratedState}>
      <Suspense fallback={<MeetingIdViewLoading />}>
        <ErrorBoundary fallback={<MeetingIdViewError />}>
          <MeetingIdView meetingId={meetingId} />
        </ErrorBoundary>
      </Suspense>
    </HydrationBoundary>
  );
};

export default MeetingPageId;



// { id: meetingId } passes the meeting ID from the URL (meetingId) as the id parameter to the server procedure, which then queries the database to fetch that specific meeting's details.