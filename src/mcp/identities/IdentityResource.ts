import "reflect-metadata";
import { ResourceContext, ResourceTemplate } from "@frontmcp/sdk";
import { ISCClient } from "../../services/ISCClient";
import { ErrorCodes, McpError } from "../errors";
import { resolveTenant } from "../utils/tenantResolver";
import { getTenantService } from "../plugins/TenantResolverPlugin";
import { isGuid } from "../../utils/stringUtils";

type IdentityParams = { tenantName: string; identityId: string };

/** Fields requested from the search API for the resource. */
const DETAIL_FIELDS = [
    "id",
    "name",
    "displayName",
    "email",
    "attributes",
    "accounts",
    "entitlements",
    "accessProfiles",
    "roles",
];

@ResourceTemplate({
    name: "identity",
    uriTemplate: "idn://{tenantName}/identities/{identityId}",
    description: "Returns the full JSON details of a SailPoint ISC identity, including attributes, accounts, entitlements, access profiles, and roles.",
    mimeType: "application/json",
})
export class IdentityResource extends ResourceContext<IdentityParams> {
    async execute(uri: string, params: IdentityParams) {
        const { tenantName, identityId } = params;
        const decodedId = decodeURIComponent(identityId);

        const ts = getTenantService();
        const tenant = resolveTenant(ts.getTenants(), tenantName);
        if (!tenant) {
            throw new McpError(ErrorCodes.TENANT_NOT_FOUND, `Tenant "${tenantName}" not found.`);
        }

        console.log(`[INFO] identity_retrieved tenant=${tenant.tenantName} identityId=${decodedId}`);

        const client = new ISCClient(tenant.id, tenant.tenantName);
        const query = isGuid(decodedId)
            ? `id:${decodedId}`
            : `name:"${decodedId}"`;

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
                throw new McpError(ErrorCodes.IDENTITY_NOT_FOUND, `Identity "${decodedId}" not found.`);
            }

            return {
                contents: [{
                    uri,
                    mimeType: "application/json",
                    text: JSON.stringify(identity),
                }],
            };
        } catch (err: any) {
            if (err instanceof McpError) { throw err; }
            console.error(`[ERROR] ISC API error endpoint=identities/${decodedId} statusCode=${err?.response?.status ?? "unknown"}`);
            throw new McpError(ErrorCodes.ISC_API_ERROR, String(err?.message ?? err));
        }
    }
}
