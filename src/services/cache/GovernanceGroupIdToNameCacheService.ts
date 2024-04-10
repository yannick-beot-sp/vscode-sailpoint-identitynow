import { ISCClient } from "../ISCClient";
import { CacheService } from "./CacheService";

/**
 * Cache the governance group name by id
 */
export class GovernanceGroupIdToNameCacheService extends CacheService<string>{
    constructor(readonly client: ISCClient) {
        super(
            async (key: string) => {
                const group = await client.getGovernanceGroupById(key);
                return group.name;
            }
        );
    }
}