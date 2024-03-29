import { IdentityNowClient } from "../IdentityNowClient";
import { CacheService } from "./CacheService";

/**
 * Cache the governance group name by id
 */
export class GovernanceGroupIdToNameCacheService extends CacheService<string>{
    constructor(readonly client: IdentityNowClient) {
        super(
            async (key: string) => {
                const group = await client.getGovernanceGroupById(key);
                return group.name;
            }
        );
    }
}