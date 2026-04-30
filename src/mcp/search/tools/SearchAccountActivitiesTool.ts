import "reflect-metadata";
import { Tool, ToolContext } from "@frontmcp/sdk";
import { z } from "zod";
import { getIscClient } from "../../plugins/TenantResolverPlugin";
import { ErrorCodes, McpError } from "../../errors";
import { tenantNameField } from "../../inputFields";
import { DEFAULT_SEARCH_LIMIT, paginationOutputFields, searchQueryField, offsetField, limitField, sortField } from "../searchInputFields";

const DEFAULT_SORT = "-modified";

const inputSchema = z.object({
    tenantName: tenantNameField,
    query: searchQueryField,
    offset: offsetField,
    limit: limitField,
    sort: sortField(DEFAULT_SORT),
});

const identitySchema = z.object({
    id: z.string().optional(),
    name: z.string().optional(),
    type: z.string().optional(),
});

const outputSchema = z.object({
    ...paginationOutputFields,
    accountActivities: z.array(
        z.object({
            id: z.string().optional(),
            action: z.string().optional().describe("Type of action performed in the activity."),
            created: z.string().nullable().optional(),
            modified: z.string().nullable().optional(),
            stage: z.string().optional(),
            status: z.string().optional(),
            requester: identitySchema.optional(),
            recipient: identitySchema.optional(),
            trackingNumber: z.string().optional(),
            errors: z.array(z.string()).nullable().optional(),
            warnings: z.array(z.string()).nullable().optional(),
        })
    ),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

@Tool({
    name: "searchAccountActivities",
    description:
        "Search account activities (index: accountactivities) using a Lucene query. " +
        "Returns id, action, status, stage, requester, recipient, trackingNumber, and more for each match. " +
        "Supports offset-based pagination: use offset + limit to step through large result sets. " +
        "Query syntax: https://documentation.sailpoint.com/saas/help/search/building-query.html. " +
        "Searchable fields: https://documentation.sailpoint.com/saas/help/search/searchable-fields.html#account-activities.",
    inputSchema,
    outputSchema,
    annotations: {
        title: "Search Account Activities",
        readOnlyHint: true,
    },
})
export class SearchAccountActivitiesTool extends ToolContext {
    async execute(input: Input): Promise<Output> {
        const client = getIscClient(this);
        const offset = input.offset ?? 0;
        const limit = input.limit ?? DEFAULT_SEARCH_LIMIT;

        try {
            const result = await client.paginatedSearchAccountActivitiesV2025({
                query: input.query,
                sort: input.sort ?? DEFAULT_SORT,
                limit,
                offset,
            })


            return { total: result.total, offset: result.offset, limit: result.limit, count: result.count, accountActivities:result.data };
        } catch (err: any) {
            if (err instanceof McpError) { throw err; }
            throw new McpError(ErrorCodes.ISC_API_ERROR, String(err?.message ?? err));
        }
    }
}
