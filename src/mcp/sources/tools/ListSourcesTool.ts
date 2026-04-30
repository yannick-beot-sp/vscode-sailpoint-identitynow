import "reflect-metadata";
import { Tool, ToolContext } from "@frontmcp/sdk";
import { z } from "zod";
import { getIscClient } from "../../plugins/TenantResolverPlugin";
import { tenantNameField } from "../../inputFields";

const inputSchema = z.object({
    tenantName: tenantNameField,
});

const outputSchema = z.object({
    sources: z.array(
        z.object({
            id: z.string(),
            name: z.string(),
            connectorName: z.string().optional(),
        })
    ),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

/**
 * Lists all sources for the specified tenant.
 * Results are sorted alphabetically by name.
 */
@Tool({
    name: "listSources",
    description: "List all sources for a given tenant. Returns the id, name and connector name of each source.",
    inputSchema,
    outputSchema,
    annotations: {
        title: "List Sources",
        readOnlyHint: true,
    },
})
export class ListSourcesTool extends ToolContext {
    async execute(input: Input): Promise<Output> {
        const client = getIscClient(this);
        const sources = await client.getSources();
        return {
            sources: sources.map(s => ({
                id: s.id!,
                name: s.name,
                connectorName: s.connectorName,
            })),
        };
    }
}
