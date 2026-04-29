import "reflect-metadata";
import { Tool, ToolContext } from "@frontmcp/sdk";
import { z } from "zod";
import { getIscClient } from "../../plugins/TenantResolverPlugin";
import { ErrorCodes, McpError } from "../../errors";
import { tenantNameField } from "../../inputFields";

const inputSchema = z.object({
    tenantName: tenantNameField,
});

const outputSchema = z.object({
    identityAttributes: z.array(
        z.object({
            name: z.string(),
            displayName: z.string().optional(),
        })
    ),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

/**
 * Lists all identity attributes defined in the tenant.
 */
@Tool({
    name: "listIdentityAttributes",
    description: "List all identity attributes defined in the tenant. Returns name and display name for each attribute.",
    inputSchema,
    outputSchema,
    annotations: {
        title: "List Identity Attributes",
        readOnlyHint: true,
    },
})
export class ListIdentityAttributesTool extends ToolContext {
    async execute(input: Input): Promise<Output> {
        const client = getIscClient(this);

        try {
            const attributes = await client.getIdentityAttributes();

            return {
                identityAttributes: attributes.map(a => ({
                    name: a.name,
                    displayName: a.displayName,
                })),
            };
        } catch (err: any) {
            throw new McpError(ErrorCodes.ISC_API_ERROR, String(err?.message ?? err));
        }
    }
}
