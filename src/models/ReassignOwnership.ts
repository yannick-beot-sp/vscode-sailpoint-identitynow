import { JsonPatchOperationV2025 } from "sailpoint-api-client";
import { ISCClient } from "../services/ISCClient";

/**
 * Object types whose ownership (or, for the two "Pending..." types, assignment)
 * can be reassigned from one identity to another. Kept in alphabetical order:
 * this is the order shown to the user in the object-type picker.
 */
export const REASSIGNABLE_OBJECT_TYPES = [
    "Access Profiles",
    "Applications",
    "Entitlements",
    "Governance Groups",
    "Identity Profiles",
    "Pending Certification Decisions",
    "Pending Request Decisions",
    "Roles",
    "Sources",
    "Workflows",
] as const;

export type ReassignableObjectType = typeof REASSIGNABLE_OBJECT_TYPES[number];

/**
 * The two "Pending..." types are not owned objects but assigned decisions:
 * reassigning them requires a reason/comment, unlike a plain owner patch.
 */
export const TYPE_REQUIRES_REASON: ReadonlySet<ReassignableObjectType> = new Set([
    "Pending Certification Decisions",
    "Pending Request Decisions",
]);

export interface ReassignableObject {
    id: string;
    name: string;
    description?: string | null;
}

/** WizardContext key holding the objects picked for a given type in "choose" mode. */
export function objectsContextKey(type: ReassignableObjectType): string {
    return `objects::${type}`;
}

/** WizardContext key used to cache the "all" mode listing for a given type, so the
 * pre-check (used to decide whether to even ask for a new owner) and the execution
 * step don't fetch the same objects twice. */
export function allModeCacheKey(type: ReassignableObjectType): string {
    return `allModeObjects::${type}`;
}

export function normalizeToArray<T>(value: T | T[] | undefined): T[] {
    if (value === undefined) {
        return [];
    }
    return Array.isArray(value) ? value : [value];
}

/**
 * Lists the objects of the given type currently owned by (or, for the two
 * "Pending..." types, assigned to) sourceIdentityId.
 */
export async function listOwnedObjects(
    client: ISCClient,
    type: ReassignableObjectType,
    sourceIdentityId: string
): Promise<ReassignableObject[]> {
    switch (type) {
        case "Access Profiles":
            return (await client.getAccessProfiles({ filters: `owner.id eq "${sourceIdentityId}"`, limit: 250 })).data
                .map(x => ({ id: x.id!, name: x.name, description: x.description ?? undefined }));
        case "Applications":
            return (await client.getPaginatedApplications(`owner.id eq "${sourceIdentityId}"`, 250)).data
                .map(x => ({ id: x.id!, name: x.name ?? x.id! }));
        case "Entitlements":
            // getAllEntitlements is already paginated, unlike getEntitlements (250-item cap)
            return (await client.getAllEntitlements(`owner.id eq "${sourceIdentityId}"`))
                .map(x => ({ id: x.id!, name: x.name!, description: x.description }));
        case "Governance Groups":
            // /workgroups has no owner.id filter: list everything and filter client-side
            return (await client.getGovernanceGroups())
                .filter(g => g.owner?.id === sourceIdentityId)
                .map(g => ({ id: g.id!, name: g.name ?? g.id!, description: g.description }));
        case "Identity Profiles":
            // /identity-profiles has no owner.id filter: list everything and filter client-side
            return (await client.getIdentityProfiles())
                .filter(p => p.owner?.id === sourceIdentityId)
                .map(p => ({ id: p.id!, name: p.name ?? p.id!, description: p.description }));
        case "Pending Certification Decisions":
            return (await client.getCertificationsByReviewer(sourceIdentityId, false))
                .map(c => ({ id: c.id!, name: c.name ?? c.id! }));
        case "Pending Request Decisions":
            return (await client.getPendingApprovals(sourceIdentityId))
                .map(a => ({ id: a.id!, name: a.name || a.accessRequestId || a.id! }));
        case "Roles":
            return (await client.getRoles({ filters: `owner.id eq "${sourceIdentityId}"`, limit: 250 })).data
                .map(x => ({ id: x.id!, name: x.name, description: x.description }));
        case "Sources":
            return (await client.getSourcesByOwner(sourceIdentityId))
                .map(x => ({ id: x.id!, name: x.name!, description: x.description }));
        case "Workflows":
            // /workflows has no filters param at all: list everything and filter client-side
            return (await client.getWorflows())
                .filter(w => w.owner?.id === sourceIdentityId)
                .map(w => ({ id: w.id!, name: w.name!, description: w.description }));
    }
}

/**
 * Reassigns a single object of the given type from its current owner to newOwnerId.
 * reason is required (and only used) for the two "Pending..." types.
 */
export async function reassignOne(
    client: ISCClient,
    type: ReassignableObjectType,
    id: string,
    newOwnerId: string,
    reason?: string
): Promise<void> {
    const ownerPatch: Array<JsonPatchOperationV2025> = [{
        op: "replace",
        path: "/owner",
        //@ts-ignore cf. https://github.com/sailpoint-oss/typescript-sdk/issues/18
        value: { type: "IDENTITY", id: newOwnerId },
    }];

    switch (type) {
        case "Access Profiles":
            await client.updateAccessProfile(id, ownerPatch);
            return;
        case "Applications":
            await client.updateApplication(id, ownerPatch);
            return;
        case "Entitlements":
            await client.updateEntitlement(id, ownerPatch);
            return;
        case "Governance Groups":
            await client.updateGovernanceGroup(id, ownerPatch);
            return;
        case "Identity Profiles":
            await client.updateIdentityProfile(id, ownerPatch);
            return;
        case "Roles":
            await client.updateRole(id, ownerPatch);
            return;
        case "Sources":
            await client.updateSource(id, ownerPatch);
            return;
        case "Workflows":
            await client.updateWorkflow(id, ownerPatch);
            return;
        case "Pending Certification Decisions":
            // Reassigning the whole certification away from this reviewer requires
            // "IDENTITY_SUMMARY" -- "ITEM"/"TARGET_SUMMARY" reassign individual
            // access-review items within a certification someone else already reviews.
            await client.reassignCertificationReviewItemsSync({
                id,
                reviewReassignV2025: {
                    reassign: [{ id, type: "IDENTITY_SUMMARY" }],
                    reassignTo: newOwnerId,
                    reason: reason!
                }
            });
            return;
        case "Pending Request Decisions":
            await client.forwardAccessRequestApproval(id, newOwnerId, reason!);
            return;
    }
}
