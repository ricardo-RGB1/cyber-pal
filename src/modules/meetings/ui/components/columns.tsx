"use client";

import { format } from "date-fns";
import { ColumnDef } from "@tanstack/react-table";
import { GeneratedAvatar } from "@/components/generated-avatar";
import {
  CornerDownRightIcon,
  CircleXIcon,
  ClockArrowUpIcon,
  ClockFadingIcon,
  LoaderIcon,
  CircleCheckIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { VideoIcon } from "lucide-react";
import { MeetingGetAll } from "@/modules/meetings/types";
import { formatMeetingDuration } from "@/lib/utils";







const statusIconMap = {
  upcoming: ClockArrowUpIcon,
  processing: LoaderIcon,
  active: CornerDownRightIcon,
  completed: CircleCheckIcon,
  cancelled: CircleXIcon,
};

const statusColorMap = {
  upcoming: "text-yellow-800 bg-yellow-500/20 border-yellow-800/5",
  processing: "text-gray-800 bg-gray-500/20 border-gray-800/5",
  active: "text-blue-800 bg-blue-500/20 border-blue-800/5",
  completed: "text-green-800 bg-green-500/20 border-green-800/5",
  cancelled: "text-red-800 bg-red-500/20 border-red-800/5",
};

export const columns: ColumnDef<MeetingGetAll>[] = [
  {
    accessorKey: "name",
    header: "Meeting Name",
    cell: ({ row }) => (
      <div className="flex flex-col gap-y-1">
        <span className="font-semibold capitalize">{row.original.name}</span>
        <div className="flex items-center gap-x-2">
          <div className="flex items-center gap-x-1">
            <CornerDownRightIcon className="size-3 text-muted-foreground" />
            <span className="text-sm text-muted-foreground max-w-[200px] truncate capitalize">
              {row.original.agent.name}
            </span>
          </div>
          <GeneratedAvatar
            variant="botttsNeutral"
            seed={row.original.agent.name}
            className="size-4"
          />
          <span className="text-sm text-muted-foreground">
            {row.original.startedAt
              ? format(row.original.startedAt, "MMM d")
              : ""}
          </span>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const Icon =
        statusIconMap[row.original.status as keyof typeof statusIconMap]; // get the icon for the status

      return (
        <Badge
          variant="outline"
          className={cn(
            "capitalize [&>svg]:size-4 text-muted-foreground",
            statusColorMap[row.original.status as keyof typeof statusColorMap] // get the color for the status
          )}
        >
          <Icon
            className={cn(
              row.original.status === "processing" && "animate-spin"
            )}
          />
          {row.original.status.charAt(0).toUpperCase() +
            row.original.status.slice(1)}
        </Badge>
      );
    },
  },
  {
    accessorKey: "duration",
    header: "Duration",
    cell: ({ row }) => (
        <Badge variant='outline' className="capitalize [&>svg]:size-4 flex items-center gap-x-2">
            <ClockFadingIcon className="text-blue-700" />
            {row.original.duration ? formatMeetingDuration(row.original.duration) : "No duration"}
        </Badge>
    )
  }
];
