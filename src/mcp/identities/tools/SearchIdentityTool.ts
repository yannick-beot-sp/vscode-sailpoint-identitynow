import "reflect-metadata";
import { Tool, ToolContext } from "@frontmcp/sdk";
import { z } from "zod";
import { getIscClient } from "../../plugins/TenantResolverPlugin";
import { ErrorCodes, McpError } from "../../errors";
import { tenantNameField } from "../../inputFields";
import { identityQueryField, identitySortField } from "../identityInputFields";

const DEFAULT_SORT = "name";

const inputSchema = z.object({
    tenantName: tenantNameField,
    query: identityQueryField,
    limit: z.number().int().min(1).max(250).optional().describe(
        "Maximum number of results to return. Defaults to 50."
    ),
    sort: identitySortField,
});

const outputSchema = z.object({
    identities: z.array(
        z.object({
            id: z.string(),
            name: z.string(),
            email: z.string().optional(),
        })
    ),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

/**
 * Searches identities using a Lucene query and returns id, name, and email for each match.
 */
@Tool({
    name: "searchIdentities",
    description:
        "Search identities using a Lucene query. " +
        "Returns id, name, and email for each matching identity. " +
        "Query syntax: https://documentation.sailpoint.com/saas/help/search/building-query.html. " +
        "Searchable fields: https://documentation.sailpoint.com/saas/help/search/searchable-fields.html.",
    inputSchema,
    outputSchema,
    annotations: {
        title: "Search Identities",
        readOnlyHint: true,
    },
})
export class SearchIdentityTool extends ToolContext {
    async execute(input: Input): Promise<Output> {
        const client = getIscClient(this);

        try {
            const results = await client.searchAllIdentities(
                input.query,
                input.limit ?? 50,
                ["id", "name", "email"],
                input.sort ?? DEFAULT_SORT,
            );

            const out = {
                identities: results.map(i => ({
                    id: i.id,
                    name: i.name,
                    email: i.email,
                })),
            };
            const result = outputSchema.safeParse(out);
            if (!result.success) {
                console.log(result.error);
            }

            return out;
        } catch (err: any) {
            throw new McpError(ErrorCodes.ISC_API_ERROR, String(err?.message ?? err));
        }
    }
}
