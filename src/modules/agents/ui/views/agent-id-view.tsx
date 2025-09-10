"use client";

import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { useTRPC } from "@/trpc/client";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { AgentIdViewHeader } from "../components/agent-id-view-header";
import { GeneratedAvatar } from "@/components/generated-avatar";
import { Badge } from "@/components/ui/badge";
import { VideoIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useConfirm } from "@/hooks/use-confirm";
import { useState } from "react";
import { UpdateAgentDialog } from "../components/update-agent-dialog";

interface Props {
  agentId: string;
}




/**
 * AgentIdView Component
 * 
 * A detailed view component for displaying and managing a single AI agent. This component
 * provides a comprehensive interface for viewing agent details, editing agent properties,
 * and removing agents from the system.
 * 
 * Features:
 * - Displays agent information including name, avatar, instructions, and meeting count
 * - Provides edit functionality through a modal dialog
 * - Handles agent deletion with confirmation dialog and cascade cleanup
 * - Real-time data updates through optimistic UI patterns
 * - Automatic navigation and cache invalidation after mutations
 * 
 * The component uses Suspense for data fetching and handles loading/error states
 * through separate exported components. It integrates with the premium system
 * to update usage counts when agents are deleted.
 * 
 * @param agentId - The unique identifier of the agent to display
 * 
 * @example
 * ```tsx
 * // In a page component with Suspense boundary
 * <Suspense fallback={<AgentIDViewLoading />}>
 *   <AgentIdView agentId="agent-123" />
 * </Suspense>
 * ```
 * 
 * @remarks
 * - Requires Suspense boundary for proper data loading
 * - Automatically redirects to /agents after successful deletion
 * - Updates both agent list and premium usage caches on deletion
 * - Shows meeting count affected by deletion in confirmation dialog
 */
export const AgentIdView = ({ agentId }: Props) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const [updateAgentDialogOpen, setUpdateAgentDialogOpen] = useState(false); 

  
  const { data } = useSuspenseQuery( 
    trpc.agents.getOneAgent.queryOptions({ id: agentId })
  );

  /**
   * Mutation hook for removing an agent and its associated data.
   * 
   * This mutation handles the complete removal of an agent from the system,
   * including cleanup of associated meetings and cache invalidation.
   * 
   * On Success:
   * - Invalidates the agents list cache to remove the deleted agent from lists
   * - Invalidates premium usage cache to update free tier usage counts
   * - Redirects user to the main agents page
   * 
   * On Error:
   * - Displays error message via toast notification
   * - Preserves current page state for user to retry
   * 
   * @remarks
   * - Uses mutateAsync for imperative execution after confirmation
   * - Cache invalidation ensures UI consistency across the application
   * - Navigation occurs after cache updates to prevent stale data display
   */
  const removeAgent = useMutation(
    trpc.agents.remove.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.agents.getAllAgents.queryOptions({})
        );
        await queryClient.invalidateQueries(
          trpc.premium.getFreeUsage.queryOptions()
        );
        router.push("/agents"); // push after the function invalidates the agents list
      },
      onError: (error) => {
        toast.error(error.message); 
      },
    })
  );

  /**
   * Confirmation dialog hook for agent deletion.
   * 
   * Creates a reusable confirmation dialog that warns users about the consequences
   * of deleting an agent, specifically mentioning the number of associated meetings
   * that will also be removed.
   * 
   * @returns [ConfirmDialog, confirm] - Dialog component and confirmation function
   */
  const [ConfirmDialog, confirm] = useConfirm(
    "Delete agent. Are you sure?",
    `The following action will remove ${data.meetingCount} associated meetings`, 
  );

  /**
   * Handles the agent removal process with user confirmation.
   * 
   * This function orchestrates the deletion workflow:
   * 1. Shows confirmation dialog to user
   * 2. If confirmed, executes the remove mutation
   * 3. Mutation handles navigation and cache updates
   * 
   * @remarks
   * - Uses async/await pattern for proper error handling
   * - Early return prevents execution if user cancels
   * - mutateAsync allows for imperative control flow
   */
  const handleRemove = async () => {
    const confirmed = await confirm();
    if (!confirmed) return;
    await removeAgent.mutateAsync({ id: agentId }); // mutateAsync is a function that allows us to mutate the data in the database asynchronously
  };

  return (
    <>
      <ConfirmDialog />
      <UpdateAgentDialog
        open={updateAgentDialogOpen} // This is to open the update agent dialog 
        onOpenChange={setUpdateAgentDialogOpen} // This is to close the update agent dialog 
        initialValues={data}
      />
      <div className="flex-1 py-4 px-4 md:px-8 flex flex-col gap-y-4">
        <AgentIdViewHeader
          agentId={agentId}
          agentName={data.name}
          onEdit={() => setUpdateAgentDialogOpen(true)}
          onRemove={handleRemove}
        />
        <div className="bg-white rounded-lg border">
          <div className="px-4 py-5 gap-y-5 flex flex-col col-span-5">
            <div className="flex items-center gap-x-3">
              <GeneratedAvatar
                variant="botttsNeutral"
                seed={data.name}
                className="size-10"
              />
              <h2 className="text-2xl font-medium">{data.name}</h2>
            </div>
            <Badge
              variant="outline"
              className="flex items-center gap-x-2 [&>svg]:size-4"
            >
              <VideoIcon className="text-green-700" />
              {data.meetingCount}{" "}
              {data.meetingCount === 1 ? "meeting" : "meetings"}
            </Badge>
            <div className="flex flex-col gap-y-4">
              <p className="text-lg font-medium">Instructions</p>
              <p className="text-neutral-800">{data.instructions}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export const AgentIDViewLoading = () => {
  return (
    <LoadingState
      title="Loading agent..."
      description="This may take a while, please wait..."
    />
  );
};

export const AgentIDViewError = () => {
  return (
    <ErrorState
      title="Error loading agent"
      description="Please try again later"
    />
  );
};

// The useMutation hook is a fundamental pattern in modern React applications using TanStack Query for managing server state and keeping the UI synchronized with backend changes.
