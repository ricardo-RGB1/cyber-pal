import { parseAsString, parseAsInteger, createLoader } from "nuqs/server"; 

import { DEFAULT_PAGE } from "@/constants"; 

/**
 * SYNCHRONIZE URL QUERY PARAMS WITH THE STATE OF THE COMPONENT 
 * 
 * Search parameters configuration for agents filtering and pagination.
 * These parameters are synchronized with the URL query string.

 */
export const filtersSearchFilters = {
    /** Search query string for filtering agents by name */
    search: parseAsString.withDefault("").withOptions({clearOnDefault: true}),
    /** Current page number for pagination */
    page: parseAsInteger.withDefault(DEFAULT_PAGE).withOptions({clearOnDefault: true}),
}

/**
 * LOAD SEARCH PARAMS FROM THE URL 
 */
export const loadSearchFilters = createLoader(filtersSearchFilters); 