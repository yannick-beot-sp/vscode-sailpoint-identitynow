import { ISCClient } from "../ISCClient";
import { CacheService } from "./CacheService";

/**
 * Cache the mapping entitlement id-> Source name|Attribute|Entitlement Name
 */
export class EntitlementIdToSourceNameCacheService extends CacheService<string>{
    constructor(readonly client: ISCClient) {
        super(
            async (id: string) => {
                const entitlement = await client.getEntitlement(id);
                return `${entitlement.source.name}|${entitlement.attribute}|${entitlement.name}`;
            }
        );
    }
}