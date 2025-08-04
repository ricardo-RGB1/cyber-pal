"use client";

import { LoadingState } from "@/components/loading-state";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { DataTable } from "../components/data-table";
import { columns } from "../components/columns"
import { EmptyState } from "@/components/empty-state";
import { useAgentsFilters } from "../../hooks/use-agents-filters";
import { DataPagination } from "../components/data-pagination";
import { useRouter } from "next/navigation";





export const AgentsView = () => {
  const router = useRouter(); 
  const [filters, setFilters] = useAgentsFilters(); 
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.agents.getAllAgents.queryOptions({
    ...filters,  
  }));

  return (
    <div className="flex-1 pb-4 px-4 md:px-8 flex flex-col gap-y-4">
      {data.items.length === 0 ? (
        <EmptyState title="No agents found" description="Create an agent to get started" />
      ) : (  
        <DataTable columns={columns} data={data.items} onRowClick={(row) => router.push(`/agents/${row.id}`)} />
      )}
      <DataPagination 
        page={filters.page} 
        totalPages={data.totalPages} 
        onPageChange={(page) => setFilters({...filters, page})}
      />
    </div>
  );
};

export const AgentsViewLoading = () => {
  return (
    <LoadingState
      title="Loading agents..."
      description="This may take a while, please wait..."
    />
);
};

