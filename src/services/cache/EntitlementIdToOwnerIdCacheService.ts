import { ISCClient } from "../ISCClient.js";
import { CacheService } from "./CacheService.js";

/**
 * Cache the mapping entitlement id-> owner id
 * caching the source owner id for entitlements with no owner
 */
export class EntitlementIdToOwnerIdCacheService extends CacheService<string> {
    constructor(readonly client: ISCClient) {
        super(
            async (id: string) => {
                const entitlement = await client.getEntitlement(id);
                return entitlement.owner?.id || ''
            }
        );
    }
}