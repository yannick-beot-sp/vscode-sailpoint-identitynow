import "reflect-metadata";
import { Tool, ToolContext } from "@frontmcp/sdk";
import { z } from "zod";
import { getIscClient } from "../../plugins/TenantResolverPlugin";
import { ErrorCodes, McpError } from "../../errors";
import { tenantNameField } from "../../inputFields";
import { searchQueryField, offsetField, limitField, sortField } from "../searchInputFields";

const DEFAULT_LIMIT = 250;
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
    total: z.number().optional().describe("Total number of matching account activities (when available)."),
    offset: z.number().describe("Offset used for this result page."),
    limit: z.number().describe("Limit used for this result page."),
    count: z.number().describe("Number of account activities returned in this response."),
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

/**
 * Searches account activities (index: accountactivities) using a Lucene query, with support for
 * offset-based pagination and limits up to 10 000.
 */
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
        const limit = input.limit ?? DEFAULT_LIMIT;

        try {
            const response = await client.paginatedSearchAccountActivities(
                input.query,
                limit,
                offset,
                true, // request total count
                input.sort ?? DEFAULT_SORT,
            );

            const rawCount = response.headers?.["x-total-count"];
            const total = rawCount !== undefined ? Number(rawCount) : undefined;

            const accountActivities = (response.data ?? []).map(a => ({
                id: a.id,
                action: a.action,
                created: a.created,
                modified: a.modified,
                stage: a.stage,
                status: a.status,
                requester: a.requester ? { id: a.requester.id, name: a.requester.name, type: a.requester.type } : undefined,
                recipient: a.recipient ? { id: a.recipient.id, name: a.recipient.name, type: a.recipient.type } : undefined,
                trackingNumber: a.trackingNumber,
                errors: a.errors,
                warnings: a.warnings,
            }));

            return { total, offset, limit, count: accountActivities.length, accountActivities };
        } catch (err: any) {
            if (err instanceof McpError) { throw err; }
            throw new McpError(ErrorCodes.ISC_API_ERROR, String(err?.message ?? err));
        }
    }
}
