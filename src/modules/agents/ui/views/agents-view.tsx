"use client";


import { LoadingState } from "@/components/loading-state";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";

export const AgentsView = () => {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.agents.getAllAgents.queryOptions()
  );



  return <div>{JSON.stringify(data, null, 2)}</div>;
};


export const AgentsViewLoading = () => {
  return <LoadingState title="Loading agents..." description="This may take a while, please wait..." />
}





