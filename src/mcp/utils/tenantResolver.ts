import { TenantInfo } from "../../models/TenantInfo";

/**
 * Resolves a tenant using a best-match algorithm.
 *
 * Matching priority:
 * 1. Exact match on tenantName (full domain, e.g. "company.identitynow.com")
 * 2. Prefix match: tenantName starts with the input followed by "." or "-"
 *    (e.g. "company-poc" matches "company-poc.identitynow-demo.com")
 * 3. Exact match on display name (name field)
 *
 * Returns `undefined` if no match is found or the match is ambiguous.
 */
export function resolveTenant(
    tenants: TenantInfo[],
    input: string
): TenantInfo | undefined {
    const normalized = input.trim().toLowerCase();

    // 1. Exact match on tenantName
    const exact = tenants.filter(t => t.tenantName.toLowerCase() === normalized);
    if (exact.length === 1) { return exact[0]; }
    if (exact.length > 1)   { return undefined; } // ambiguous

    // 2. Prefix match: tenantName starts with input followed by "." or "-"
    const prefix = tenants.filter(t => {
        const tn = t.tenantName.toLowerCase();
        return tn.startsWith(normalized + ".") || tn.startsWith(normalized + "-");
    });
    if (prefix.length === 1) { return prefix[0]; }
    if (prefix.length > 1)   { return undefined; } // ambiguous

    // 3. Exact match on display name
    const byName = tenants.filter(t => t.name.toLowerCase() === normalized);
    if (byName.length === 1) { return byName[0]; }

    return undefined;
}
