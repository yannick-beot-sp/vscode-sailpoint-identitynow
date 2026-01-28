import { EntitlementRef } from "sailpoint-api-client"
import { CSV_MULTIVALUE_SEPARATOR } from "../constants"
import { CacheService } from "../services/cache/CacheService"

export async function entitlementToStringConverter(
    entitlementRefs: Array<EntitlementRef> | null | undefined,
    entitlementToString: CacheService<string>): Promise<string | undefined> {

    if (entitlementRefs === undefined
        || entitlementRefs === null
        || !Array.isArray(entitlementRefs)
        || entitlementRefs.length === 0) {
        return undefined
    }
    return (await Promise.all(entitlementRefs
        .map(ref => entitlementToString.get(ref.id))))
        .join(CSV_MULTIVALUE_SEPARATOR)
}