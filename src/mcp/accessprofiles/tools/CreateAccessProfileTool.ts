import { Tool, ToolContext } from "@frontmcp/sdk";
import { z } from "zod";
import { AccessProfileV2025, EntitlementRefV2025 } from "sailpoint-api-client";
import { getIscClient } from "../../plugins/TenantResolverPlugin";
import { ErrorCodes, McpError } from "../../errors";
import { tenantNameField } from "../../inputFields";
import { isUuid } from "../../../utils/stringUtils";
import { accessProfileBaseOutputSchema } from "./accessProfileSchemas";

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

const outputSchema = accessProfileBaseOutputSchema;

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;


@Tool({
    name: "createAccessProfile",
    description:
        "Create a new access profile in SailPoint ISC. " +
        "Specify the access profile name, source (name or ID), owner (identity alias), and optionally a description, " +
        "enabled flag, requestable flag, and entitlement IDs. " +
        "Use searchSources to find sources, searchEntitlements to discover entitlement IDs, " +
        "and searchIdentities to find the owner before calling this tool.",
    inputSchema,
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
            // Resolve owner identity
            let ownerId: string;
            if (isUuid(input.owner)) {
                ownerId = input.owner;
            } else {
                try {
                    const identities = await client.searchAllIdentities(input.owner, 1);
                    if (!identities || identities.length === 0) {
                        throw new McpError(
                            ErrorCodes.INVALID_INPUT,
                            `Identity "${input.owner}" not found.`
                        );
                    }
                    ownerId = identities[0].id;
                } catch (err: any) {
                    if (err instanceof McpError) { throw err; }
                    throw new McpError(ErrorCodes.ISC_API_ERROR, String(err?.message ?? err));
                }
            }

            // Resolve source
            let sourceId: string;
            if (isUuid(input.source)) {
                sourceId = input.source;
            } else {
                try {
                    sourceId = (await client.getSourceByName(input.source)).id!;
                } catch (err: any) {
                    if (err instanceof McpError) { throw err; }
                    throw new McpError(
                        ErrorCodes.SOURCE_NOT_FOUND,
                        `Source "${input.source}" not found.`
                    );
                }
            }

            const entitlements: EntitlementRefV2025[] | undefined = input.entitlements?.map(id => ({
                id,
                type: "ENTITLEMENT",
            })) ?? [];

            const accessProfilePayload: AccessProfileV2025 = {
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
