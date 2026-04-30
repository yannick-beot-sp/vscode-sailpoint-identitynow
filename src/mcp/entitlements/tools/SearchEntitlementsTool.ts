import "reflect-metadata";
import { Tool, ToolContext } from "@frontmcp/sdk";
import { z } from "zod";
import { getIscClient } from "../../plugins/TenantResolverPlugin";
import { ErrorCodes, McpError } from "../../errors";
import { DEFAULT_SEARCH_LIMIT, paginationOutputFields, paginationInputFields, baseDocumentSchema } from "../../search/searchInputFields";

const DEFAULT_SORT = "source.name,displayName";

const inputSchema = paginationInputFields(DEFAULT_SORT)

const outputSchema = z.object({
    ...paginationOutputFields,
    entitlements: z.array(
        baseDocumentSchema.extend({
            displayName: z.string().optional(),
            source: z.object({
                id: z.string().optional(),
                name: z.string().optional(),
            }).optional(),
            attribute: z.string().optional().describe("Attribute name (e.g. 'memberOf', 'groups')."),
            value: z.string().optional(),
            privileged: z.boolean().optional(),
        })
    ),
})

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

@Tool({
    name: "searchEntitlements",
    description:
        "Search entitlements (index: entitlements) using a Lucene query. " +
        "Returns id, name, displayName, source, attribute, requestable, privileged, and tags for each match. " +
        "Supports offset-based pagination: use offset + limit to step through large result sets. " +
        "Query syntax: https://documentation.sailpoint.com/saas/help/search/building-query.html. " +
        "Searchable fields: https://documentation.sailpoint.com/saas/help/search/searchable-fields.html#entitlements.",
    inputSchema,
    outputSchema,
    annotations: {
        title: "Search Entitlements",
        readOnlyHint: true,
    },
})
export class SearchEntitlementsTool extends ToolContext {
    async execute(input: Input): Promise<Output> {
        const client = getIscClient(this);
        const offset = input.offset ?? 0;
        const limit = input.limit ?? DEFAULT_SEARCH_LIMIT;
        const sort = input.sort ?? DEFAULT_SORT;

        try {
            const result = await client.paginatedSearchEntitlementsV2025({
                query: input.query,
                sort,
                limit,
                offset,
            })

            return { total: result.total, offset: result.offset, limit: result.limit, count: result.count, entitlements: result.data };
        } catch (err: any) {
            if (err instanceof McpError) { throw err; }
            throw new McpError(ErrorCodes.ISC_API_ERROR, String(err?.message ?? err));
        }
    }
}
