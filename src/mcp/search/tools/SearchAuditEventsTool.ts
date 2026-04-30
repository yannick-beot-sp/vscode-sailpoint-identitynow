import "reflect-metadata";
import { Tool, ToolContext } from "@frontmcp/sdk";
import { z } from "zod";
import { getIscClient } from "../../plugins/TenantResolverPlugin";
import { ErrorCodes, McpError } from "../../errors";
import { tenantNameField } from "../../inputFields";
import { DEFAULT_SEARCH_LIMIT, paginationOutputFields, searchQueryField, offsetField, limitField, sortField } from "../searchInputFields";

const DEFAULT_SORT = "-created";

const inputSchema = z.object({
    tenantName: tenantNameField,
    query: searchQueryField,
    offset: offsetField,
    limit: limitField,
    sort: sortField(DEFAULT_SORT),
});

const outputSchema = z.object({
    ...paginationOutputFields,
    events: z.array(
        z.object({
            id: z.string().optional(),
            name: z.string().optional(),
            created: z.string().nullable().optional(),
            action: z.string().optional().describe("Name of the event as displayed in audit reports."),
            type: z.string().optional().describe("Event type."),
            actor: z.object({ name: z.string().optional() }).optional(),
            target: z.object({ name: z.string().optional() }).optional(),
            stack: z.string().optional(),
            trackingNumber: z.string().optional(),
            ipAddress: z.string().optional(),
            operation: z.string().optional(),
            status: z.string().optional(),
            technicalName: z.string().optional().describe("Normalized name in 'objects_operation_status' format."),
            objects: z.array(z.string()).optional(),
            attributes: z.record(z.string(), z.any()).optional(),
        })
    ),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

@Tool({
    name: "searchAuditEvents",
    description:
        "Search audit events (index: events) using a Lucene query. " +
        "Returns id, action, type, actor, target, status, technicalName, and more for each matching event. " +
        "Supports offset-based pagination: use offset + limit to step through large result sets. " +
        "Query syntax: https://documentation.sailpoint.com/saas/help/search/building-query.html. " +
        "Event types: https://documentation.sailpoint.com/saas/help/search/index.html#event-types.",
    inputSchema,
    outputSchema,
    annotations: {
        title: "Search Audit Events",
        readOnlyHint: true,
    },
})
export class SearchAuditEventsTool extends ToolContext {
    async execute(input: Input): Promise<Output> {
        const client = getIscClient(this);
        const offset = input.offset ?? 0;
        const limit = input.limit ?? DEFAULT_SEARCH_LIMIT;

        try {
            const result = await client.paginatedSearchEventsV2025({
                query: input.query,
                sort: input.sort ?? DEFAULT_SORT,
                limit,
                offset,
            })

            return { total: result.total, offset: result.offset, limit: result.limit, count: result.count, events: result.data };
            
        } catch (err: any) {
            if (err instanceof McpError) { throw err; }
            throw new McpError(ErrorCodes.ISC_API_ERROR, String(err?.message ?? err));
        }
    }
}
