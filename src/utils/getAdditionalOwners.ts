import { AdditionalOwnerRefV2025 } from "sailpoint-api-client/dist/v2025/api";
import { IdentityIdToNameCacheService } from "../services/cache/IdentityIdToNameCacheService";
import { GovernanceGroupIdToNameCacheService } from "../services/cache/GovernanceGroupIdToNameCacheService";
import { CSV_MULTIVALUE_SEPARATOR } from "../constants";

export async function getAdditionalOwners(
    additionalOwners: AdditionalOwnerRefV2025[] | undefined | null,
    identityCacheIdToName: IdentityIdToNameCacheService,
    governanceGroupCacheIdToName: GovernanceGroupIdToNameCacheService
): Promise<{ additionalOwners: string | null; additionalOwnerGovernanceGroup: string | null }> {
    if (!additionalOwners || additionalOwners.length === 0) {
        return { additionalOwners: null, additionalOwnerGovernanceGroup: null };
    }

    const governanceGroupOwner = additionalOwners.find((owner) => owner.type === "GOVERNANCE_GROUP");
    if (governanceGroupOwner?.id) {
        const governanceGroupName = governanceGroupOwner.name ?? await governanceGroupCacheIdToName.get(governanceGroupOwner.id);
        return { additionalOwners: null, additionalOwnerGovernanceGroup: governanceGroupName };
    }

    const identityNames = await Promise.all(additionalOwners.map(async (owner) => {
        if (owner.name) {
            return owner.name;
        }
        if (owner.id) {
            return identityCacheIdToName.get(owner.id);
        }
        return null;
    }));

    const filteredNames = identityNames.filter((name): name is string => !!name);
    return {
        additionalOwners: filteredNames.length ? filteredNames.join(CSV_MULTIVALUE_SEPARATOR) : null,
        additionalOwnerGovernanceGroup: null
    };
}