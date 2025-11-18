import { ISCClient } from "../ISCClient";
import { CacheService } from "./CacheService";

/**
 * Cache the role name by id
 */
export class RoleNameToIdCacheService extends CacheService<string>{
    constructor(readonly client: ISCClient) {
        super(
            async (key: string) => {
                const group = await client.getRoleByName(key);
                return group.id;
            }
        );
    }
}