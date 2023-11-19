import { IdentityNowClient } from "../IdentityNowClient";
import { CacheService } from "./CacheService";

/**
 * Cache the mapping "Source ID"+"Entitlement Name"->Entitlement Id
 */

export const KEY_SEPARATOR = "|";

export class EntitlementCacheService extends CacheService<string>{
    constructor(readonly client: IdentityNowClient) {
        super(
            async (key: string) => {
                const [sourceId, entitlementName] = key.split(KEY_SEPARATOR);
                const entitlement = await client.getEntitlementByName(sourceId, entitlementName);
                return entitlement.id;
            }
        );
    }
}