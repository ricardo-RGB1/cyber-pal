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
import { CompletedState } from "../components/completed-state";



interface Props  {
  meetingId: string;
}

/**
 * MeetingIdView Component
 * 
 * A comprehensive view component for displaying and managing a single meeting. This component
 * provides a detailed interface for viewing meeting information, editing meeting properties,
 * and managing meeting lifecycle operations including removal.
 * 
 * Features:
 * - Displays meeting details with dynamic status-based rendering
 * - Provides edit functionality through a modal dialog
 * - Handles meeting deletion with confirmation dialog and cascade cleanup
 * - Real-time data updates through optimistic UI patterns
 * - Automatic navigation and cache invalidation after mutations
 * - Status-specific UI components for different meeting states
 * 
 * The component uses Suspense for data fetching and handles loading/error states
 * through separate exported components. It integrates with the premium system
 * to update usage counts when meetings are deleted.
 * 
 * @param meetingId - The unique identifier of the meeting to display
 * 
 * @example
 * ```tsx
 * // In a page component with Suspense boundary
 * <Suspense fallback={<MeetingIdViewLoading />}>
 *   <MeetingIdView meetingId="meeting-123" />
 * </Suspense>
 * ```
 * 
 * @remarks
 * - Requires Suspense boundary for proper data loading
 * - Automatically redirects to /meetings after successful deletion
 * - Updates both meeting list and premium usage caches on deletion
 * - Renders different UI components based on meeting status (upcoming, active, completed, etc.)
 * - Handles all meeting lifecycle states: upcoming, active, processing, completed, cancelled
 */
export const MeetingIdView = ({ meetingId }: Props) => {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false); // State for the update dialog

  const { data: meeting } = useSuspenseQuery(
    trpc.meetings.getOneMeeting.queryOptions({ id: meetingId })
  );

  /**
   * Confirmation dialog hook for meeting deletion.
   * 
   * Creates a reusable confirmation dialog with predefined title and message
   * for meeting removal operations. The dialog ensures user intent before
   * proceeding with destructive operations.
   */
  const [ConfirmDialog, confirm] = useConfirm(
    "Remove Meeting",
    "Are you sure you want to remove this meeting?"
  );

  /**
   * Mutation hook for removing a meeting and its associated data.
   * 
   * This mutation handles the complete removal of a meeting from the system,
   * including cleanup of associated data and cache invalidation.
   * 
   * On Success:
   * - Invalidates the meetings list cache to remove the deleted meeting from lists
   * - Invalidates premium usage cache to update free tier usage counts
   * - Redirects user to the main meetings page
   * 
   * On Error:
   * - Error handling is managed by the tRPC mutation error system
   * - UI remains in current state for user to retry operation
   * 
   * @remarks
   * - Uses mutateAsync for imperative execution after confirmation
   * - Cache invalidation ensures UI consistency across the application
   * - Navigation occurs after cache updates to prevent stale data display
   */
  const removeMeeting = useMutation(
    trpc.meetings.remove.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.meetings.getAllMeetings.queryOptions({})
        );
        await queryClient.invalidateQueries(
          trpc.premium.getFreeUsage.queryOptions()
        );
        router.push("/meetings");
      },
    })
  );

  /**
   * Handler function for meeting removal operation.
   * 
   * Orchestrates the meeting deletion process by first showing a confirmation
   * dialog and then executing the removal mutation if confirmed. This provides
   * a safe deletion workflow with user confirmation.
   * 
   * @remarks
   * - Returns early if user cancels the confirmation dialog
   * - Uses mutateAsync to handle the asynchronous deletion operation
   * - Deletion includes automatic cache invalidation and navigation
   */
  const handleRemoveMeeting = async () => {
    const ok = await confirm();

    if (!ok) return;
    await removeMeeting.mutateAsync({ id: meetingId }); 
  };

  
  /**
   * Determine meeting state for conditional rendering
   * 
   * These boolean flags are used to conditionally render different UI components
   * based on the current status of the meeting. Each status corresponds to a
   * specific UI component that handles the display and interactions appropriate
   * for that meeting state.
   * 
   * Meeting States:
   * - upcoming: Meeting is scheduled but not yet started
   * - active: Meeting is currently in progress
   * - processing: Meeting has ended and is being processed
   * - completed: Meeting processing is complete with results available
   * - cancelled: Meeting was cancelled before completion
   */
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
        {isCancelled && <CancelledState />}
        {isProcessing && <ProcessingState />}
        {isCompleted && <CompletedState meeting={meeting} />} 
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
