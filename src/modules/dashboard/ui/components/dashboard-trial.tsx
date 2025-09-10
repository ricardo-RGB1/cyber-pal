import Link from "next/link";
import { RocketIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  MAX_MEETINGS_FREE_TRIAL,
  MAX_AGENTS_FREE_TRIAL,
} from "@/modules/premium/constants";



export const DashboardTrial = () => {
  const trpc = useTRPC();
  const { data: freeUsageData } = useQuery(trpc.premium.getFreeUsage.queryOptions()); // get the free usage data from the server

  if (!freeUsageData) return null;

  return (
    <div className="border border-border/10 rounded-lg w-full bg-white/5 flex flex-col gap-y-2">
      <div className="p-3 flex flex-col gap-y-4">
        <div className="flex items-center gap-2">
          <RocketIcon className="size-4" />
          <p className="text-sm font-medium">Free Trial</p>
        </div>
        <div className="flex flex-col gap-y-2">
            <p className="text-xs">
                {freeUsageData?.userAgentsCount} / {MAX_AGENTS_FREE_TRIAL} Agents
            </p>
            <Progress value={(freeUsageData.userAgentsCount / MAX_AGENTS_FREE_TRIAL) * 100} /> 
        </div>
        <div className="flex flex-col gap-y-2">
            <p className="text-xs">
                {freeUsageData?.userMeetingCount} / {MAX_MEETINGS_FREE_TRIAL} Meetings
            </p>
            <Progress value={(freeUsageData.userMeetingCount / MAX_MEETINGS_FREE_TRIAL) * 100} /> 
        </div>
      </div>
      <Button asChild className="bg-transparent border-t border-border/10 hover:bg-white/10 rounded-t-none">
        <Link href="/upgrade">
          Upgrade
        </Link>
      </Button>
    </div>
  );
};
