import {
  MeetingsView,
  MeetingsViewError,
  MeetingsViewLoading,
} from "@/modules/meetings/ui/views/meetings-view";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { MeetingsListHeader } from "@/modules/meetings/ui/components/meetings-list-header";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { loadSearchFilters } from "@/modules/meetings/params";
import type { SearchParams } from "nuqs/server";  





interface Props { 
  searchParams: Promise<SearchParams>;
}


const MeetingsPage = async ({ searchParams }: Props) => {
  const filters = await loadSearchFilters(searchParams); // load the search params from the url

  // check if the user is logged in using server-side session
  const session = await auth.api.getSession({
    headers: await headers(), 
  });

  if (!session) {
    redirect("/sign-in");
  }

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(trpc.meetings.getAllMeetings.queryOptions({
    ...filters, // pass the filters to the queryOptions
  })); // prefetch the meetings data for the client but not render it yet - void is used to tell the compiler that we don't care about the return value

  const dehydratedState = dehydrate(queryClient); 
  // dehydratedState is the data that will be sent to the client

  return (
    <>
      <MeetingsListHeader />
      <HydrationBoundary state={dehydratedState}>
        <Suspense fallback={<MeetingsViewLoading />}> {/* fallback is the component that will be rendered while the data is loading */}
          <ErrorBoundary fallback={<MeetingsViewError />}>
            <MeetingsView />
          </ErrorBoundary>
        </Suspense>
      </HydrationBoundary>
    </>
  );
};

export default MeetingsPage;
