import { Uri } from "vscode";
import { RESOURCE_TYPES, URL_PREFIX } from "../constants";
import { posix } from "path";

export function withQuery(baseUrl: string, params: any): string {

    const url = new URL(baseUrl);
    const urlParams: URLSearchParams = new URLSearchParams(url.search);

    Object.keys(params)
        .filter(k => params[k] !== undefined)
        .forEach(k => urlParams.set(k, params[k]));

    url.search = urlParams.toString();
    return url.toString();
}

export function addQueryParams(path: string, params: Record<string, any>): string {
    // Parse the existing URL
    const [basePath, existingQuery] = path.split('?');
    const searchParams = new URLSearchParams(existingQuery);

    // Add new parameters
    Object.entries(params)
        .filter(k => params[k[0]] !== undefined)
        .forEach(([key, value]) => searchParams.set(key, value));

    // Reconstruct the URL
    const newQuery = searchParams.toString();
    return newQuery ? `${basePath}?${newQuery}` : basePath;
}


export function buildResourceUri(params: {
    tenantName: string;
    resourceType: string;
    id: string;
    name?: string | null;
    subResourceType?: string;
    subId?: string;
}) {
    let beta = false
    switch (params.resourceType) {
        case RESOURCE_TYPES.connectorRule:
        case RESOURCE_TYPES.cloudRule:
        case RESOURCE_TYPES.identityAttribute:
        case RESOURCE_TYPES.sourceApps:
            beta = true
            break;
    }

    const name = params.name?.replaceAll("/", "%2F")

    const pathParts = [(beta ? 'beta' : 'v3'),
    params.resourceType,
    params.id,
    params.subResourceType,
    params.subId,
        name].filter(x => !!x)

    return Uri.from({
        scheme: URL_PREFIX,
        authority: params.tenantName,
        path: "/" + pathParts?.join("/")
    })
}
/**
 * Construct the Uri for an ISC resource
 * @param tenantName 
 * @param resourceType 
 * @param id 
 * @param name 
 * @returns 
 */
export function getResourceUri(tenantName: string, resourceType: string, id: string, name: string): Uri {
    const baseUri = Uri.from({ scheme: URL_PREFIX, authority: tenantName, path: '/' });
    name = name?.replaceAll("/", "%2F")
    // ensure all parts are not null
    const prefix = { "source-subtypes": "v2026" }[resourceType] ?? "v2025";
    const pathParts = [prefix,
        resourceType,
        id,
        name].filter(x => !!x)

    // You can pass an array to a rest parameter by using the spread operator
    // cf. https://stackoverflow.com/a/43897911
    return Uri.joinPath(
        baseUri,
        ...pathParts
    );
}


/**
 * Construct the Uri for a Workflow Execution Detail
 * @param tenantName 
 * @param executionId 
 * @returns 
 */
export function getWorkflowExecutionDetailUri(tenantName: string, executionId: string): Uri {
    // NOTE: the returned URI must end with a "label". 
    // In this case, I will use the executionId as this information is not present in the detail itself in contrary to time info
    const baseUri = Uri.from({
        scheme: URL_PREFIX,
        authority: tenantName,
        path: `/beta/workflow-executions/${executionId}/history/${executionId}`
    });
    return baseUri;
}

export function getIdByUri(uri?: Uri): string | null {
    const path = uri?.path || "";
    const found = path.match(/^\/.+\/(.*?)\/.*?$/);
    // Found including the whole match and the group
    // cf. https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/match
    if (found && found.length === 2) {
        return found[1];
    }
    return null;
}

export function getResourceTypeByUri(uri: Uri): string | null {
    const path = uri.path || "";
    const found = path.match(/^\/(.+?)\/.*?\/.*?/);
    // Found including the whole match and the group
    // cf. https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/match
    if (found && found.length === 2) {
        return found[1];
    }
    return null;
}

export function getNameByUri(uri: Uri): string | null {
    const respath = uri.path || "";
    return posix.basename(respath);
}

/**
 * Will remove the "name" part
 * @param uri 
 * @returns 
 */
export function getPathByUri(uri?: Uri): string | null {
    const path = uri?.path || "";
    const found = path.match(/^(\/.+)\/.*?$/);
    // Found including the whole match and the group
    // cf. https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/match
    if (found && found.length === 2) {
        return found[1];
    }
    return null;
}

