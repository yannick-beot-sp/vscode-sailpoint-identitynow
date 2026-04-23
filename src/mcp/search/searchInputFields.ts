import { z } from "zod";
import { tenantNameField } from "../inputFields";

export const DEFAULT_SEARCH_LIMIT = 250;

export const searchQueryField = z.string().describe(
    "Lucene query string. " +
    "Query syntax: https://documentation.sailpoint.com/saas/help/search/building-query.html. " +
    "Searchable fields: https://documentation.sailpoint.com/saas/help/search/searchable-fields.html."
);

export const offsetField = z.number().int().min(0).optional().describe(
    "Offset into the full result set. Use with limit to paginate through results. Defaults to 0."
);

export const limitField = z.number().int().min(1).max(10000).optional().describe(
    `Maximum number of results to return (1–10000). Defaults to ${DEFAULT_SEARCH_LIMIT}. ` +
    "For large result sets, combine with offset to paginate."
);

export const sortField = (defaultValue: string) =>
    z.string().optional().describe(
        `Field to sort results by. Prefix with '-' for descending order (e.g. '-created'). Defaults to '${defaultValue}'.`
    );

export const paginationInputFields = (defaultValue: string) =>
    z.object({
        tenantName: tenantNameField,
        query: searchQueryField,
        offset: offsetField,
        limit: limitField,
        sort: sortField(defaultValue),
    });

export const paginationOutputFields = {
    total: z.number().optional().describe("Total number of matching results (when available)."),
    offset: z.number().describe("Offset used for this result page."),
    limit: z.number().describe("Limit used for this result page."),
    count: z.number().describe("Number of results returned in this response."),
};

export const referenceSchema = z.object({
    id: z.string().optional(),
    name: z.string().optional(),
    type: z.string().optional(),
});

export const baseDocumentSchema = z.object({
    id: z.string().optional(),
    name: z.string().optional(),
    description: z.string().nullable().optional(),
    enabled: z.boolean().optional(),
    requestable: z.boolean().optional(),
    owner: referenceSchema.optional(),
    tags: z.array(z.string()).optional(),
});
