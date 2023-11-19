import { IdentityNowClient } from "../IdentityNowClient";
import { CacheService } from "./CacheService";

/**
 * Cache the mapping id->name
 */
export class SourceIdToNameCacheService extends CacheService<string>{
    constructor(readonly client: IdentityNowClient) {
        super(
            async (id: string) => {
                const source = await client.getSourceById(id);
                return source.name;
            }
        );
    }
}