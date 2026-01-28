import { ISCClient } from "../ISCClient";
import { CacheService } from "./CacheService";

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