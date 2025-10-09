import { ISCTenantInfo, IscTenantManager } from "isc-mcp-server";
import { TenantService } from "../services/TenantService";
import { EndpointUtils } from "../utils/EndpointUtils";
import { SailPointISCAuthenticationProvider } from "../services/AuthenticationProvider";

/**
 * Class to adapt the tenant configuration to the settings expected by "isc-mcp-server"
 */
export class VSCodeTenantManager implements IscTenantManager {

    constructor(private readonly tenantService: TenantService) {

    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    async getAccessToken(tenantId: string): Promise<{ access_token: string; token_type: string; id_token?: string | undefined; expires_in?: number | undefined; scope?: string | undefined; refresh_token?: string | undefined; }> {
        const session = await SailPointISCAuthenticationProvider.getInstance()
            .getSessionByTenant(tenantId)
        return {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            access_token: session.accessToken,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            token_type: "bearer"
        }
    }

    async getTenants(): Promise<ISCTenantInfo[]> {
        return this.tenantService.getTenants().map(x => ({
            tenantId: x.id,
            tenantName: x.tenantName,
            tenantDisplayName: x.name,
            baseUrl: EndpointUtils.getBaseUrl(x.tenantName)
        }))
    }

}