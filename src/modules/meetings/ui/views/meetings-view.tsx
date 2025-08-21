'use client'; 

import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { DataTable } from "@/components/data-table";
import { useTRPC } from "@/trpc/client"; 
import { useSuspenseQuery } from "@tanstack/react-query";
import { columns } from "../components/columns";
import { EmptyState } from "@/components/empty-state";




export const MeetingsView = () => {
  const trpc = useTRPC();
  const { data: meetings } = useSuspenseQuery(trpc.meetings.getAllMeetings.queryOptions({}));

  return (
    <div className="flex-1 pb-4 px-4 md:px-8 flex flex-col gap-y-4">
      {meetings.items.length === 0 ? (
        <EmptyState
          title="No meetings found"
          description="Create a meeting to get started"
        />
      ) : (
        <DataTable data={meetings.items} columns={columns} />
      )}
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