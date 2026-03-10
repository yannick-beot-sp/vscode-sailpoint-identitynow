import "reflect-metadata";
import { ResourceContext, ResourceTemplate } from "@frontmcp/sdk";
import { ISCClient } from "../../services/ISCClient";
import { ErrorCodes, McpError } from "../errors";
import { resolveTenant } from "../utils/tenantResolver";
import { getTenantService } from "../plugins/TenantResolverPlugin";
import { isGuid } from "../../utils/stringUtils";

type WorkflowParams = { tenantName: string; workflowName: string };

@ResourceTemplate({
    name: "workflow",
    uriTemplate: "idn://{tenantName}/workflows/{workflowName}",
    description: "Returns the full JSON definition of a SailPoint ISC workflow.",
    mimeType: "application/json",
})
export class WorkflowResource extends ResourceContext<WorkflowParams> {
    async execute(uri: string, params: WorkflowParams) {
        const { tenantName, workflowName } = params;
        const decodedName = decodeURIComponent(workflowName);

        const ts = getTenantService();
        const tenant = resolveTenant(ts.getTenants(), tenantName);
        if (!tenant) {
            throw new McpError(ErrorCodes.TENANT_NOT_FOUND, `Tenant "${tenantName}" not found.`);
        }

        console.log(`[INFO] workflow_retrieved tenant=${tenant.tenantName} workflowName=${decodedName}`);

        const client = new ISCClient(tenant.id, tenant.tenantName);
        try {
            const workflow = isGuid(decodedName)
                ? await client.getWorflow(decodedName)
                : await client.getWorkflowByName(decodedName);

            return {
                contents: [{
                    uri,
                    mimeType: "application/json",
                    text: JSON.stringify(workflow),
                }],
            };
        } catch (err: any) {
            if (err?.response?.status === 404 || err?.message?.includes("Could not find")) {
                throw new McpError(ErrorCodes.WORKFLOW_NOT_FOUND, `Workflow "${decodedName}" not found.`);
            }
            console.error(`[ERROR] ISC API error endpoint=workflows/${decodedName} statusCode=${err?.response?.status ?? "unknown"}`);
            throw new McpError(ErrorCodes.ISC_API_ERROR, String(err?.message ?? err));
        }
    }
}
