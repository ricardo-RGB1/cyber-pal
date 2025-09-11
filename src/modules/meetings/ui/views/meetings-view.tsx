"use client";

import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { DataTable } from "@/components/data-table";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { columns } from "../components/columns";
import { EmptyState } from "@/components/empty-state";
import { useRouter } from "next/navigation";
import { useMeetingsFilters } from "@/modules/meetings/hooks/use-meetings-filters";
import { DataPagination } from "@/components/data-pagination";

export const MeetingsView = () => {
  const router = useRouter();
  const trpc = useTRPC();
  const [filters, setFilters] = useMeetingsFilters();

  const { data: meetings } = useSuspenseQuery(
    trpc.meetings.getAllMeetings.queryOptions({
      ...filters, // This is to pass the filters to the queryOptions
    })
  );

  return (
    <div className="flex-1 pb-4 px-4 md:px-8 flex flex-col gap-y-4">
      {meetings.items.length === 0 ? (
        <EmptyState
          title="No meetings found"
          description="Create a meeting to get started"
        />
      ) : (
        <>
          <DataTable
            data={meetings.items}
            columns={columns}
            onRowClick={(row) => router.push(`/meetings/${row.id}`)}
          />
          <DataPagination
            page={filters.page}
            totalPages={meetings.totalPages}
            onPageChange={(page) => setFilters({ page })}
          />
        </>
      )}
    </div>
  );
};

export const MeetingsViewError = () => {
  return (
    <ErrorState
      title="Error loading meetings"
      description="Something went wrong loading meetings"
    />
  );
};

export const MeetingsViewLoading = () => {
  return (
    <LoadingState
      title="Loading meetings..."
      description="This may take a while, please wait..."
    />
  );
};
