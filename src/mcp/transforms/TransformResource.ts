import "reflect-metadata";
import { ResourceContext, ResourceTemplate } from "@frontmcp/sdk";
import { ISCClient } from "../../services/ISCClient";
import { ErrorCodes, McpError } from "../errors";
import { resolveTenant } from "../utils/tenantResolver";
import { getTenantService } from "../plugins/TenantResolverPlugin";

type TransformParams = { tenantName: string; transformName: string };

@ResourceTemplate({
    name: "transform",
    uriTemplate: "idn://{tenantName}/transforms/{transformName}",
    description: "Returns the full JSON definition of a SailPoint ISC transform.",
    mimeType: "application/json",
})
export class TransformResource extends ResourceContext<TransformParams> {
    async execute(uri: string, params: TransformParams) {
        const { tenantName, transformName } = params;
        const decodedName = decodeURIComponent(transformName);

        const ts = getTenantService();
        const tenant = resolveTenant(ts.getTenants(), tenantName);
        if (!tenant) {
            throw new McpError(ErrorCodes.TENANT_NOT_FOUND, `Tenant "${tenantName}" not found.`);
        }

        console.log(`[INFO] transform_retrieved tenant=${tenant.tenantName} transformName=${decodedName}`);

        const client = new ISCClient(tenant.id, tenant.tenantName);
        try {
            const transform = await client.getTransformByName(decodedName);
            return {
                contents: [{
                    uri,
                    mimeType: "application/json",
                    text: JSON.stringify(transform),
                }],
            };
        } catch (err: any) {
            if (err?.response?.status === 404 || err?.message?.includes("Could not find")) {
                throw new McpError(ErrorCodes.TRANSFORM_NOT_FOUND, `Transform "${decodedName}" not found.`);
            }
            console.error(`[ERROR] ISC API error endpoint=transforms/${decodedName} statusCode=${err?.response?.status ?? "unknown"}`);
            throw new McpError(ErrorCodes.ISC_API_ERROR, String(err?.message ?? err));
        }
    }
}
