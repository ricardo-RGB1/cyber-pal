import {
    CircleXIcon,
    CircleCheckIcon,
    ClockArrowUpIcon,
    VideoIcon, 
    LoaderIcon,
} from "lucide-react"; 

import { CommandSelect } from "@/components/command-select";

import { MeetingStatus } from "@/modules/meetings/types"; 
import { useMeetingsFilters } from "@/modules/meetings/hooks/use-meetings-filters";



/**
 * Configuration array for status filter options in the CommandSelect component.
 * Each option represents a different meeting status with its corresponding icon and display text.
 * 
 * @constant options - Array of option objects containing:
 *   - id: Unique identifier matching the MeetingStatus enum value
 *   - value: The actual enum value used for filtering
 *   - children: JSX element displaying the icon and capitalized status text
 */
const options = [
    { 
        id: MeetingStatus.Upcoming, 
        value: MeetingStatus.Upcoming,  
        children: (
            <div className="flex items-center gap-x-2 capitalize">
                <ClockArrowUpIcon />
                {MeetingStatus.Upcoming}
            </div>
        )
    },
    {
        id: MeetingStatus.Processing, 
        value: MeetingStatus.Processing,  
        children: (
            <div className="flex items-center gap-x-2 capitalize">
                <LoaderIcon />
                {MeetingStatus.Processing}
            </div>
        )
    },
    {
        id: MeetingStatus.Active, 
        value: MeetingStatus.Active,  
        children: (
            <div className="flex items-center gap-x-2 capitalize">
                <VideoIcon />
                {MeetingStatus.Active}
            </div>
        )
    },
    {
        id: MeetingStatus.Completed, 
        value: MeetingStatus.Completed,  
        children: (
            <div className="flex items-center gap-x-2 capitalize">
                <CircleCheckIcon />
                {MeetingStatus.Completed}
            </div>
        )
    },
    {
        id: MeetingStatus.Cancelled, 
        value: MeetingStatus.Cancelled,  
        children: (
            <div className="flex items-center gap-x-2 capitalize">
                <CircleXIcon />
                {MeetingStatus.Cancelled}
            </div>
        )
    },
];

export const StatusFilter = () => {
    const [filters, setFilters] = useMeetingsFilters(); 

    return (
        <CommandSelect
            placeholder="Status" 
            className="h-9"
            options={options}
            onSelect={(value) => setFilters({status: value as MeetingStatus })} // This is to set the status filter in the url query params
            value={filters.status ?? ""} 
        />
    )
}