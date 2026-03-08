import "reflect-metadata";
import { Tool, ToolContext } from "@frontmcp/sdk";
import { z } from "zod";
import { getIscClient } from "../../plugins/TenantResolverPlugin";
import { tenantNameField } from "../../inputFields";

const inputSchema = z.object({
    tenantName: tenantNameField,
});

const outputSchema = z.object({
    transforms: z.array(
        z.object({
            id:   z.string(),
            name: z.string(),
            type: z.string(),
        })
    ),
});

type Input  = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

/**
 * Lists all transforms for the specified tenant.
 * Results are sorted alphabetically by name.
 */
@Tool({
    name: "listTransforms",
    description: "List all transforms for a given tenant.",
    inputSchema,
    outputSchema,
    annotations: {
        title:        "List Transforms",
        readOnlyHint: true,
    },
})
export class ListTransformsTool extends ToolContext {
    async execute(input: Input): Promise<Output> {
        const client = getIscClient(this);
        const transforms = await client.getTransforms();
        return {
            transforms: transforms.map(t => ({
                id:   t.id,
                name: t.name,
                type: t.type,
            })),
        };
    }
}
