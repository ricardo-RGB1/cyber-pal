// nuqs helps sync the url query params with the state of the component  

import { parseAsInteger, parseAsString, useQueryStates } from "nuqs"; 
import { DEFAULT_PAGE } from "@/constants"; 


/**
 * Custom hook for managing agents list filters through URL query parameters
 * 
 * Uses nuqs to synchronize URL query params with component state, providing
 * a clean way to handle search and pagination state that persists across
 * page refreshes and can be shared via URL.
 * 
 * @returns An object containing:
 *   - search: String filter for agent names (defaults to empty string)
 *   - page: Current page number for pagination (defaults to DEFAULT_PAGE)
 *   - Both values are cleared from URL when they match their defaults
 */
export const useAgentsFilters = () => {
    return useQueryStates({
        search: parseAsString.withDefault("").withOptions({clearOnDefault: true}),
        page: parseAsInteger.withDefault(DEFAULT_PAGE).withOptions({clearOnDefault: true}),
    });
}