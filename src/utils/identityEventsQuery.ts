export function quoteLuceneTerm(value: string): string {
    return `"${value.replace(/\\/g, "\\\\").replace(/"/g, "\\\"")}"`;
}

export function buildIdentityEventsSearchQuery(searchTerms: string[]): string {
    const clauses: string[] = [];

    for (const term of searchTerms) {
        if (!term) {
            continue;
        }

        const quoted = quoteLuceneTerm(term);
        clauses.push(
            `actor.name:${quoted}`,
            `target.name:${quoted}`,
            `attributes.identityId:${quoted}`,
            `attributes.targetIdentityId:${quoted}`
        );
    }

    return clauses.length > 0 ? `(${clauses.join(" OR ")})` : "*";
}

export function collectIdentityEventSearchTerms(
    identityId: string,
    identityName: string,
    identity?: { name?: string; displayName?: string; email?: string; alias?: string }
): string[] {
    const terms = new Set<string>([identityId, identityName]);

    if (identity) {
        for (const value of [identity.name, identity.displayName, identity.email, identity.alias]) {
            if (value) {
                terms.add(value);
            }
        }
    }

    return [...terms];
}
