import { IdentityNowClient } from "../IdentityNowClient";
import { CacheService } from "./CacheService";

/**
 * Cache the governance group name by id
 */
export class GovernanceGroupCacheService extends CacheService<string>{
    constructor(readonly client: IdentityNowClient) {
        super(
            async (key: string) => {
                const group = await client.getGovernanceGroupById(key);
                // cf. https://github.com/sailpoint-oss/typescript-sdk/issues/15
                // @ts-ignore
                return group.name;
            }
        );
    }
}