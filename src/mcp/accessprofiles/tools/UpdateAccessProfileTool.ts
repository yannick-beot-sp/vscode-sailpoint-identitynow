import { Tool, ToolContext } from "@frontmcp/sdk";
import { z } from "zod";
import { EntitlementRefV2025 } from "sailpoint-api-client";
import { getIscClient } from "../../plugins/TenantResolverPlugin";
import { ErrorCodes, McpError } from "../../errors";
import { tenantNameField } from "../../inputFields";
import { isUuid } from "../../../utils/stringUtils";
import { accessProfileBaseOutputSchema, refSchema } from "./accessProfileSchemas";

const inputSchema = z.object({
    tenantName: tenantNameField,
    idOrName: z.string().min(1).describe("ID (32-char hex) or current name of the access profile to update."),
    description: z.string().optional().describe("New description."),
    enabled: z.boolean().optional().describe("Whether the access profile is enabled."),
    requestable: z.boolean().optional().describe("Whether the access profile can be requested."),
    owner: z.string().optional().describe("Username (alias) or ID of the new owner identity."),
    entitlements: z.array(z.string()).optional().describe(
        "New list of entitlement IDs. Replaces the existing list. Use searchEntitlements to find IDs."
    ),
});

const outputSchema = accessProfileBaseOutputSchema.extend({
    entitlements: z.array(refSchema).optional().nullable(),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

@Tool({
    name: "updateAccessProfile",
    description:
        "Update an existing access profile in SailPoint ISC using JSON Patch. " +
        "Identify it by id or name, then specify only the fields to change. " +
        "Use searchAccessProfiles to find the id or name before calling this tool.",
    inputSchema,
    outputSchema,
    annotations: {
        title: "Update Access Profile",
        readOnlyHint: false,
        destructiveHint: false,
    },
})
export class UpdateAccessProfileTool extends ToolContext {
    async execute(input: Input): Promise<Output> {
        const client = getIscClient(this);

        try {
            let apId: string;
            if (isUuid(input.idOrName)) {
                apId = input.idOrName;
            } else {
                const ap = await client.getAccessProfileByName(input.idOrName);
                apId = ap.id!;
            }

            const patches: { op: string; path: string; value: any }[] = [];

            if (input.description !== undefined) {
                patches.push({ op: "replace", path: "/description", value: input.description });
            }
            if (input.enabled !== undefined) {
                patches.push({ op: "replace", path: "/enabled", value: input.enabled });
            }
            if (input.requestable !== undefined) {
                patches.push({ op: "replace", path: "/requestable", value: input.requestable });
            }
            if (input.owner !== undefined) {
                let ownerId: string;
                if (isUuid(input.owner)) {
                    ownerId = input.owner;
                } else {
                    const identities = await client.searchAllIdentities(input.owner, 1);
                    if (!identities || identities.length === 0) {
                        throw new McpError(ErrorCodes.INVALID_INPUT, `Identity "${input.owner}" not found.`);
                    }
                    ownerId = identities[0].id;
                }
                patches.push({ op: "replace", path: "/owner", value: { id: ownerId, type: "IDENTITY" } });
            }
            if (input.entitlements !== undefined) {
                const entitlementRefs: EntitlementRefV2025[] = input.entitlements.map(id => ({
                    id,
                    type: "ENTITLEMENT",
                }));
                patches.push({ op: "replace", path: "/entitlements", value: entitlementRefs });
            }

            if (patches.length === 0) {
                throw new McpError(ErrorCodes.INVALID_INPUT, "No fields to update were provided.");
            }

            const updated = await client.updateAccessProfile(apId, patches as any);
            return updated
        } catch (err: any) {
            if (err instanceof McpError) { throw err; }
            throw new McpError(ErrorCodes.ISC_API_ERROR, String(err?.message ?? err));
        }
    }
}
