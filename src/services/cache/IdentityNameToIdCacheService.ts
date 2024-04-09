import { ISCClient } from "../ISCClient";
import { CacheService } from "./CacheService";

/**
 * Cache the mapping name->id
 */
export class IdentityNameToIdCacheService extends CacheService<string>{
    constructor(readonly client: ISCClient) {
        super(
            async (key: string) => {
                const identity = await client.getPublicIdentityByAlias(key);
                return identity.id;
            }
        );
    }
}