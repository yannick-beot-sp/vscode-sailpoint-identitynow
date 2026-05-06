import { EntitlementRef } from "sailpoint-api-client"
import { CSV_MULTIVALUE_SEPARATOR } from "../constants"
import { CacheService } from "../services/cache/CacheService"
import { SourceNameToIdCacheService } from "../services/cache/SourceNameToIdCacheService"
import { isBlank } from "./stringUtils"
import { EntitlementCacheService, KEY_SEPARATOR } from "../services/cache/EntitlementCacheService"

export async function entitlementToStringConverter(
    entitlementRefs: Array<EntitlementRef> | undefined,
    entitlementToString: CacheService<string>): Promise<string | undefined> {

    if (entitlementRefs === undefined
        || entitlementRefs === null
        || !Array.isArray(entitlementRefs)
        || entitlementRefs.length === 0) {
        return undefined
    }
    return (await Promise.all(entitlementRefs
        .map(ref => entitlementToString.get(ref.id!))))
        .join(CSV_MULTIVALUE_SEPARATOR)
}

/**
 * Convert sourceName|attribute|name or sourceName|name to a Entitlement Reference
 */
export async function stringToEntitlementConverter(
    entitlementStr: string | undefined,
    sourceCacheService: SourceNameToIdCacheService,
    entitlementCacheService: EntitlementCacheService
):Promise<EntitlementRef[]> {
    if (isBlank(entitlementStr)) {
        return []
    }
    return await Promise.all(entitlementStr
        .split(CSV_MULTIVALUE_SEPARATOR)
        .map(async (entitlementStr) => {
            const parts = entitlementStr.split(KEY_SEPARATOR);
            let sourceName: string;
            let entitlementName: string;
            let sourceId: string;
            let entitlementId: string;

            if (parts.length === 3) {
                // New format: sourceName|attribute|name
                let attribute
                [sourceName, attribute, entitlementName] = parts;
                sourceId = await sourceCacheService.get(sourceName);
                entitlementId = await entitlementCacheService.get(
                    [sourceId, attribute, entitlementName].join(KEY_SEPARATOR)
                );
            } else if (parts.length === 2) {
                // Legacy format: sourceName|name
                [sourceName, entitlementName] = parts;
                sourceId = await sourceCacheService.get(sourceName);
                entitlementId = await entitlementCacheService.get(
                    [sourceId, entitlementName].join(KEY_SEPARATOR)
                );
            } else {
                throw new Error(`Invalid entitlement format: ${entitlementStr}`);
            }

            return {
                name: entitlementName,
                id: entitlementId,
                type: "ENTITLEMENT"
            }
        }));
}