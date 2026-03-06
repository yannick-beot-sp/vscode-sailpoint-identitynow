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
        "Transform name or ID (UUID)."
    ),
});

const outputSchema = z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    attributes: z.record(z.string(), z.unknown()).nullable(),
    internal: z.boolean(),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

/**
 * Returns the details of a specific transform identified by name or ID.
 * If the provided value looks like a UUID it is resolved by ID; otherwise by name.
 */
@Tool({
    name: "getTransform",
    description:
        "Get the full details of a transform by name or ID.",
    inputSchema,
    outputSchema,
    annotations: {
        title: "Get Transform",
        readOnlyHint: true,
    },
})
export class GetTransformTool extends ToolContext {
    async execute(input: Input): Promise<Output> {
        const client = getIscClient(this);

        try {
            const transform = GUID_PATTERN.test(input.transformName)
                ? await client.getTransformById(input.transformName)
                : await client.getTransformByName(input.transformName);

            return {
                id: transform.id,
                name: transform.name,
                type: transform.type,
                attributes: transform.attributes as Record<string, unknown> | null,
                internal: transform.internal,
            };
        } catch (err: any) {
            if (err?.response?.status === 404 || err?.message?.includes("Could not find")) {
                throw new McpError(
                    ErrorCodes.TRANSFORM_NOT_FOUND,
                    `Transform "${input.transformName}" not found.`
                );
            }
            throw new McpError(ErrorCodes.ISC_API_ERROR, String(err?.message ?? err));
        }
    }
}
