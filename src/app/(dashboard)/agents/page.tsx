import { auth } from "@/lib/auth";
import { AgentsListHeader } from "@/modules/agents/ui/components/agents-list-header";
import { AgentsView, AgentsViewLoading } from "@/modules/agents/ui/views/agents-view";
import { trpc, getQueryClient } from "@/trpc/server";  
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { Suspense } from "react";
import { SearchParams } from "nuqs";
import { loadSearchFilters } from "@/modules/agents/params";



interface AgentsPageProps {
  searchParams: Promise<SearchParams>
}


const AgentsPage = async ({searchParams}: AgentsPageProps) => {
  // load the search params from the url - this will help us to synchronize the server and client components
  const filters = await loadSearchFilters(searchParams); 

  // check if the user is logged in using server-side session 
  const session = await auth.api.getSession({
    headers: await headers(),
  }); 

  if (!session) {
    redirect("/sign-in"); 
  }

  const queryClient = getQueryClient(); 
  void queryClient.prefetchQuery(trpc.agents.getAllAgents.queryOptions({
    ...filters, 
  })); 

  return (
    <>
    <AgentsListHeader />
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<AgentsViewLoading />}>
        <AgentsView />
      </Suspense>
    </HydrationBoundary>
    </>
   );
};

export default AgentsPage;



// NOTES: 
// In this page, we have closer access to the database (as a server component), than the client component (AgentsView)
// Therefore, we can already fetch the data from the server component, and then pass it to the cache in the client component (AgentsView) and place the AgentsView inside the HydrationBoundary
// This way, the data is already fetched and cached in the client component, and the AgentsView will be rendered with the data already fetched