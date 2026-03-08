import "reflect-metadata";
import { Tool, ToolContext } from "@frontmcp/sdk";
import { z } from "zod";
import { getIscClient } from "../../plugins/TenantResolverPlugin";
import { ErrorCodes, McpError } from "../../errors";
import { tenantNameField } from "../../inputFields";

const inputSchema = z.object({
    tenantName: tenantNameField,
    name: z.string().describe("Unique name for the new transform."),
    type: z.string().describe(
        "Transform type (e.g. 'accountAttribute', 'static', 'concat', 'dateFormat', …)."
    ),
    attributes: z.record(z.string(), z.unknown()).optional().describe(
        "Type-specific attributes for the transform. May be omitted for transforms that require no attributes."
    ),
});

const outputSchema = z.object({
    id:     z.string(),
    status: z.literal("created"),
});

type Input  = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

/**
 * Creates a new custom transform for the specified tenant.
 */
@Tool({
    name: "createTransform",
    description: "Create a new transform for a given tenant.",
    inputSchema,
    outputSchema,
    annotations: {
        title:           "Create Transform",
        readOnlyHint:    false,
        destructiveHint: false,
    },
})
export class CreateTransformTool extends ToolContext {
    async execute(input: Input): Promise<Output> {
        const client = getIscClient(this);

        try {
            const created = await client.createTransform({
                name:       input.name,
                type:       input.type as any,
                attributes: (input.attributes ?? null) as any,
            });
            return { id: created.id, status: "created" };
        } catch (err: any) {
            throw new McpError(ErrorCodes.ISC_API_ERROR, String(err?.message ?? err));
        }
    }
}
