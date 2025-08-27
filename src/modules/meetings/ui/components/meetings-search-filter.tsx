import { Input } from "@/components/ui/input";
import { SearchIcon, XCircleIcon } from "lucide-react"; 
import { DEFAULT_PAGE } from "@/constants";
import { Button } from "@/components/ui/button";

import { useMeetingsFilters } from "../../hooks/use-meetings-filters";




export const MeetingsSearchFilter = () => {
    const [filters, setFilters] = useMeetingsFilters();  

    const isAnyFilterModified = !!filters.search; // if search is not empty, then isAnyFilterModified is true

    // clear filters and reset page to 1
    const onClearFilters = () => { 
      setFilters({
        search: "",
        page: DEFAULT_PAGE , 
      }); 
    }


    return (
        <div className="relative">
            <Input 
                placeholder="Filter by name"
                className="h-9 bg-white w-[200px] pl-7 pr-7" 
                value={filters.search}
                onChange={(e) => setFilters({ search: e.target.value, page: DEFAULT_PAGE })}
            />
            <SearchIcon className="size-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            {isAnyFilterModified && (
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={onClearFilters}
                    className="absolute right-0 top-1/2 -translate-y-1/2 h-full px-2 hover:bg-transparent"
                >
                    <XCircleIcon className="size-4" />
                </Button>
            )}
        </div>
    )
}