import { ISCClient } from "../ISCClient";
import { CacheService } from "./CacheService";

/**
 * Cache the mapping "Source ID"+"Entitlement Name"->Entitlement Id
 */

export const KEY_SEPARATOR = "|";

export class EntitlementCacheService extends CacheService<string> {
    constructor(readonly client: ISCClient) {
        super(
            async (key: string) => {
                const parts = key.split(KEY_SEPARATOR);
                let sourceId, attribute, name
                if (parts.length === 2 || parts.length === 3) {
                    [sourceId, attribute, name] = parts;
                    if (!name) {
                        // old format source|name
                        name = attribute
                        attribute = undefined
                    }
                    const entitlement = await client.getEntitlementByName(sourceId, name, attribute);
                    return entitlement.id;
                } else {
                    throw new Error(`Invalid entitlement cache key format: ${key}`);
                }
            }
        );
    }
}