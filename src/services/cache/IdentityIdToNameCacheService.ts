import { IdentityNowClient } from "../IdentityNowClient";
import { CacheService } from "./CacheService";

/**
 * Cache the mapping name->id
 */
export class IdentityIdToNameCacheService extends CacheService<string>{
    constructor(readonly client: IdentityNowClient) {
        super(
            async (key: string) => {
                const identity = await client.getPublicIdentityById(key);
                return identity.alias;
            }
        );
    }
}