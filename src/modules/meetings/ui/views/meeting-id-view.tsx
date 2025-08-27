"use client";

import { useTRPC } from "@/trpc/client";
import {
  useSuspenseQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { LoadingState } from "@/components/loading-state";
import { ErrorState } from "@/components/error-state";
import { MeetingIdViewHeader } from "../components/meeting-id-view-header";
import { useRouter } from "next/navigation";
import { useConfirm } from "@/hooks/use-confirm";
import { useState } from "react";
import { UpdateMeetingDialog } from "../components/update-meeting-dialog";
import { UpcomingState } from "../components/upcoming-state";
import { ActiveState } from "../components/active-state";
import { CancelledState } from "../components/cancelled-state";
import { ProcessingState } from "../components/processing-state";

interface Props {
  meetingId: string;
}

export const MeetingIdView = ({ meetingId }: Props) => {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false); // State for the update dialog

  const { data: meeting } = useSuspenseQuery(
    trpc.meetings.getOneMeeting.queryOptions({ id: meetingId })
  );

  const [ConfirmDialog, confirm] = useConfirm(
    "Remove Meeting",
    "Are you sure you want to remove this meeting?"
  );

  const removeMeeting = useMutation(
    trpc.meetings.remove.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.meetings.getAllMeetings.queryOptions({})
        );
        // TODO: Invalidate FREE TIER usage
        router.push("/meetings");
      },
    })
  );

  const handleRemoveMeeting = async () => {
    const ok = await confirm();

    if (!ok) return;
    await removeMeeting.mutateAsync({ id: meetingId }); // This will trigger the onSuccess callback
  };

  const isActive = meeting.status === "active";
  const isCompleted = meeting.status === "completed";
  const isCancelled = meeting.status === "cancelled";
  const isUpcoming = meeting.status === "upcoming";
  const isProcessing = meeting.status === "processing";

  return (
    <>
      <ConfirmDialog />
      <UpdateMeetingDialog
        open={updateDialogOpen}
        onOpenChange={setUpdateDialogOpen}
        initialValues={meeting}
      />
      <div className="flex-1 py-4 px-4 md:px-8 flex flex-col gap-y-4">
        <MeetingIdViewHeader
          meetingId={meetingId}
          meetingName={meeting.name}
          onEdit={() => setUpdateDialogOpen(true)}
          onRemove={handleRemoveMeeting}
        />
        <h2>the status is {meeting.status}</h2>
        {isCancelled && <CancelledState />}
        {isProcessing && <ProcessingState />}

        {isActive && <ActiveState meetingId={meetingId} />}
        {isUpcoming && (
          <UpcomingState
            meetingId={meetingId}
            onCancelMeeting={() => {}}
            isCancelling={false}
          />
        )}
      </div>
    </>
  );
};

export const MeetingIdViewLoading = () => {
  return (
    <LoadingState
      title="Loading meeting details..."
      description="Please wait while we load the meeting details..."
    />
  );
};

export const MeetingIdViewError = () => {
  return (
    <ErrorState
      title="Error loading meeting details..."
      description="Please try again later..."
    />
  );
};
