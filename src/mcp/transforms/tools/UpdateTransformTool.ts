import "reflect-metadata";
import { Tool, ToolContext } from "@frontmcp/sdk";
import { z } from "zod";
import { getIscClient } from "../../plugins/TenantResolverPlugin";
import { ErrorCodes, McpError } from "../../errors";

/** Matches a UUID / GUID (case-insensitive). */
const GUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const inputSchema = z.object({
    tenantName: z.string().describe(
        "Tenant identifier: full domain, a prefix (e.g. 'company-poc'), or display name."
    ),
    transformName: z.string().describe(
        "Transform name or ID (UUID). When the value matches a GUID pattern the lookup is done by ID; otherwise by name."
    ),
    attributes: z.record(z.string(), z.unknown()).describe(
        "Replacement attributes for the transform. Replaces the entire attributes map."
    ),
});

const outputSchema = z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    attributes: z.record(z.string(), z.unknown()).nullable(),
    status: z.literal("updated"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

/**
 * Updates the attributes of an existing transform identified by name or ID.
 * The transform name and type are preserved; only attributes are replaced.
 */
@Tool({
    name: "updateTransform",
    description:
        "Update the attributes of an existing transform by name or ID. " +
        "The transform name and type cannot be changed. " +
        "UUIDs are resolved by ID; all other values are resolved by name.",
    inputSchema,
    outputSchema,
    annotations: {
        title: "Update Transform",
        readOnlyHint: false,
        destructiveHint: false,
    },
})
export class UpdateTransformTool extends ToolContext {
    async execute(input: Input): Promise<Output> {
        const client = getIscClient(this);

        let existing;
        try {
            existing = GUID_PATTERN.test(input.transformName)
                ? await client.getTransformById(input.transformName)
                : await client.getTransformByName(input.transformName);
        } catch (err: any) {
            throw new McpError(
                ErrorCodes.TRANSFORM_NOT_FOUND,
                `Transform "${input.transformName}" not found.`
            );
        }

        try {
            const updated = await client.updateTransform(existing.id, {
                name: existing.name,
                type: existing.type as any,
                attributes: input.attributes as any,
            });
            return {
                id: updated.id,
                name: updated.name,
                type: updated.type,
                attributes: updated.attributes as Record<string, unknown> | null,
                status: "updated",
            };
        } catch (err: any) {
            throw new McpError(ErrorCodes.ISC_API_ERROR, String(err?.message ?? err));
        }
    }
}
