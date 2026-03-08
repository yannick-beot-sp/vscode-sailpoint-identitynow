import "reflect-metadata";
import { Tool, ToolContext } from "@frontmcp/sdk";
import { z } from "zod";
import { getIscClient } from "../../plugins/TenantResolverPlugin";
import { ErrorCodes, McpError } from "../../errors";
import { tenantNameField } from "../../inputFields";
import { transformNameField } from "../transformInputFields";

const inputSchema = z.object({
    tenantName: tenantNameField,
    transformName: transformNameField,
});

const outputSchema = z.object({
    status: z.literal("deleted"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

/**
 * Deletes an existing custom transform identified by name.
 * The transform must not be in use by any Identity Profile mapping.
 */
@Tool({
    name: "deleteTransform",
    description:
        "Delete an existing transform by name. " +
        "Fails if the transform is still referenced by an Identity Profile mapping.",
    inputSchema,
    outputSchema,
    annotations: {
        title: "Delete Transform",
        readOnlyHint: false,
        destructiveHint: true,
    },
})
export class DeleteTransformTool extends ToolContext {
    async execute(input: Input): Promise<Output> {
        const client = getIscClient(this);

        let id: string;
        try {
            const transform = await client.getTransformByName(input.transformName);
            id = transform.id;
        } catch (err: any) {
            throw new McpError(
                ErrorCodes.TRANSFORM_NOT_FOUND,
                `Transform "${input.transformName}" not found.`
            );
        }

        try {
            await client.deleteTransformById(id);
            return { status: "deleted" };
        } catch (err: any) {
            throw new McpError(ErrorCodes.ISC_API_ERROR, String(err?.message ?? err));
        }
    }
}
