import { Tool, ToolContext } from "@frontmcp/sdk";
import { z } from "zod";
import {
    AccessProfileRef,
    EntitlementRef,
    RoleMembershipSelector,
    RoleMembershipSelectorType,
    RoleV2025,
} from "sailpoint-api-client";
import { getIscClient } from "../../plugins/TenantResolverPlugin";
import { ErrorCodes, McpError } from "../../errors";
import { tenantNameField } from "../../inputFields";
import { Parser } from "../../../parser/parser";
import { RoleMembershipSelectorConverter } from "../../../parser/RoleMembershipSelectorConverter";
import { SourceNameToIdCacheService } from "../../../services/cache/SourceNameToIdCacheService";
import { isUuid } from "../../../utils/stringUtils";
import { resolveIdentity } from "../../utils/identityUtils";
import { membershipCriteriaField, roleBaseOutputSchema } from "./roleSchemas";

const inputSchema = z.object({
    tenantName: tenantNameField,
    name: z.string().min(1).describe("Name of the role."),
    description: z.string().optional().describe("Description of the role."),
    owner: z.string().min(1).describe("Username (alias) or display name of the identity who owns the role."),
    requestable: z.boolean().optional().default(false).describe("Whether the role can be requested."),
    entitlements: z.array(z.string()).optional().describe(
        "Entitlement IDs to include in the role. Use searchEntitlements to find entitlement IDs first."
    ),
    accessProfiles: z.array(z.string()).optional().describe(
        "Access profile names or IDs to include in the role."
    ),
    membershipCriteria: membershipCriteriaField,
});

const outputSchema = roleBaseOutputSchema;

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

/**
 * Creates a new role in SailPoint ISC.
 */
@Tool({
    name: "createRole",
    description:
        "Create a new role in SailPoint ISC. " +
        "Specify the role name, owner (identity alias), and optionally a description, requestable flag, " +
        "entitlement IDs, access profile names or IDs, and membership criteria. " +
        "Use searchEntitlements and searchAccessProfiles to discover IDs and names before calling this tool.",
    inputSchema,
    outputSchema,
    annotations: {
        title: "Create Role",
        readOnlyHint: false,
        destructiveHint: false,
    },
})
export class CreateRoleTool extends ToolContext {
    async execute(input: Input): Promise<Output> {
        const client = getIscClient(this);

        try {
            const ownerId = await resolveIdentity(input.owner, client);

            // Resolve access profiles
            const accessProfileIds: string[] = [];
            for (const nameOrId of (input.accessProfiles ?? [])) {
                if (isUuid(nameOrId)) {
                    accessProfileIds.push(nameOrId);
                } else {
                    try {
                        const ap = await client.getAccessProfileByName(nameOrId);
                        accessProfileIds.push(ap.id!)
                    } catch {
                        throw new McpError(
                            ErrorCodes.ACCESS_PROFILE_NOT_FOUND,
                            `Access profile not found: "${nameOrId}"`
                        );
                    }
                }
            }

            const accessProfiles: AccessProfileRef[] = accessProfileIds.map(id => ({ id, type: "ACCESS_PROFILE" }))

            // Resolve entitlements (accept IDs only; names are ambiguous across sources)
            const entitlements: EntitlementRef[] = input.entitlements?.map(id => ({
                id,
                type: "ENTITLEMENT",
            })) ?? []

            // Parse membership criteria
            let membership: RoleMembershipSelector | undefined = undefined;
            if (input.membershipCriteria?.trim()) {
                try {
                    const sourceCacheService = new SourceNameToIdCacheService(client);
                    const expression = new Parser().parse(input.membershipCriteria);
                    const converter = new RoleMembershipSelectorConverter(sourceCacheService);
                    await converter.visitExpression(expression, undefined);
                    membership = {
                        type: RoleMembershipSelectorType.Standard,
                        criteria: converter.root,
                    };
                } catch (err: any) {
                    throw new McpError(
                        ErrorCodes.INVALID_INPUT,
                        `Invalid membershipCriteria: ${err?.message ?? err}`
                    );
                }
            }

            const rolePayload: RoleV2025 = {
                name: input.name,
                description: input.description ?? "",
                enabled: true,
                requestable: input.requestable ?? false,
                owner: { id: ownerId, type: "IDENTITY" } as any,
                accessProfiles,
                entitlements,
                membership,
            };

            const created = await client.createRole(rolePayload);

            return {
                id: created.id!,
                name: created.name,
                description: created.description,
                enabled: created.enabled,
                requestable: created.requestable,
                owner: created.owner
                    ? { id: (created.owner as any).id, name: (created.owner as any).name, type: (created.owner as any).type }
                    : undefined,
            };
        } catch (err: any) {
            if (err instanceof McpError) { throw err; }
            throw new McpError(ErrorCodes.ISC_API_ERROR, String(err?.message ?? err));
        }
    }
}
