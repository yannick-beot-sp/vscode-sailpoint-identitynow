import "reflect-metadata";
import { Tool, ToolContext } from "@frontmcp/sdk";
import { z } from "zod";
import { bypassTenantResolver, getTenantService } from "../../plugins/TenantResolverPlugin";
import { EndpointUtils } from "../../../utils/EndpointUtils";

bypassTenantResolver("listTenants");

const inputSchema = z.object({});

const outputSchema = z.object({
    tenants: z.array(
        z.object({
            displayName: z.string(),
            tenantName: z.string(),
            baseApiUrl: z.string(),
        })
    ),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

@Tool({
    name: "listTenants",
    description: "List all configured tenants with their display name, domain name, and base API URL.",
    inputSchema,
    outputSchema,
    annotations: {
        title: "List Tenants",
        readOnlyHint: true,
    },
})
export class ListTenantsTool extends ToolContext {
    async execute(_input: Input): Promise<Output> {
        const ts = getTenantService();
        if (!ts) {
            return { tenants: [] };
        }
        const tenants = ts.getTenants();
        return {
            tenants: tenants.map(t => ({
                displayName: t.name,
                tenantName: t.tenantName,
                baseApiUrl: EndpointUtils.getBaseUrl(t.tenantName),
            })),
        };
    }
}
