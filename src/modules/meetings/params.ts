import {
  parseAsString,
  parseAsInteger,
  parseAsStringEnum,
  createLoader,
} from "nuqs/server";
import { MeetingStatus } from "./types";

import { DEFAULT_PAGE } from "@/constants";

/**
 * Search parameters configuration for meetings filtering and pagination.
 * 
 * Defines how URL query parameters are parsed and synchronized with component state.
 * Parameters with default values are automatically cleared from the URL when they 
 * match their defaults to keep URLs clean.
 */
export const filtersSearchFilters = {
  /** Search query string for filtering meetings by name */
  search: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
  /** Current page number for pagination */
  page: parseAsInteger
    .withDefault(DEFAULT_PAGE)
    .withOptions({ clearOnDefault: true }),

  /** Status for filtering meetings by status */
  status: parseAsStringEnum(Object.values(MeetingStatus)),
  /** Agent ID for filtering meetings by agent */
  agentId: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
};


/**
 * LOAD SEARCH PARAMS FROM THE URL
 * 
 * This function is used to load the search params from the url
 * 
 * @param searchParams - The search params from the url
 * @returns The search params
 */
export const loadSearchFilters = createLoader(filtersSearchFilters);
