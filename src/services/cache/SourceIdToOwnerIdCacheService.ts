import { ISCClient } from "../ISCClient.js";
import { CacheService } from "./CacheService.js";

/**
 * Cache the mapping id->name
 */
export class SourceIdToOwnerIdCacheService extends CacheService<string> {
    constructor(readonly client: ISCClient) {
        super(
            async (id: string) => {
                const source = await client.getSourceById(id);
                return source.owner?.id || '';
            }
        );
    }
}