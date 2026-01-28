import { AccessProfileApprovalScheme, AccessProfileApprovalSchemeV2025ApproverTypeV2025, ApprovalSchemeForRole, ApprovalSchemeForRoleApproverTypeV3, ApprovalSchemeForRoleV2025ApproverTypeV2025 } from "sailpoint-api-client";
import { CacheService } from "../services/cache/CacheService";
import { CSV_MULTIVALUE_SEPARATOR } from "../constants";
import { isEmpty } from "./stringUtils";

/**
 * Convert an AccessProfileApprovalScheme in a string for export
 * @param params 
 */
export async function accessProfileApprovalSchemeToStringConverter(
    schemes: AccessProfileApprovalScheme[] | undefined | null,
    governanceId2Name: CacheService<string>,
    workflowId2Name: CacheService<string>): Promise<string | undefined> {

    return await approvalSchemeToStringConverter(
        schemes,
        governanceId2Name,
        workflowId2Name,
        AccessProfileApprovalSchemeV2025ApproverTypeV2025.GovernanceGroup,
        AccessProfileApprovalSchemeV2025ApproverTypeV2025.Workflow);
}

/**
 * Convert an ApprovalSchemeForRole in a string for export
 * @param params 
 */
export async function roleApprovalSchemeToStringConverter(
    schemes: ApprovalSchemeForRole[] | undefined,
    governanceId2Name: CacheService<string>,
    workflowId2Name: CacheService<string>): Promise<string | undefined> {

    return await approvalSchemeToStringConverter(
        schemes,
        governanceId2Name,
        workflowId2Name,
        ApprovalSchemeForRoleV2025ApproverTypeV2025.GovernanceGroup,
        ApprovalSchemeForRoleV2025ApproverTypeV2025.Workflow);
}

export async function approvalSchemeToStringConverter<SchemeEnum>(
    schemes: { 'approverType'?: SchemeEnum; 'approverId'?: string | null; }[] | undefined | null,
    governanceId2Name: CacheService<string>,
    workflowId2Name: CacheService<string>,
    governanceGroup: SchemeEnum,
    workflow: SchemeEnum): Promise<string | undefined> {

    if (schemes === undefined || schemes === null) { return undefined; }

    return (await Promise.all(schemes.map(
        async (scheme) => {
            if (scheme.approverType === governanceGroup) {
                const name = await governanceId2Name.get(scheme.approverId!);
                return `GOVERNANCE_GROUP:${name}`;
            } else if (scheme.approverType === workflow) {
                const name = await workflowId2Name.get(scheme.approverId!);
                return `WORKFLOW:${name}`;
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
    governanceId2Name: CacheService<string>,
    workflowId2Name: CacheService<string>): Promise<AccessProfileApprovalScheme[] | undefined> {

    if (isEmpty(schemes)) { return new Array<AccessProfileApprovalScheme>; }

    return await Promise.all(schemes.split(CSV_MULTIVALUE_SEPARATOR).map(async (approver) => {

        let approverType: AccessProfileApprovalSchemeV2025ApproverTypeV2025;
        let approverId: string | undefined = undefined;

        if (approver.startsWith("GOVERNANCE_GROUP:")) {
            approverType = AccessProfileApprovalSchemeV2025ApproverTypeV2025.GovernanceGroup;
            const name = approver.substring("GOVERNANCE_GROUP:".length);
            approverId = await governanceId2Name.get(name);
        } else if (approver.startsWith("WORKFLOW:")) {
            approverType = AccessProfileApprovalSchemeV2025ApproverTypeV2025.Workflow;
            const name = approver.substring("WORKFLOW:".length);
            approverId = await workflowId2Name.get(name);
        } else if (Object.values(AccessProfileApprovalSchemeV2025ApproverTypeV2025).includes(approver as AccessProfileApprovalSchemeV2025ApproverTypeV2025)) {
            approverType = approver as AccessProfileApprovalSchemeV2025ApproverTypeV2025;
        } else {
            // Backward compatibility: unprefixed names are governance groups
            approverType = AccessProfileApprovalSchemeV2025ApproverTypeV2025.GovernanceGroup;
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
    governanceId2Name: CacheService<string>,
    workflowId2Name: CacheService<string>): Promise<ApprovalSchemeForRole[] | undefined> {

    if (schemes === undefined || isEmpty(schemes)) { return new Array<ApprovalSchemeForRole>; }

    return await Promise.all(schemes.split(CSV_MULTIVALUE_SEPARATOR).map(async (approver) => {

        let approverType: ApprovalSchemeForRoleApproverTypeV3;
        let approverId: string | undefined = undefined;

        if (approver.startsWith("GOVERNANCE_GROUP:")) {
            approverType = ApprovalSchemeForRoleApproverTypeV3.GovernanceGroup;
            const name = approver.substring("GOVERNANCE_GROUP:".length);
            approverId = await governanceId2Name.get(name);
        } else if (approver.startsWith("WORKFLOW:")) {
            approverType = ApprovalSchemeForRoleApproverTypeV3.Workflow;
            const name = approver.substring("WORKFLOW:".length);
            approverId = await workflowId2Name.get(name);
        } else if (Object.values(ApprovalSchemeForRoleApproverTypeV3).includes(approver as ApprovalSchemeForRoleApproverTypeV3)) {
            approverType = approver as ApprovalSchemeForRoleApproverTypeV3;
        } else {
            // Backward compatibility: unprefixed names are governance groups
            approverType = ApprovalSchemeForRoleApproverTypeV3.GovernanceGroup;
            approverId = await governanceId2Name.get(approver);
        }

        return {
            approverType: approverType,
            approverId: approverId
        };

    }));
}
