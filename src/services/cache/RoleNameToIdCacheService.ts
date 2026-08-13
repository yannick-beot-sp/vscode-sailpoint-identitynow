import { ISCClient } from "../ISCClient";
import { CacheService } from "./CacheService";

import { RoleV2025 } from '../../sailpointCompat';
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