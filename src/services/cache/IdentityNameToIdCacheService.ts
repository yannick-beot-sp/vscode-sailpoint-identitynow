import { ISCClient } from "../ISCClient";
import { CacheService } from "./CacheService";

/**
 * Cache the mapping username->id
 */
export class IdentityUsernameToIdCacheService extends CacheService<string>{
    constructor(readonly client: ISCClient) {
        super(
            async (key: string) => {
                const identity = await client.getPublicIdentityByAlias(key);
                return identity.id!;
            }
        );
    }
}

/**
 * Cache the mapping username->id
 * FIXME: cannot be used as the use of "name" in the filter returns a 400 'Invalid filter properties: "[name]". Properties are not queryable.'
 */
export class IdentityNameToIdCacheService extends CacheService<string>{
    constructor(readonly client: ISCClient) {
        super(
            async (key: string) => {
                const identity = await client.getPublicIdentityByUsernameOrDisplayName(key);
                return identity.id!;
            }
        );
    }
}