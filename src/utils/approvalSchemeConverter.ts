import { AccessProfileApprovalScheme, AccessProfileApprovalSchemeApproverTypeEnum, ApprovalSchemeForRole, ApprovalSchemeForRoleApproverTypeEnum } from "sailpoint-api-client";
import { CacheService } from "../services/cache/CacheService";
import { CSV_MULTIVALUE_SEPARATOR } from "../constants";
import { isEmpty } from "./stringUtils";

/**
 * Convert an AccessProfileApprovalScheme in a string for export
 * @param params 
 */
export async function accessProfileApprovalSchemeToStringConverter(
    schemes: AccessProfileApprovalScheme[] | undefined,
    governanceId2Name: CacheService<string>): Promise<string | undefined> {

    return await approvalSchemeToStringConverter(
        schemes,
        governanceId2Name,
        AccessProfileApprovalSchemeApproverTypeEnum.GovernanceGroup);
}

/**
 * Convert an ApprovalSchemeForRole in a string for export
 * @param params 
 */
export async function roleApprovalSchemeToStringConverter(
    schemes: ApprovalSchemeForRole[] | undefined,
    governanceId2Name: CacheService<string>): Promise<string | undefined> {

    return await approvalSchemeToStringConverter(
        schemes,
        governanceId2Name,
        ApprovalSchemeForRoleApproverTypeEnum.GovernanceGroup);
}

export async function approvalSchemeToStringConverter<SchemeEnum>(
    schemes: { 'approverType'?: SchemeEnum; 'approverId'?: string | null; }[] | undefined,
    governanceId2Name: CacheService<string>,
    governanceGroup: SchemeEnum): Promise<string | undefined> {

    if (schemes === undefined) { return undefined; }

    return (await Promise.all(schemes.map(
        async (scheme) => {
            if (scheme.approverType === governanceGroup) {
                return await governanceId2Name.get(scheme.approverId);
            } else {
                return scheme.approverType;
            }
        }
    ))).join(CSV_MULTIVALUE_SEPARATOR);
}


/**
 * Convert a string to AccessProfileApprovalScheme[] for import
 * @param params 
 */
export async function stringToAccessProfileApprovalSchemeConverter(
    schemes: string | undefined,
    governanceId2Name: CacheService<string>): Promise<AccessProfileApprovalScheme[] | undefined> {

    if (schemes === undefined || isEmpty(schemes)) { return undefined; }

    return await Promise.all(schemes.split(CSV_MULTIVALUE_SEPARATOR).map(async (approver) => {

        let approverType: AccessProfileApprovalSchemeApproverTypeEnum;
        let approverId: string | undefined = undefined;
        if (Object.values(AccessProfileApprovalSchemeApproverTypeEnum).includes(approver as AccessProfileApprovalSchemeApproverTypeEnum)) {
            approverType = approver as AccessProfileApprovalSchemeApproverTypeEnum;
        } else {
            approverType = AccessProfileApprovalSchemeApproverTypeEnum.GovernanceGroup;
            approverId = await governanceId2Name.get(approver);
        }
        
        return {
            approverType: approverType,
            approverId: approverId
        };

    }));
}