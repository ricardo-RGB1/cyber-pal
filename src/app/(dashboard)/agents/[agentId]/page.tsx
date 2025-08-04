import { getQueryClient, trpc } from "@/trpc/server";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";
import { Suspense } from "react";
import { AgentIdView, AgentIDViewError, AgentIDViewLoading } from "@/modules/agents/ui/views/agent-id-view";

interface Props {
    params: Promise<{agentId: string}> 
}


const Page = async ({params}: Props) => {

    const {agentId} = await params;
    const queryClient = getQueryClient(); 
    // Prefetch the agent data 
    void queryClient.prefetchQuery(trpc.agents.getOneAgent.queryOptions({id: agentId}));

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <Suspense fallback={<AgentIDViewLoading />}>
                <ErrorBoundary fallback={<AgentIDViewError />}>
                    <AgentIdView agentId={agentId} />
                </ErrorBoundary>
            </Suspense>
        </HydrationBoundary>
    ); 
}

export default Page;