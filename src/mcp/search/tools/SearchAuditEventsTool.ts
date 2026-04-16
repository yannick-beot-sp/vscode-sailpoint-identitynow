import "reflect-metadata";
import { Tool, ToolContext } from "@frontmcp/sdk";
import { z } from "zod";
import { getIscClient } from "../../plugins/TenantResolverPlugin";
import { ErrorCodes, McpError } from "../../errors";
import { tenantNameField } from "../../inputFields";
import { searchQueryField, offsetField, limitField, sortField } from "../searchInputFields";

const DEFAULT_LIMIT = 250;
const DEFAULT_SORT = "-created";

const inputSchema = z.object({
    tenantName: tenantNameField,
    query: searchQueryField,
    offset: offsetField,
    limit: limitField,
    sort: sortField(DEFAULT_SORT),
});

const outputSchema = z.object({
    total: z.number().optional().describe("Total number of matching audit events (when available)."),
    offset: z.number().describe("Offset used for this result page."),
    limit: z.number().describe("Limit used for this result page."),
    count: z.number().describe("Number of events returned in this response."),
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

/**
 * Searches audit events (index: events) using a Lucene query, with support for
 * offset-based pagination and limits up to 10 000.
 */
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
        const limit = input.limit ?? DEFAULT_LIMIT;

        try {
            const response = await client.paginatedSearchEvents(
                input.query,
                limit,
                offset,
                true, // request total count
                input.sort ?? DEFAULT_SORT,
            );

            const rawCount = response.headers?.["x-total-count"];
            const total = rawCount !== undefined ? Number(rawCount) : undefined;

            const events = (response.data ?? []).map(e => ({
                id: e.id,
                name: e.name,
                created: e.created,
                action: e.action,
                type: e.type,
                actor: e.actor ? { name: e.actor.name } : undefined,
                target: e.target ? { name: e.target.name } : undefined,
                stack: e.stack,
                trackingNumber: e.trackingNumber,
                ipAddress: e.ipAddress,
                operation: e.operation,
                status: e.status,
                technicalName: e.technicalName,
                objects: e.objects,
                attributes: e.attributes,
            }));

            return { total, offset, limit, count: events.length, events };
        } catch (err: any) {
            if (err instanceof McpError) { throw err; }
            throw new McpError(ErrorCodes.ISC_API_ERROR, String(err?.message ?? err));
        }
    }
}
