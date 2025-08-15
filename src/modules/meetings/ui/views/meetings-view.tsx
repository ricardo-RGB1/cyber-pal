'use client'; 

import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { useTRPC } from "@/trpc/client"; 
import { useSuspenseQuery } from "@tanstack/react-query";



export const MeetingsView = () => {
  const trpc = useTRPC();
  const { data: meetings } = useSuspenseQuery(trpc.meetings.getAllMeetings.queryOptions({}));

  return (
    <div className="overflow-x-scroll">
    </div>
  );
};

export const MeetingsViewError = () => {
  return (
    <ErrorState
      title="Error loading meetings"
      description="Something went wrong loading meetings"
    />
  );
};

export const MeetingsViewLoading = () => {
    return (
      <LoadingState
        title="Loading meetings..."
        description="This may take a while, please wait..."
      />
  );
  };