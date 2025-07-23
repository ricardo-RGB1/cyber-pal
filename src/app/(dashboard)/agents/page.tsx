import { AgentsView, AgentsViewLoading } from "@/modules/agents/ui/views/agents-view";
import { trpc, getQueryClient } from "@/trpc/server";  
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { Suspense } from "react";


const AgentsPage = () => {

  const queryClient = getQueryClient(); 
  void queryClient.prefetchQuery(trpc.agents.getAllAgents.queryOptions()); 


  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<AgentsViewLoading />}>
        <AgentsView />
      </Suspense>
    </HydrationBoundary>
  );
};

export default AgentsPage;



// NOTES: 
// In this page, we have closer access to the database (as a server component), than the client component (AgentsView)
// Therefore, we can already fetch the data from the server component, and then pass it to the cache in the client component (AgentsView) and place the AgentsView inside the HydrationBoundary
// This way, the data is already fetched and cached in the client component, and the AgentsView will be rendered with the data already fetched