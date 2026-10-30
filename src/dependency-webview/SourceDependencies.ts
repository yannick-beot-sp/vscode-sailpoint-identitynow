import type { ISCClient } from '../services/ISCClient.js';

/**
 * Detection rules shared by the dependency graph of a source ("View dependencies")
 * and the "Delete with dependencies..." command.
 * Functions are pure and work on plain objects (API objects or SP-Config export objects,
 * which have the same shape for these types), so each caller chooses how to fetch the data.
 */

////////////////
// Transforms
////////////////

/** Visits the transform and all the transforms nested in its attributes */
export function walkTransform(transform: any, visit: (transform: any) => void): void {
    if (!transform || typeof transform !== "object") {
        return;
    }
    visit(transform);
    for (const value of Object.values(transform.attributes ?? {})) {
        if (Array.isArray(value)) {
            value.forEach((v: any) => walkTransform(v, visit));
        } else {
            walkTransform(value, visit);
        }
    }
}

function someTransform(transform: any, predicate: (t: any) => boolean): boolean {
    let found = false;
    walkTransform(transform, t => { found = found || predicate(t); });
    return found;
}

/**
 * A transform references a source through an "accountAttribute" transform whose
 * "sourceName" attribute holds the source's name (not its id). It may be nested.
 */
export function transformReferencesSource(transform: any, sourceName: string): boolean {
    return someTransform(transform, t => t.type === "accountAttribute" && t.attributes?.sourceName === sourceName);
}

/** True if the transform (or a nested one) is a "reference" to one of the transform names */
export function transformReferencesTransforms(transform: any, transformNames: Set<string>): boolean {
    return transformNames.size > 0
        && someTransform(transform, t => t.type === "reference" && transformNames.has(t.attributes?.id));
}

/** Distinct source names pulled from by "accountAttribute" transforms nested in the transform */
export function collectReferencedSourceNames(transform: any): string[] {
    const names = new Set<string>();
    walkTransform(transform, t => {
        if (t.type === "accountAttribute" && typeof t.attributes?.sourceName === "string") {
            names.add(t.attributes.sourceName);
        }
    });
    return Array.from(names);
}

/** Distinct named transforms ("reference" transforms) used in the transform */
export function collectReferencedTransformNames(transform: any): string[] {
    const names = new Set<string>();
    walkTransform(transform, t => {
        if (t.type === "reference" && typeof t.attributes?.id === "string") {
            names.add(t.attributes.id);
        }
    });
    return Array.from(names);
}

export function findTransformsReferencingSource<T>(transforms: T[], sourceName: string): T[] {
    return transforms.filter(t => transformReferencesSource(t, sourceName));
}

////////////////////////////
// Identity profiles
////////////////////////////

export interface ProfileMapping<P = any> {
    profile: P;
    /** the IdentityAttributeTransform */
    mapping: any;
}

/**
 * Identity attribute mappings using the source, directly or through one of the given transforms
 * (by name).
 */
export function findProfileMappings<P extends { identityAttributeConfig?: any }>(
    profiles: P[],
    sourceName: string,
    transformNames: Set<string> = new Set()
): ProfileMapping<P>[] {
    const result: ProfileMapping<P>[] = [];
    for (const profile of profiles) {
        for (const mapping of profile.identityAttributeConfig?.attributeTransforms ?? []) {
            if (transformReferencesSource(mapping.transformDefinition, sourceName)
                || transformReferencesTransforms(mapping.transformDefinition, transformNames)) {
                result.push({ profile, mapping });
            }
        }
    }
    return result;
}

/** Identity profiles whose authoritative source is the source */
export function findAuthoritativeProfiles<P extends { authoritativeSource?: { id?: string } | null }>(
    profiles: P[],
    sourceId: string
): P[] {
    return profiles.filter(p => normalizeId(p.authoritativeSource?.id) === normalizeId(sourceId));
}

////////////////////////
// Identity attributes
////////////////////////

/** Identity attributes having a source coming from the source */
export function findIdentityAttributesUsingSource<A extends { sources?: Array<{ properties?: object }> }>(
    attributes: A[],
    sourceId: string
): A[] {
    return attributes.filter(a =>
        (a.sources ?? []).some(s => normalizeId((s.properties as any)?.applicationId) === normalizeId(sourceId)));
}

////////////////////////////////
// Objects found through the API
////////////////////////////////

export function getSourceAccessProfiles(client: ISCClient, sourceId: string) {
    return client.getAllAccessProfiles(`source.id eq "${sourceId}"`);
}

export function getSourceApplications(client: ISCClient, sourceId: string) {
    return client.getAllApplications(`accountSource.id eq "${sourceId}"`);
}

/** Ids are sometimes dashed GUIDs (SP-Config export) and sometimes not */
export function normalizeId(id: any): string {
    return String(id ?? "").replace(/-/g, "");
}
