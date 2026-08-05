import { ProvisioningPolicyDto } from "sailpoint-api-client";

export const PROVISIONING_POLICIES_API_VERSION = "v2";

/**
 * Provisioning policy returned by the ID-based Sources V2 API.
 */
export interface ProvisioningPolicyV2 {
    id: string;
    name: string;
    subtypeId?: string;
    description?: string;
    usageType: string;
    fields?: ProvisioningPolicyDto["fields"];
}

export type CreateProvisioningPolicyV2 = Omit<ProvisioningPolicyV2, "id">;

/**
 * Builds the service-versioned API path used by provisioning policy operations.
 */
export function getProvisioningPoliciesPath(sourceId: string, policyId?: string): string {
    const pathParts = [
        "sources",
        PROVISIONING_POLICIES_API_VERSION,
        sourceId,
        "provisioning-policies",
        policyId
    ].filter((part): part is string => Boolean(part));

    return `/${pathParts.join("/")}`;
}
