import { Tool, ToolContext } from "@frontmcp/sdk";
import { z } from "zod";
import { AccessProfileRef, EntitlementRef, RoleMembershipSelector, RoleMembershipSelectorType } from "sailpoint-api-client";
import { getIscClient } from "../../plugins/TenantResolverPlugin";
import { ErrorCodes, McpError } from "../../errors";
import { tenantNameField } from "../../inputFields";
import { Parser } from "../../../parser/parser";
import { RoleMembershipSelectorConverter } from "../../../parser/RoleMembershipSelectorConverter";
import { SourceNameToIdCacheService } from "../../../services/cache/SourceNameToIdCacheService";
import { isUuid } from "../../../utils/stringUtils";
import { membershipCriteriaField, refSchema, roleBaseOutputSchema } from "./roleSchemas";

const inputSchema = z.object({
    tenantName: tenantNameField,
    idOrName: z.string().min(1).describe("ID (32-char hex) or current name of the role to update."),
    description: z.string().optional().describe("New description."),
    enabled: z.boolean().optional().describe("Whether the role is enabled."),
    requestable: z.boolean().optional().describe("Whether the role can be requested."),
    owner: z.string().optional().describe("Username (alias) or ID of the new owner identity."),
    entitlements: z.array(z.string()).optional().describe(
        "New list of entitlement IDs. Replaces the existing list. Use searchEntitlements to find IDs first."
    ),
    accessProfiles: z.array(z.string()).optional().describe(
        "New list of access profile names or IDs. Replaces the existing list."
    ),
    membershipCriteria: membershipCriteriaField,
});

const outputSchema = roleBaseOutputSchema.extend({
    entitlements: z.array(refSchema).optional(),
    accessProfiles: z.array(refSchema).optional(),
    membership: z.object({
        type: z.string().optional(),
        criteria: z.any().optional(),
    }).nullable().optional(),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

@Tool({
    name: "updateRole",
    description:
        "Update an existing role in SailPoint ISC using JSON Patch. " +
        "Identify it by id or name, then specify only the fields to change. " +
        "Use searchRoles to find the id or name before calling this tool.",
    inputSchema,
    outputSchema,
    annotations: {
        title: "Update Role",
        readOnlyHint: false,
        destructiveHint: false,
    },
})
export class UpdateRoleTool extends ToolContext {
    async execute(input: Input): Promise<Output> {
        const client = getIscClient(this);

        try {
            let roleId: string;
            if (isUuid(input.idOrName)) {
                roleId = input.idOrName;
            } else {
                const role = await client.getRoleByName(input.idOrName);
                roleId = role.id!;
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
                    try {
                        const identity = await client.getPublicIdentityByAlias(input.owner);
                        ownerId = identity.id!;
                    } catch (err: any) {
                        if (err instanceof McpError) { throw err; }
                        throw new McpError(ErrorCodes.ISC_API_ERROR, String(err?.message ?? err));
                    }
                }
                patches.push({ op: "replace", path: "/owner", value: { id: ownerId, type: "IDENTITY" } });
            }
            if (input.entitlements !== undefined) {
                const entitlementRefs: EntitlementRef[] = input.entitlements.map(id => ({
                    id,
                    type: "ENTITLEMENT",
                }));
                patches.push({ op: "replace", path: "/entitlements", value: entitlementRefs });
            }
            if (input.accessProfiles !== undefined) {
                const accessProfileIds: string[] = [];
                for (const nameOrId of input.accessProfiles) {
                    if (isUuid(nameOrId)) {
                        accessProfileIds.push(nameOrId);
                    } else {
                        try {
                            const ap = await client.getAccessProfileByName(nameOrId);
                            accessProfileIds.push(ap.id!);
                        } catch {
                            throw new McpError(
                                ErrorCodes.ACCESS_PROFILE_NOT_FOUND,
                                `Access profile not found: "${nameOrId}"`
                            );
                        }
                    }
                }
                const accessProfileRefs: AccessProfileRef[] = accessProfileIds.map(id => ({
                    id,
                    type: "ACCESS_PROFILE",
                }));
                patches.push({ op: "replace", path: "/accessProfiles", value: accessProfileRefs });
            }
            if (input.membershipCriteria !== undefined) {
                let membership: RoleMembershipSelector | null = null;
                if (input.membershipCriteria.trim()) {
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
                patches.push({ op: "replace", path: "/membership", value: membership });
            }

            if (patches.length === 0) {
                throw new McpError(ErrorCodes.INVALID_INPUT, "No fields to update were provided.");
            }

            const updated = await client.updateRole(roleId, patches as any);
            return {
                id: updated.id!,
                name: updated.name,
                description: updated.description,
                enabled: updated.enabled,
                requestable: updated.requestable,
                owner: updated.owner,
                entitlements: updated.entitlements?.map((e: any) => ({
                    id: e.id,
                    name: e.name,
                    type: e.type,
                })),
                accessProfiles: updated.accessProfiles?.map((ap: any) => ({
                    id: ap.id,
                    name: ap.name,
                    type: ap.type,
                })),
                membership: updated.membership
            };
        } catch (err: any) {
            if (err instanceof McpError) { throw err; }
            throw new McpError(ErrorCodes.ISC_API_ERROR, String(err?.message ?? err));
        }
    }
}
