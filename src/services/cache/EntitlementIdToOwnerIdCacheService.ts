import { ISCClient } from "../ISCClient";
import { CacheService } from "./CacheService";
import { SourceIdToOwnerIdCacheService } from "./SourceIdToOwnerIdCacheService";

/**
 * Cache the mapping entitlement id-> owner id
 * caching the source owner id for entitlements with no owner
 */
export class EntitlementIdToSourceNameCacheService extends CacheService<string> {
    constructor(readonly client: ISCClient) {
        super(
            async (id: string) => {
                const entitlement = await client.getEntitlement(id);
                return entitlement.owner?.id || ''
            }
        );
    }
}