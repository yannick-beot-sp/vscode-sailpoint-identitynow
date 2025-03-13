import { AccessProfileApprovalScheme, AccessProfileApprovalSchemeApproverTypeV3, ApprovalSchemeForRole, ApprovalSchemeForRoleApproverTypeV3 } from "sailpoint-api-client";
import { CacheService } from "../services/cache/CacheService";
import { CSV_MULTIVALUE_SEPARATOR } from "../constants";
import { isEmpty } from "./stringUtils";

/**
 * Convert an AccessProfileApprovalScheme in a string for export
 * @param params 
 */
export async function accessProfileApprovalSchemeToStringConverter(
    schemes: AccessProfileApprovalScheme[] | undefined | null,
    governanceId2Name: CacheService<string>): Promise<string | undefined> {

    return await approvalSchemeToStringConverter(
        schemes,
        governanceId2Name,
        AccessProfileApprovalSchemeApproverTypeV3.GovernanceGroup);
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
        ApprovalSchemeForRoleApproverTypeV3.GovernanceGroup);
}

export async function approvalSchemeToStringConverter<SchemeEnum>(
    schemes: { 'approverType'?: SchemeEnum; 'approverId'?: string | null; }[] | undefined | null,
    governanceId2Name: CacheService<string>,
    governanceGroup: SchemeEnum): Promise<string | undefined> {

    if (schemes === undefined || schemes === null) { return undefined; }

    return (await Promise.all(schemes.map(
        async (scheme) => {
            if (scheme.approverType === governanceGroup) {
                return await governanceId2Name.get(scheme.approverId!);
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

    if (isEmpty(schemes)) { return new Array<AccessProfileApprovalScheme>; }

    return await Promise.all(schemes.split(CSV_MULTIVALUE_SEPARATOR).map(async (approver) => {

        let approverType: AccessProfileApprovalSchemeApproverTypeV3;
        let approverId: string | undefined = undefined;
        if (Object.values(AccessProfileApprovalSchemeApproverTypeV3).includes(approver as AccessProfileApprovalSchemeApproverTypeV3)) {
            approverType = approver as AccessProfileApprovalSchemeApproverTypeV3;
        } else {
            approverType = AccessProfileApprovalSchemeApproverTypeV3.GovernanceGroup;
            approverId = await governanceId2Name.get(approver);
        }

        return {
            approverType: approverType,
            approverId: approverId
        };

    }));
}
/**
 * Convert a string to ApprovalSchemeForRole[] for import
 * Very difficult to work with generics and Enums... So I've just duplicated stringToAccessProfileApprovalSchemeConverter & stringToRoleApprovalSchemeConverter
 * @param params 
 */
export async function stringToRoleApprovalSchemeConverter(
    schemes: string | undefined,
    governanceId2Name: CacheService<string>): Promise<ApprovalSchemeForRole[] | undefined> {

    if (schemes === undefined || isEmpty(schemes)) { return new Array<ApprovalSchemeForRole>; }

    return await Promise.all(schemes.split(CSV_MULTIVALUE_SEPARATOR).map(async (approver) => {

        let approverType: ApprovalSchemeForRoleApproverTypeV3;
        let approverId: string | undefined = undefined;
        if (Object.values(ApprovalSchemeForRoleApproverTypeV3).includes(approver as ApprovalSchemeForRoleApproverTypeV3)) {
            approverType = approver as ApprovalSchemeForRoleApproverTypeV3;
        } else {
            approverType = ApprovalSchemeForRoleApproverTypeV3.GovernanceGroup;
            approverId = await governanceId2Name.get(approver);
        }

        return {
            approverType: approverType,
            approverId: approverId
        };

    }));
}
