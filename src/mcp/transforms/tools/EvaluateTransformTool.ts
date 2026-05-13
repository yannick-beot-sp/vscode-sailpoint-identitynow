import "reflect-metadata";
import { Tool, ToolContext } from "@frontmcp/sdk";
import { z } from "zod";
import { getIscClient } from "../../plugins/TenantResolverPlugin";
import { ErrorCodes, McpError } from "../../errors";
import { tenantNameField } from "../../inputFields";
import { transformNameField } from "../transformInputFields";
import { resolveIdentity } from "../../utils/identityUtils";

const IDENTITY_ATTRIBUTE = "uid";

const inputSchema = z.object({
    tenantName: tenantNameField,
    identity: z.string().describe(
        "ID or name of the identity to evaluate the transform for. " +
        "Accepts either a 32-character hexadecimal ID (e.g. 'f142565e845049c2bcad8931def5fcd6') " +
        "or an exact identity name (e.g. 'john.doe')."
    ),
    transformName: transformNameField,
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
 * Evaluates a transform for a given identity by ID or name.
 * If an ID is provided, it is used directly. Otherwise, resolves the identity ID
 * from the provided name, then calls the identity preview API using the transform as a reference.
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

        const identityId = await resolveIdentity(input.identity, client);

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
                return { errors: attr.errorMessages?.map(x => x.text).filter(x => x !== undefined) ?? ["Could not evaluate the transform"] };
            }
            return { value: attr?.value as string ?? null };
        } catch (err: any) {
            throw new McpError(ErrorCodes.ISC_API_ERROR, String(err?.message ?? err));
        }
    }
}
