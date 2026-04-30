import "reflect-metadata";
import { Tool, ToolContext } from "@frontmcp/sdk";
import { z } from "zod";
import { getIscClient } from "../../plugins/TenantResolverPlugin";
import { ErrorCodes, McpError } from "../../errors";
import { tenantNameField } from "../../inputFields";
import { sourceNameOrIdField } from "../sourcesInputFields";
import { isUuid } from "../../../utils/stringUtils";

const inputSchema = z.object({
    tenantName: tenantNameField,
    sourceNameOrId: sourceNameOrIdField,
});

const attributeSchema = z.object({
    name: z.string(),
    type: z.string().optional(),
    isMultiValued: z.boolean().optional(),
    isEntitlement: z.boolean().optional(),
});

const outputSchema = z.object({
    schemas: z.array(
        z.object({
            id: z.string().optional(),
            name: z.string().optional(),
            nativeObjectType: z.string().optional(),
            identityAttribute: z.string().optional(),
            displayAttribute: z.string().optional(),
            attributes: z.array(attributeSchema).optional(),
        })
    ),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

/**
 * Returns all schemas of a source identified by name or ID.
 */
@Tool({
    name: "getSourceSchemas",
    description: "Get the schemas of a source by name or ID.",
    inputSchema,
    outputSchema,
    annotations: {
        title: "Get Source Schemas",
        readOnlyHint: true,
    },
})
export class GetSourceSchemasTool extends ToolContext {
    async execute(input: Input): Promise<Output> {
        const client = getIscClient(this);

        try {
            let sourceId: string;

            if (isUuid(input.sourceNameOrId)) {
                sourceId = input.sourceNameOrId;
            } else {
                const source = await client.getSourceByName(input.sourceNameOrId);
                sourceId = source.id!;
            }

            const schemas = await client.getSchemas(sourceId);
            return {
                schemas: schemas.map(s => ({
                    id: s.id,
                    name: s.name,
                    nativeObjectType: s.nativeObjectType,
                    identityAttribute: s.identityAttribute,
                    displayAttribute: s.displayAttribute,
                    attributes: s.attributes?.map(a => ({
                        name: a.name!,
                        type: a.type?.toString(),
                        isMultiValued: a.isMulti,
                        isEntitlement: a.isEntitlement,
                    })),
                })),
            };
        } catch (err: any) {
            if (err?.response?.status === 404 || err?.message?.includes("Could not find")) {
                throw new McpError(
                    ErrorCodes.SOURCE_NOT_FOUND,
                    `Source "${input.sourceNameOrId}" not found.`
                );
            }
            throw new McpError(ErrorCodes.ISC_API_ERROR, String(err?.message ?? err));
        }
    }
}
