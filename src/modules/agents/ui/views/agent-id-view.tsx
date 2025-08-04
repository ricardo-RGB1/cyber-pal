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

export const AgentIdView = ({ agentId }: Props) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const [updateAgentDialogOpen, setUpdateAgentDialogOpen] = useState(false); 


  
  const { data } = useSuspenseQuery( 
    trpc.agents.getOneAgent.queryOptions({ id: agentId })
  );

  /**
   * This hook  sets up a mutation for removing an agent.
   *   (useMutation is a hook that allows us to mutate the data in the database)
   *
   * - When the mutation succeeds:
   *   - It invalidates the cached list of all agents, so the UI will refetch and update.
   *   - It then navigates the user back to the main agents page.
   *
   * - If the mutation fails:
   *   - It displays an error toast with the error message.
   */
  const removeAgent = useMutation(
    trpc.agents.remove.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.agents.getAllAgents.queryOptions({})
        );
        // TODO: Invalidate free tier usage
        router.push("/agents"); // push after the function invalidates the agents list
      },
      onError: (error) => {
        toast.error(error.message); 
      },
    })
  );

  const [ConfirmDialog, confirm] = useConfirm(
    "Delete agent. Are you sure?",
    `The following action will remove ${data.meetingCount} associated meetings`, 
  );

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
