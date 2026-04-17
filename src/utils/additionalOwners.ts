import { AdditionalOwnerRefV2025 } from "sailpoint-api-client/dist/v2025/api";
import { IdentityIdToNameCacheService } from "../services/cache/IdentityIdToNameCacheService";
import { GovernanceGroupIdToNameCacheService } from "../services/cache/GovernanceGroupIdToNameCacheService";
import { CSV_MULTIVALUE_SEPARATOR } from "../constants";
import { IdentityUsernameToIdCacheService } from "../services/cache/IdentityNameToIdCacheService";
import { GovernanceGroupNameToIdCacheService } from "../services/cache/GovernanceGroupNameToIdCacheService";

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
        // FIX ME
        // For consistency with what was done , I will only return the username of the identity, not the displayName
        /*
        if (owner.name) {
            return owner.name;
        }*/
        if (owner.id) {
            return identityCacheIdToName.get(owner.id);
        }
        return null;
    }));

    return {
        additionalOwners: identityNames?.filter(x=>!!x).join(CSV_MULTIVALUE_SEPARATOR),
        additionalOwnerGovernanceGroup: null
    };
}


export async function resolveAdditionalOwners(
    additionalOwnersRaw: string | undefined,
    additionalOwnerGovernanceGroupRaw: string | undefined,
    identityCacheService: IdentityUsernameToIdCacheService,
    governanceGroupCache: GovernanceGroupNameToIdCacheService
): Promise<Array<AdditionalOwnerRefV2025> | undefined> {
    if (!additionalOwnersRaw && !additionalOwnerGovernanceGroupRaw) {
        return undefined;
    }

    const ownerNames = (additionalOwnersRaw ?? "")
        .split(CSV_MULTIVALUE_SEPARATOR)
        .map((value) => value.trim())
        .filter((value) => value.length > 0);

    const governanceGroupName = additionalOwnerGovernanceGroupRaw?.trim() ?? "";

    if (governanceGroupName && ownerNames.length > 0) {
        throw new Error("Both additionalOwners and additionalOwnerGovernanceGroup are set. Only one is allowed.");
    }

    if (ownerNames.length > 10) {
        throw new Error("Too many additional owners. Maximum is 10 identities.");
    }

    if (governanceGroupName) {
        const groupId = await governanceGroupCache.get(governanceGroupName);
        return [{
            type: "GOVERNANCE_GROUP",
            id: groupId,
            name: governanceGroupName
        }];
    }

    if (ownerNames.length === 0) {
        return [];
    }

    return Promise.all(ownerNames.map(async (name) => {
        const ownerId = await identityCacheService.get(name);
        return {
            type: "IDENTITY",
            id: ownerId
        };
    }));
}