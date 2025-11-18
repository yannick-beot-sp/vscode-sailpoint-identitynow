import { RoleV2025 } from "sailpoint-api-client";
import { ISCClient } from "../ISCClient";
import { CacheService } from "./CacheService";

/**
 * Cache the role name by id
 */
export class RoleNameToIdCacheService extends CacheService<RoleV2025>{
    constructor(readonly client: ISCClient) {
        super(
            async (key: string) => {
                const role = await client.getRoleByName(key);
                return role;
            }
        );
    }
}