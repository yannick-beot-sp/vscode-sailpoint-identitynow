import { IdentityNowClient } from "../IdentityNowClient";
import { CacheService } from "./CacheService";

/**
 * Cache the governance group name by id
 */
export class GovernanceGroupNameToIdCacheService extends CacheService<string>{
    constructor(readonly client: IdentityNowClient) {
        super(
            async (key: string) => {
                const group = await client.getGovernanceGroupByName(key);
                return group.id;
            }
        );
    }
}