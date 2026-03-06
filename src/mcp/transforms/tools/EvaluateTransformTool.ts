import "reflect-metadata";
import { Tool, ToolContext } from "@frontmcp/sdk";
import { z } from "zod";
import { getIscClient } from "../../plugins/TenantResolverPlugin";
import { ErrorCodes, McpError } from "../../errors";

const IDENTITY_ATTRIBUTE = "uid";

const inputSchema = z.object({
    tenantName: z.string().describe(
        "Tenant identifier: full domain, a prefix (e.g. 'company-poc'), or display name."
    ),
    identityName: z.string().describe(
        "Name of the identity to evaluate the transform for (e.g. 'john.doe'). " +
        "The identity is resolved by searching for an exact name match."
    ),
    transformName: z.string().describe(
        "Name of the transform to evaluate."
    ),
});

const outputSchema = z.object({
    value: z.string().nullable().optional().describe(
        "The computed value of the transform for the given identity."
    ),
    errors: z.array(z.string()).optional().describe(
        "Error messages returned when the transform could not be evaluated."
    ),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

/**
 * Evaluates a transform for a given identity by name.
 * Resolves the identity ID from the provided name, then calls the identity preview API
 * using the transform as a reference.
 */
@Tool({
    name: "evaluateTransform",
    description:
        "Evaluate a transform for a given identity. " +
        "Returns the computed value or error messages if the transform could not be evaluated.",
    inputSchema,
    outputSchema,
    annotations: {
        title: "Evaluate Transform",
        readOnlyHint: true,
    },
})
export class EvaluateTransformTool extends ToolContext {
    async execute(input: Input): Promise<Output> {
        const client = getIscClient(this);

        // Resolve identity by name
        let identityId: string;
        try {
            const identities = await client.searchIdentities(input.identityName, 1);
            if (!identities || identities.length === 0) {
                throw new McpError(
                    ErrorCodes.INVALID_INPUT,
                    `Identity "${input.identityName}" not found.`
                );
            }
            identityId = identities[0].id;
        } catch (err: any) {
            if (err instanceof McpError) { throw err; }
            throw new McpError(ErrorCodes.ISC_API_ERROR, String(err?.message ?? err));
        }

        // Evaluate the transform via identity preview
        try {
            const result = await client.getIdentityPreview(
                identityId,
                [{
                    identityAttributeName: IDENTITY_ATTRIBUTE,
                    transformDefinition: {
                        type: "reference",
                        attributes: {
                            id: input.transformName,
                        },
                    },
                }]
            );

            const attr = result?.previewAttributes?.find(x => x.name === IDENTITY_ATTRIBUTE);
            if (attr?.errorMessages && attr.errorMessages.length > 0) {
                return { errors: attr.errorMessages.map(x => x.text) };
            }
            return { value: attr?.value as string ?? null };
        } catch (err: any) {
            throw new McpError(ErrorCodes.ISC_API_ERROR, String(err?.message ?? err));
        }
    }
}
