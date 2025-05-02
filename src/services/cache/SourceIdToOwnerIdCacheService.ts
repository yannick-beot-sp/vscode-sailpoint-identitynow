import { ISCClient } from "../ISCClient";
import { CacheService } from "./CacheService";

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