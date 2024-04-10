import { ISCClient } from "../ISCClient";
import { CacheService } from "./CacheService";

/**
 * Cache the mapping name->id
 */
export class AccessProfileNameToIdCacheService extends CacheService<string>{
    constructor(readonly client: ISCClient) {
        super(
            async (key: string) => {
                const ap = await client.getAccessProfileByName(key);
                return ap.id;
            }
        );
    }
}