import { AccessProfileApprovalSchemeV2025, AccessProfileApprovalSchemeV2025ApproverTypeV2025, ApprovalSchemeForRoleV2025, ApprovalSchemeForRoleV2025ApproverTypeV2025 } from "sailpoint-api-client/dist/v2025";
import { CacheService } from "../services/cache/CacheService";
import { CSV_MULTIVALUE_SEPARATOR } from "../constants";
import { isEmpty } from "./stringUtils";


/**
 * TODO Align once API updated with AccessProfileApprovalSchemeV2025ApproverTypeV2025
 * Note: approval scheme for access profile supersedes approval scheme for roles
 */
const AccessProfileApprovalScheme = {
    AppOwner: "APP_OWNER",
    Owner: "OWNER",
    additionalOwner: "ADDITIONAL_OWNER",
    allOwners: "ALL_OWNERS",
    SourceOwner: "SOURCE_OWNER",
    Manager: "MANAGER",
    GovernanceGroup: "GOVERNANCE_GROUP",
    Workflow: "WORKFLOW"
}

export type AccessProfileApprovalSchemeType = typeof AccessProfileApprovalScheme[keyof typeof AccessProfileApprovalScheme];

/**
 * TODO Align once API updated with ApprovalSchemeForRoleV2025ApproverTypeV2025
 */
const RoleApprovalScheme = {
    Owner: "OWNER",
    additionalOwner: "ADDITIONAL_OWNER",
    allOwners: "ALL_OWNERS",
    Manager: "MANAGER",
    GovernanceGroup: "GOVERNANCE_GROUP",
    Workflow: "WORKFLOW"
}

export type RoleApprovalSchemeType = typeof RoleApprovalScheme[keyof typeof RoleApprovalScheme];

export async function approvalSchemeToStringConverter(
    schemes: { 'approverType'?: AccessProfileApprovalSchemeType; 'approverId'?: string | null; }[] | undefined | null,
    governanceId2Name: CacheService<string>,
    workflowId2Name: CacheService<string>): Promise<string | undefined> {

    if (!schemes) { return undefined; }

    return (await Promise.all(schemes.map(
        async (scheme) => {
            switch (scheme.approverType) {
                case "GOVERNANCE_GROUP":
                    const governanceGroupeName = await governanceId2Name.get(scheme.approverId!)
                    return `GOVERNANCE_GROUP:${governanceGroupeName}`
                case "WORKFLOW":
                    const workflowName = await workflowId2Name.get(scheme.approverId!);
                    return `WORKFLOW:${workflowName}`;
                default:
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
    workflowId2Name: CacheService<string>): Promise<AccessProfileApprovalSchemeV2025[] | undefined> {

    if (isEmpty(schemes)) { return new Array<AccessProfileApprovalSchemeV2025>; }

    return await Promise.all(schemes!.split(CSV_MULTIVALUE_SEPARATOR).map(async (approver) => {

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
        } else if (Object.values(AccessProfileApprovalScheme).includes(approver as AccessProfileApprovalSchemeType)) {
            /**
             * TODO Align once API updated with AccessProfileApprovalSchemeV2025ApproverTypeV2025
            */
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
    workflowId2Name: CacheService<string>): Promise<ApprovalSchemeForRoleV2025[] | undefined> {

    if (!schemes) { return undefined }

    return await Promise.all(schemes.split(CSV_MULTIVALUE_SEPARATOR).map(async (approver) => {

        let approverType: ApprovalSchemeForRoleV2025ApproverTypeV2025;
        let approverId: string | undefined = undefined;

        if (approver.startsWith("GOVERNANCE_GROUP:")) {
            approverType = ApprovalSchemeForRoleV2025ApproverTypeV2025.GovernanceGroup;
            const name = approver.substring("GOVERNANCE_GROUP:".length);
            approverId = await governanceId2Name.get(name);
        } else if (approver.startsWith("WORKFLOW:")) {
            approverType = ApprovalSchemeForRoleV2025ApproverTypeV2025.Workflow;
            const name = approver.substring("WORKFLOW:".length);
            approverId = await workflowId2Name.get(name);
        } else if (Object.values(RoleApprovalScheme).includes(approver as RoleApprovalSchemeType)) {
            approverType = approver as ApprovalSchemeForRoleV2025ApproverTypeV2025;
        } else {
            // Backward compatibility: unprefixed names are governance groups
            approverType = ApprovalSchemeForRoleV2025ApproverTypeV2025.GovernanceGroup;
            approverId = await governanceId2Name.get(approver);
        }

        return {
            approverType: approverType,
            approverId: approverId
        };

    }));
}