export function getUIUrl(tenantName: string, ...pathParts: string[]): Uri {

    const baseUri = Uri.from({ scheme: "https", authority: tenantName });

    let fragment: string | undefined;
    // We assume there might be only 1 element with hash
    // Useful for application URL
    const hashIndex = pathParts.findIndex(part => part.startsWith('#'))
    if (hashIndex !== -1) {
        fragment = pathParts[hashIndex].substring(1) // remove '#' as added below
        pathParts.splice(hashIndex, 1)
    }

    // You can pass an array to a rest parameter by using the spread operator
    // cf. https://stackoverflow.com/a/43897911
    const targetUrl = Uri.joinPath(
        baseUri,
        ...pathParts
    );
    return targetUrl.with({ fragment });
}

/**
 * Builds the Web UI url of an ISC resource, given its "kind" (source, workflow, role, etc.).
 * Single source of truth for the per-resource-type path templates, consumed both by
 * ISCTreeItem.ts's getUrl() overrides and by the dependency graph webview.
 */
export function getResourceWebUrl(
    tenantName: string,
    kind: string,
    id: string,
    options?: { parentId?: string; subtype?: string }
): Uri | undefined {
    switch (kind) {
        case "source": return getUIUrl(tenantName, "ui/a/admin/connections/sources", id);
        case "workflow": return getUIUrl(tenantName, "ui/wf/edit", id);
        case "identity-profile": return getUIUrl(tenantName, "ui/ip/admin/identity-profiles", id);
        case "lifecycle-state":
            return options?.parentId
                ? getUIUrl(tenantName, "ui/ip/admin/identity-profiles", options.parentId, "lifecycle-management", id)
                : undefined;
        case "service-desk-integration": return getUIUrl(tenantName, "ui/h/admin/connections/servicedesk", id, "edit");
        case "access-profile": return getUIUrl(tenantName, "ui/a/admin/access/access-profiles/manage", id);
        case "role": return getUIUrl(tenantName, "ui/a/admin/access/roles/manage", id);
        case "dimension":
            return options?.parentId
                ? getUIUrl(tenantName, "ui/a/admin/access/roles/manage", options.parentId, "dimensions", id, "basic-config")
                : undefined;
        case "form-definition": return getUIUrl(tenantName, "ui/a/admin/globals/forms/edit", id);
        case "identity": return getUIUrl(tenantName, "ui/a/admin/identities", id, "details/attributes");
        case "machine-identity":
            return getUIUrl(tenantName, `ui/a/admin/${options?.subtype === "AI Agent" ? "ai-agents" : "machine-identities"}`, id, "details");
        case "application": return getUIUrl(tenantName, "ui/admin", `#admin:apps:${id}`);
        case "campaign": return getUIUrl(tenantName, "ui/a/admin/certifications/campaigns-list/all-campaigns", id);
        default: return undefined;
    }
}

const IDN_RESOURCE_TYPE_BY_KIND: Record<string, string> = {
    source: "sources", transform: "transforms", workflow: "workflows",
    "identity-profile": "identity-profiles", role: "roles",
    "access-profile": "access-profiles", application: "source-apps",
    "identity-attribute": "identity-attributes",
};

/**
 * Builds the internal idn:// Uri of an ISC resource, given its "kind". Single source of truth
 * for resourceType/sub-resource path building, consumed by the dependency graph webview.
 */
export function getResourceUriByKind(
    tenantName: string, kind: string, id: string, label: string,
    options?: { parentId?: string; usageType?: string }
): Uri | undefined {
    if (kind === "dimension") {
        if (!options?.parentId) return undefined;
        const parentUri = getResourceUri(tenantName, "roles", options.parentId, label);
        return parentUri.with({ path: posix.join(getPathByUri(parentUri) || "", "dimensions", id, label) });
    }
    if (kind === "provisioning-policy") {
        if (!options?.parentId || !options?.usageType) return undefined;
        const parentUri = getResourceUri(tenantName, "sources", options.parentId, label);
        return parentUri.with({ path: posix.join(getPathByUri(parentUri) || "", "provisioning-policies", options.usageType, label) });
    }
    const resourceType = IDN_RESOURCE_TYPE_BY_KIND[kind];
    return resourceType ? getResourceUri(tenantName, resourceType, id, label) : undefined;
}
