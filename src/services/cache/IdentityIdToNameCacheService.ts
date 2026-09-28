import { ISCClient } from "../ISCClient.js";
import { CacheService } from "./CacheService.js";

/**
 * Cache the mapping name->id
 */
export class IdentityIdToNameCacheService extends CacheService<string>{
    constructor(readonly client: ISCClient) {
        super(
            async (key: string) => {
                const identity = await client.getPublicIdentityById(key);
                return identity.alias!;
            }
        );
    }
}