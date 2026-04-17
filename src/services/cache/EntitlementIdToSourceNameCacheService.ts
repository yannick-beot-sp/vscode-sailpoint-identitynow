import { ISCClient } from "../ISCClient";
import { CacheService } from "./CacheService";

/**
 * Cache the mapping entitlement id-> Source name|Attribute|Entitlement Name
 * To be used during role export
 */
export class EntitlementIdToSourceNameCacheService extends CacheService<string>{
    constructor(readonly client: ISCClient) {
        super(
            async (id: string) => {
                const entitlement = await client.getEntitlement(id);
                return `${entitlement.source?.name}|${entitlement.attribute}|${entitlement.name}`;
            }
        );
    }
}

/**
 * Cache the mapping entitlement id-> Attribute|Entitlement Name
 * To be used during access profile export
 */
export class EntitlementIdToAttributeNameCacheService extends CacheService<string>{
    constructor(readonly client: ISCClient) {
        super(
            async (id: string) => {
                const entitlement = await client.getEntitlement(id);
                return `${entitlement.attribute}|${entitlement.name}`;
            }
        );
    }
}