import { ISCClient } from "../ISCClient.js";
import { CacheService } from "./CacheService.js";

/**
 * Cache the mapping name->id
 */
export class SourceNameToIdCacheService extends CacheService<string>{
    constructor(readonly client: ISCClient) {
        super(
            async (key: string) => {
                return await client.getSourceId(key);
            }
        );
    }
}