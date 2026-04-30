import "reflect-metadata";
import { Tool, ToolContext } from "@frontmcp/sdk";
import { z } from "zod";
import { getIscClient } from "../../plugins/TenantResolverPlugin";
import { ErrorCodes, McpError } from "../../errors";
import { tenantNameField } from "../../inputFields";
import { DEFAULT_SEARCH_LIMIT, paginationOutputFields, baseDocumentSchema, searchQueryField, offsetField, limitField, sortField } from "../../search/searchInputFields";

const DEFAULT_SORT = "name";

const inputSchema = z.object({
    tenantName: tenantNameField,
    query: searchQueryField,
    offset: offsetField,
    limit: limitField,
    sort: sortField(DEFAULT_SORT),
});

const outputSchema = z.object({
    ...paginationOutputFields,
    roles: z.array(baseDocumentSchema),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

@Tool({
    name: "searchRoles",
    description:
        "Search roles (index: roles) using a Lucene query. " +
        "Returns id, name, description, enabled, requestable, owner, and tags for each match. " +
        "Supports offset-based pagination: use offset + limit to step through large result sets. " +
        "Query syntax: https://documentation.sailpoint.com/saas/help/search/building-query.html. " +
        "Searchable fields: https://documentation.sailpoint.com/saas/help/search/searchable-fields.html#roles.",
    inputSchema,
    outputSchema,
    annotations: {
        title: "Search Roles",
        readOnlyHint: true,
    },
})
export class SearchRolesTool extends ToolContext {
    async execute(input: Input): Promise<Output> {
        const client = getIscClient(this);
        const offset = input.offset ?? 0;
        const limit = input.limit ?? DEFAULT_SEARCH_LIMIT;
        const sort = input.sort ?? DEFAULT_SORT;

        try {
            const result = await client.paginatedSearchRolesV2025({
                query: input.query,
                sort,
                limit,
                offset,
            })

            const roles = result.data.map(r => ({
                id: r.id,
                name: r.name,
                description: r.description,
                enabled: r.enabled,
                requestable: r.requestable,
                owner: r.owner ? { id: r.owner.id, name: r.owner.name, type: r.owner.type } : undefined,
                tags: r.tags,
            }));

            return { total: result.total, offset: result.offset, limit: result.limit, count: result.count, roles };
        } catch (err: any) {
            if (err instanceof McpError) { throw err; }
            throw new McpError(ErrorCodes.ISC_API_ERROR, String(err?.message ?? err));
        }
    }
}
