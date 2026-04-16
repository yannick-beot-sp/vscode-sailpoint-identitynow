import { z } from "zod";

/**
 * Shared Zod field definitions for Search MCP tools.
 */

export const searchQueryField = z.string().describe(
    "Lucene query string. " +
    "Query syntax: https://documentation.sailpoint.com/saas/help/search/building-query.html. " +
    "Searchable fields: https://documentation.sailpoint.com/saas/help/search/searchable-fields.html."
);

export const offsetField = z.number().int().min(0).optional().describe(
    "Offset into the full result set. Use with limit to paginate through results. Defaults to 0."
);

export const limitField = z.number().int().min(1).max(10000).optional().describe(
    "Maximum number of results to return (1–10000). Defaults to 250. " +
    "For large result sets, combine with offset to paginate."
);

export const sortField = (defaultValue: string) =>
    z.string().optional().describe(
        `Field to sort results by. Prefix with '-' for descending order (e.g. '-created'). Defaults to '${defaultValue}'.`
    );
