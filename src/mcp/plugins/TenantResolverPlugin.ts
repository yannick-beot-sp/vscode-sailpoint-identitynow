import "reflect-metadata";
import { FlowCtxOf, Plugin, ToolHook } from "@frontmcp/sdk";
import { TenantService } from "../../services/TenantService";
import { ISCClient } from "../../services/ISCClient";
import { resolveTenant } from "../utils/tenantResolver";
import { ErrorCodes, McpError } from "../errors";

/**
 * Module-level WeakMap storing the resolved ISCClient for each tool execution
 * context. Keyed by the ToolContext instance, which is per-request.
 */
const iscClientStore = new WeakMap<object, ISCClient>();

/**
 * Retrieves the ISCClient injected for the current tool execution.
 * Call this from within a tool's execute() method using `this` as the key.
 *
 * @throws McpError if the client was not injected (plugin not registered).
 */
export function getIscClient(ctx: object): ISCClient {
    const client = iscClientStore.get(ctx);
    if (!client) {
        throw new McpError(
            ErrorCodes.MCP_INTERNAL_ERROR,
            "ISC client not initialised. Ensure TenantResolverPlugin is registered."
        );
    }
    return client;
}

/** Module-level TenantService reference set by McpServerManager before starting. */
let _tenantService: TenantService | null = null;

/**
 * Registers the TenantService instance used by this plugin.
 * Must be called before the FrontMCP server is started.
 */
export function setTenantService(ts: TenantService): void {
    _tenantService = ts;
}

export function getTenantService(): TenantService {
    return _tenantService
}

/**
 * FrontMCP plugin that:
 * 1. Auto-injects `tenantName` into the tool input when only one tenant is configured
 *    (hook "will" on the `parseInput` stage —  for validation).
 * 2. Resolves the tenant via a best-match algorithm and injects the corresponding
 *    ISCClient into the tool execution context (hook "will" on `validateInput`).
 *
 * Both hooks have `scope: 'server'` so they fire for all apps.
 */
@Plugin({ name: "tenant-resolver", scope: "server" })
export class TenantResolverPlugin {

    /**
     * Stage: parseInput (pre group).
     * Automatically fills tenantName when exactly one tenant is configured,
     * so callers do not need to specify it explicitly in that case.
     */
    @ToolHook.Will("parseInput", { priority: 100 })
    async autoInjectTenantName(ctx: FlowCtxOf<'tools:call-tool'>): Promise<void> {
        if (!_tenantService) { return; }
        const args = ctx.rawInput?.request?.params?.arguments
        if (args && !('tenantName' in args)) {
            const tenants = _tenantService.getTenants();
            if (tenants.length === 1) {
                args.tenantName = tenants[0].tenantName;
            }
        }
    }

    /**
     * Stage: validateInput (execute group).
     * Resolves the tenant and stores the ISCClient in a per-request WeakMap
     * so tools can retrieve it via getIscClient(this).
     */
    @ToolHook.Will("validateInput", { priority: 100 })
    async injectIscClient(ctx: FlowCtxOf<'tools:call-tool'>): Promise<void> {
        if (!_tenantService) { return; }

        const args: Record<string, unknown> = ctx.state?.input?.arguments ?? {};
        const tenantName = ctx.state.input.arguments.tenantName as string | undefined;

        if (!tenantName) {
            throw new McpError(
                ErrorCodes.INVALID_INPUT,
                "tenantName is required when multiple tenants are configured."
            );
        }

        const tenants = _tenantService.getTenants();
        const tenant = resolveTenant(tenants, tenantName);

        if (!tenant) {
            throw new McpError(
                ErrorCodes.TENANT_NOT_FOUND,
                `Tenant "${tenantName}" not found. Check the tenantName value.`
            );
        }

        const toolContext = ctx.state?.toolContext;
        if (toolContext) {
            iscClientStore.set(toolContext, new ISCClient(tenant.id, tenant.tenantName));
        }
    }
}
