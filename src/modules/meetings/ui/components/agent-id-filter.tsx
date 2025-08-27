import { useState } from "react"; 
import { useQuery } from "@tanstack/react-query";  

import { useTRPC } from "@/trpc/client"; 
import { CommandSelect } from "@/components/command-select";  
import { GeneratedAvatar } from "@/components/generated-avatar";  

import { useMeetingsFilters } from "@/modules/meetings/hooks/use-meetings-filters"; 


export const AgentIdFilter = () => {
    const [filters, setFilters] = useMeetingsFilters();  

    const trpc = useTRPC(); 

    const [agentSearch, setAgentSearch] = useState(""); 

    const { data: agents } = useQuery(
        trpc.agents.getAllAgents.queryOptions({
            pageSize: 100, 
            search: agentSearch,
        })
    ); 

    return (
        <CommandSelect
            className="h-9"
            placeholder="Agent" 
            options={(agents?.items ?? []).map(((agent) =>({
                id: agent.id,  
                value: agent.id,
                children: (
                    <div className="flex items-center gap-x-2">
                        <GeneratedAvatar
                            seed={agent.name}
                            variant="botttsNeutral"
                            className="size-4" 
                        /> 
                        {agent.name}
                    </div>
                )
            })))}
            onSelect={(value) => setFilters({agentId: value})} // This is to set the agentId filter in the url query params
            onSearch={setAgentSearch}
            value={filters.agentId ?? ""}
        />
    )
}








