import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import {
  CommandResponsiveDialog,
  CommandInput,
  CommandItem,
  CommandList,
  CommandEmpty,
  CommandGroup,
} from "@/components/ui/command";
import { Dispatch, SetStateAction, useState } from "react";
import { useTRPC } from "@/trpc/client";
import { GeneratedAvatar } from "@/components/generated-avatar";

interface Props {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

export const DashboardCommandDialog = ({ open, setOpen }: Props) => {
  const router = useRouter();
  const trpc = useTRPC();
  const [search, setSearch] = useState(""); // search value for the command select dropdown

  // Query to fetch agents for the command select dropdown.
  // Uses search functionality to filter agents based on user input
  // for a better search experience than a standard dropdown.
  const agents = useQuery(
    trpc.agents.getAllAgents.queryOptions({
      pageSize: 100,
      search: search, // search value for the command select dropdown
    })
  );
  const meetings = useQuery(
    trpc.meetings.getAllMeetings.queryOptions({
      search,
      pageSize: 100,
    })
  );

  return (
    <CommandResponsiveDialog
      shouldFilter={false}
      open={open}
      onOpenChange={setOpen}
    >
      <CommandInput
        placeholder="Find a meeting or agent..."
        value={search}
        onValueChange={(value) => setSearch(value)} // update the search value when the user types
      />
      <CommandList>
        <CommandGroup heading="Meetings">
          <CommandEmpty>
            <span className="text-muted-foreground text-sm">
              No meetings found
            </span>
          </CommandEmpty>
          {/* This is to map the meetings to the command item */}
          {meetings.data?.items.map((meeting) => (
            <CommandItem
              onSelect={() => {
                router.push(`/meetings/${meeting.id}`);
                setOpen(false);
              }}
              key={meeting.id}
            >
              {meeting.name}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Agents">
          <CommandEmpty>
            <span className="text-muted-foreground text-sm">
              No agents found
            </span>
          </CommandEmpty>
          {/* This is to map the meetings to the command item */}
          {agents.data?.items.map((agent) => (
            <CommandItem
              onSelect={() => {
                router.push(`/agents/${agent.id}`);
                setOpen(false);
              }}
              key={agent.id}
            >
                <GeneratedAvatar seed={agent.name} variant="botttsNeutral" className="size=5" />
              {agent.name}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandResponsiveDialog>
  );
};
