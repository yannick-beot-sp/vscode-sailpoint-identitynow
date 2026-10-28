import { isDeepStrictEqual } from "node:util";
import type { Operation } from "fast-json-patch";

/**
 * `PATCH /segments/{id}` is the only way to update a segment (no PUT).
 * Only these top-level properties are patchable.
 */
const PATCHABLE_PROPERTIES = ["name", "description", "owner", "visibilityCriteria", "active"] as const;

/**
 * Objects that can belong to a segment. The values are the resource types used in the API paths.
 */
export type SegmentMemberType = "access-profiles" | "roles" | "entitlements";

/**
 * Builds the JSON Patch to add an object to a segment, or remove it from a segment.
 * `segments` is the current value of the `segments` property of the object (absent or null if none).
 * The whole array is sent, so that the patch is valid whether or not the property already exists.
 * Returns an empty patch when the object is already in the expected state.
 */
export function buildSegmentMembershipPatch(
    segments: string[] | null | undefined,
    segmentId: string,
    action: "add" | "remove"
): Operation[] {
    const current = segments ?? [];
    const isMember = current.includes(segmentId);
    if ((action === "add") === isMember) {
        return [];
    }
    const value = action === "add"
        ? [...current, segmentId]
        : current.filter(id => id !== segmentId);
    return [{
        op: Array.isArray(segments) ? "replace" : "add",
        path: "/segments",
        value,
    }];
}

/**
 * Builds the JSON Patch to apply to a segment.
 *
 * Each patchable property is replaced as a whole when it differs: a granular patch
 * of `/visibilityCriteria/expression/children/0/...` is not reliably supported by the API.
 * A property absent from the edited document is ignored (not removed).
 */
export function buildSegmentPatch(oldData: Record<string, any>, newData: Record<string, any>): Operation[] {
    const operations: Operation[] = [];
    for (const property of PATCHABLE_PROPERTIES) {
        const oldValue = oldData?.[property];
        const newValue = newData?.[property];
        if (newValue === undefined || isDeepStrictEqual(oldValue, newValue)) {
            continue;
        }
        operations.push({
            op: oldValue === undefined ? "add" : "replace",
            path: `/${property}`,
            value: newValue,
        });
    }
    return operations;
}
