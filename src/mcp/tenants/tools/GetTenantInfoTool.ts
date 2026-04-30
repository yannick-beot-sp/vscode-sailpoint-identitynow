import "reflect-metadata";
import { Tool, ToolContext } from "@frontmcp/sdk";
import { z } from "zod";
import { getTenantService } from "../../plugins/TenantResolverPlugin";
import { resolveTenant } from "../../utils/tenantResolver";
import { EndpointUtils } from "../../../utils/EndpointUtils";
import { tenantNameField } from "../../inputFields";
import { ErrorCodes, McpError } from "../../errors";

const inputSchema = z.object({
    tenantName: tenantNameField,
});

const outputSchema = z.object({
    displayName: z.string(),
    tenantName: z.string(),
    baseApiUrl: z.string(),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

@Tool({
    name: "getTenantInfo",
    description: "Get the display name, domain name, and base API URL for a specific tenant.",
    inputSchema,
    outputSchema,
    annotations: {
        title: "Get Tenant Info",
        readOnlyHint: true,
    },
})
export class GetTenantInfoTool extends ToolContext {
    async execute(input: Input): Promise<Output> {
        const ts = getTenantService();
        const tenant = resolveTenant(ts.getTenants(), input.tenantName);

        if (!tenant) {
            throw new McpError(
                ErrorCodes.TENANT_NOT_FOUND,
                `Tenant "${input.tenantName}" not found. Check the tenantName value.`
            );
        }

        return {
            displayName: tenant.name,
            tenantName: tenant.tenantName,
            baseApiUrl: EndpointUtils.getBaseUrl(tenant.tenantName),
        };
    }
}
