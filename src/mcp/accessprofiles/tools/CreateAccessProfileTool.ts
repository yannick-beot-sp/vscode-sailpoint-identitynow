import { Tool, ToolContext } from "@frontmcp/sdk";
import { z } from "zod";
import { AccessProfile } from "sailpoint-api-client/dist/access_profiles/api.js";
import { EntitlementRef } from "sailpoint-api-client/dist/roles/api.js";
import { getIscClient } from "../../plugins/TenantResolverPlugin.js";
import { ErrorCodes, McpError } from "../../errors.js";
import { tenantNameField } from "../../inputFields.js";
import { resolveIdentity } from "../../utils/identityUtils.js";
import { resolveSource } from "../../utils/sourceUtils.js";
import { accessProfileOutputSchema } from "./accessProfileSchemas.js";

const inputSchema = z.object({
    tenantName: tenantNameField,
    name: z.string().min(1).describe("Name of the access profile."),
    description: z.string().optional().describe("Description of the access profile."),
    enabled: z.boolean().optional().default(true).describe("Whether the access profile is enabled. Defaults to true."),
    requestable: z.boolean().optional().default(false).describe("Whether the access profile can be requested. Defaults to false."),
    source: z.string().min(1).describe("Source name or ID that this access profile belongs to."),
    owner: z.string().min(1).describe("Username (alias) or display name of the identity who owns the access profile."),
    entitlements: z.array(z.string()).optional().describe(
        "Entitlement IDs to include in the access profile. Use searchEntitlements to find entitlement IDs first."
    ),
});

const outputSchema = accessProfileOutputSchema;

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;


@Tool({
    name: "createAccessProfile",
    description:
        "Create a new access profile in SailPoint ISC. " +
        "Specify the access profile name, source (name or ID), owner (identity alias), and optionally a description, " +
        "enabled flag, requestable flag, and entitlement IDs. " +
        "Use listSources to find sources, searchEntitlements to discover entitlement IDs.",
    inputSchema: inputSchema.shape,
    outputSchema,
    annotations: {
        title: "Create Access Profile",
        readOnlyHint: false,
        destructiveHint: false,
    },
})
export class CreateAccessProfileTool extends ToolContext {
    async execute(input: Input): Promise<Output> {
        const client = getIscClient(this);

        try {
            const ownerId = await resolveIdentity(input.owner, client);

            const sourceId = await resolveSource(input.source, client);

            const entitlements: EntitlementRef[] | undefined = input.entitlements?.map(id => ({
                id,
                type: "ENTITLEMENT",
            })) ?? [];

            const accessProfilePayload: AccessProfile = {
                name: input.name,
                description: input.description,
                enabled: input.enabled ?? true,
                requestable: input.requestable ?? false,
                owner: { id: ownerId, type: "IDENTITY" },
                source: { id: sourceId, type: "SOURCE", name: input.source },
                entitlements,
            };

            const created = await client.createAccessProfile(accessProfilePayload);

            return created
        } catch (err: any) {
            if (err instanceof McpError) { throw err; }
            throw new McpError(ErrorCodes.ISC_API_ERROR, String(err?.message ?? err));
        }
    }
}
