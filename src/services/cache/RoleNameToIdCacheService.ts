import { Role } from "sailpoint-api-client/dist/roles/api.js";
import { ISCClient } from "../ISCClient.js";
import { CacheService } from "./CacheService.js";

/**
 * Cache the role name by id
 */
export class RoleNameToIdCacheService extends CacheService<Role>{
    constructor(readonly client: ISCClient) {
        super(
            async (key: string) => {
                const role = await client.getRoleByName(key);
                return role;
            }
        );
    }
}