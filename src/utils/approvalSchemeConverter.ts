import { AccessProfileApprovalScheme, AccessProfileApprovalSchemeApproverTypeEnum } from "sailpoint-api-client";
import { CacheService } from "../services/cache/CacheService";
import { CSV_MULTIVALUE_SEPARATOR } from "../constants";

/**
 * Convert an AccessProfileApprovalScheme in a string for export
 * @param params 
 */
export async function accessProfileApprovalSchemeConverter(
    schemes: AccessProfileApprovalScheme[] | undefined,
    governanceId2Name: CacheService<string>): Promise<string | undefined> {
    if (schemes === undefined) { return undefined; }

    return (Promise.all(schemes.map(
        async (scheme) => {
            if (scheme.approverType === AccessProfileApprovalSchemeApproverTypeEnum.GovernanceGroup) {
                return await governanceId2Name.get(scheme.approverId);
            } else {
                return scheme.approverType;
            }
        }
    ))).then(schemes => { return schemes.join(CSV_MULTIVALUE_SEPARATOR); });

}
