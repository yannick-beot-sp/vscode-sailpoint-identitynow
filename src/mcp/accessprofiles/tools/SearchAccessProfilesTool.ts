import "reflect-metadata";
import { Tool, ToolContext } from "@frontmcp/sdk";
import { z } from "zod";
import { getIscClient } from "../../plugins/TenantResolverPlugin";
import { ErrorCodes, McpError } from "../../errors";
import { DEFAULT_SEARCH_LIMIT, paginationOutputFields, baseDocumentSchema, searchQueryField, offsetField, limitField, sortField, referenceSchema, paginationInputFields } from "../../search/searchInputFields";

const DEFAULT_SORT = "name";

const inputSchema = paginationInputFields(DEFAULT_SORT)

const outputSchema = z.object({
    ...paginationOutputFields,
    accessProfiles: z.array(
        baseDocumentSchema.extend({
            source: z.object({
                id: z.string().optional(),
                name: z.string().optional(),
            }).optional(),
            entitlements: z.array(z.object({
                id: z.string().optional(),
                name: z.string().optional(),
                schema: z.string().optional(),
                attribute: z.string().optional(),
                value: z.string().optional(),
                privileged: z.boolean().optional(),
            })).optional(),
            apps: z.array(z.object({
                id: z.string().optional(),
                name: z.string().optional(),
                description: z.string().optional(),
                owner: referenceSchema.optional(),
            })).optional(),
        })
    ),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

@Tool({
    name: "searchAccessProfiles",
    description:
        "Search access profiles (index: accessprofiles) using a Lucene query. " +
        "Returns id, name, description, enabled, requestable, owner, source, entitlements, apps, and tags for each match. " +
        "Supports offset-based pagination: use offset + limit to step through large result sets. " +
        "Query syntax: https://documentation.sailpoint.com/saas/help/search/building-query.html. " +
        "Searchable fields: https://documentation.sailpoint.com/saas/help/search/searchable-fields.html#access-profiles.",
    inputSchema,
    outputSchema,
    annotations: {
        title: "Search Access Profiles",
        readOnlyHint: true,
    },
})
export class SearchAccessProfilesTool extends ToolContext {
    async execute(input: Input): Promise<Output> {
        const client = getIscClient(this);
        const offset = input.offset ?? 0;
        const limit = input.limit ?? DEFAULT_SEARCH_LIMIT;
        const sort = input.sort ?? DEFAULT_SORT;

        try {
            const result = await client.paginatedSearchAccessProfilesV2025({
                query: input.query,
                sort,
                limit,
                offset,
            })

            return { total: result.total, offset: result.offset, limit: result.limit, count: result.count, accessProfiles: result.data };
        } catch (err: any) {
            if (err instanceof McpError) { throw err; }
            throw new McpError(ErrorCodes.ISC_API_ERROR, String(err?.message ?? err));
        }
    }
}
