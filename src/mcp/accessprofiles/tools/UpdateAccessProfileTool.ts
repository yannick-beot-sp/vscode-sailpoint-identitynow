import { Tool, ToolContext } from "@frontmcp/sdk";
import { z } from "zod";
import { EntitlementRef } from "sailpoint-api-client/dist/roles/api.js";
import { getIscClient } from "../../plugins/TenantResolverPlugin.js";
import { ErrorCodes, McpError } from "../../errors.js";
import { tenantNameField } from "../../inputFields.js";
import { isUuid } from "../../../utils/stringUtils.js";
import { resolveIdentity } from "../../utils/identityUtils.js";
import { accessProfileOutputSchema } from "./accessProfileSchemas.js";

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

const outputSchema = accessProfileOutputSchema

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

@Tool({
    name: "updateAccessProfile",
    description:
        "Update an existing access profile in SailPoint ISC using JSON Patch. " +
        "Identify it by id or name, then specify only the fields to change. " +
        "Use searchAccessProfiles to find the id or name before calling this tool.",
    inputSchema: inputSchema.shape,
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
                const ownerId = await resolveIdentity(input.owner, client);
                patches.push({ op: "replace", path: "/owner", value: { id: ownerId, type: "IDENTITY" } });
            }
            if (input.entitlements !== undefined) {
                const entitlementRefs: EntitlementRef[] = input.entitlements.map(id => ({
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
