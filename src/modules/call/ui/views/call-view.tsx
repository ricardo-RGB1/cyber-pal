"use client";

import { ErrorState } from "@/components/error-state";
import { CallProvider } from "@/modules/call/ui/components/call-provider";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";

interface Props {
  meetingId: string;
}

export const CallView = ({ meetingId }: Props) => {
  const trpc = useTRPC();
  // this is a hook that fetches the data from the server and caches it in the client 
  const { data } = useSuspenseQuery( 
    trpc.meetings.getOneMeeting.queryOptions({ id: meetingId })
  );

  if (data.status === "completed") {
    return (
      <div className="flex h-screen items-center justify-center">
        <ErrorState
          title="Meeting has ended"
          description="You can no longer join this meeting."
        />
      </div>
    );
  }

  return <CallProvider meetingId={meetingId} meetingName={data.name} />;
};
