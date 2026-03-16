import "reflect-metadata";
import { Tool, ToolContext } from "@frontmcp/sdk";
import { z } from "zod";
import { getIscClient } from "../../plugins/TenantResolverPlugin";
import { ErrorCodes, McpError } from "../../errors";
import { tenantNameField } from "../../inputFields";
import { identityIdField } from "../identityInputFields";
import { isGuid, isUuid } from "../../../utils/stringUtils";

/** Fields requested from the search API for identity details. */
const DETAIL_FIELDS = [
    "id",
    "name",
    "displayName",
    "email",
    "attributes",
    "accounts",
    "access",

];

const inputSchema = z.object({
    tenantName: tenantNameField,
    identityId: identityIdField,
});

const outputSchema = z.object({
    id: z.string(),
    name: z.string(),
    displayName: z.string().optional(),
    email: z.string().optional(),
    attributes: z.unknown().nullable(),
    accounts: z.array(z.unknown()).nullable(),
    entitlements: z.array(z.unknown()).nullable(),
    accessProfiles: z.array(z.unknown()).nullable(),
    roles: z.array(z.unknown()).nullable(),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

/**
 * Returns the full details of an identity by name or ID,
 * including attributes, accounts, entitlements, access profiles, and roles.
 */
@Tool({
    name: "getIdentity",
    description:
        "Get the full details of an identity by name or ID. " +
        "Returns attributes, accounts, entitlements, access profiles, and roles.",
    inputSchema,
    outputSchema,
    annotations: {
        title: "Get Identity",
        readOnlyHint: true,
    },
})
export class GetIdentityTool extends ToolContext {
    async execute(input: Input): Promise<Output> {
        const client = getIscClient(this);

        const query = isUuid(input.identityId)
            ? `id:${input.identityId}`
            : `name:"${input.identityId}"`;

        try {
            const response = await client.paginatedSearchIdentities(
                query,
                1,
                0,
                false,
                DETAIL_FIELDS,
                true
            );

            const identity = response.data?.[0];
            if (!identity) {
                throw new McpError(
                    ErrorCodes.IDENTITY_NOT_FOUND,
                    `Identity "${input.identityId}" not found.`
                );
            }

            return {
                id: identity.id,
                name: identity.name,
                displayName: identity.displayName,
                email: identity.email,
                attributes: identity.attributes ?? null,
                accounts: identity.accounts ?? null,
                entitlements: identity.access?.filter(x => x.type == "ENTITLEMENT") ?? null,
                accessProfiles: identity.access?.filter(x => x.type == "ACCESS_PROFILE") ?? null,
                roles: identity.access?.filter(x => x.type == "ROLE") ?? null,
            };
        } catch (err: any) {
            if (err instanceof McpError) { throw err; }
            throw new McpError(ErrorCodes.ISC_API_ERROR, String(err?.message ?? err));
        }
    }
}
