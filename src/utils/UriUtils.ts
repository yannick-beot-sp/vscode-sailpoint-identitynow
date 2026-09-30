import { Uri } from "vscode";
import { URL_PREFIX } from "../constants.js";
import { posix } from "path";
import { getProvisioningPoliciesPath } from "../models/ProvisioningPolicy.js";

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


function apiVersionFor(resourceType: string): string {
    const service = resourceType.split("/")[0];
    // v1 is deprecated. The current get/update contract is v2.
    if (resourceType === "access-request-config" || service === "access-request-config") {
        return "v2";
    }
    return "v1";
}

/**
 * `{service}/vN/.../{id}` with the version after the service name.
 * A resource type that already contains slashes (`accounts/search-attribute-config`,
 * `criteria-config/privilege`) keeps those segments after the version.
 */
function versionedResourceSegments(resourceType: string, ...segments: Array<string | null | undefined>): string[] {
    const [service, ...tail] = resourceType.split("/").filter(part => !!part);
    return [service, apiVersionFor(resourceType), ...tail, ...segments].filter((part): part is string => !!part);
}

export function buildResourceUri(params: {
    tenantName: string;
    resourceType: string;
    id: string;
    name?: string | null;
    subResourceType?: string;
    subId?: string;
}) {
    const name = params.name?.replaceAll("/", "%2F")
    const pathParts = versionedResourceSegments(
        params.resourceType,
        params.id,
        params.subResourceType,
        params.subId,
        name
    )

    return Uri.from({
        scheme: URL_PREFIX,
        authority: params.tenantName,
        path: editorPath(params.tenantName, pathParts)
    })
}

/**
 * VS Code does not show the authority of a custom scheme in the breadcrumb,
 * tab description, or path label. Repeat the tenant hostname as the first
 * path segment so the open file shows which tenant it belongs to.
 * The object name stays last so it is the editor tab title.
 * Authority remains the hostname used by the extension to resolve the tenant.
 */
function editorPath(tenantName: string, segments: string[]): string {
    const parts = [tenantName, ...segments].filter(part => !!part);
    return "/" + parts.join("/");
}

/**
 * Drop the visible tenant segment. The remainder is the API path.
 * URIs opened before that segment existed are left unchanged.
 */
function pathWithoutTenant(uri?: Uri): string {
    const path = uri?.path ?? "";
    const tenant = uri?.authority;
    if (!tenant) {
        return path;
    }
    const prefix = `/${tenant}`;
    if (path.length < prefix.length || path.slice(0, prefix.length).toLowerCase() !== prefix.toLowerCase()) {
        return path;
    }
    const rest = path.slice(prefix.length);
    if (rest === "") {
        return "/";
    }
    if (!rest.startsWith("/")) {
        return path;
    }
    return rest;
}

/**
 * Construct the Uri for an ISC resource.
 * Authority is the tenant hostname (unique in the tenant list), never the tenant id.
 * The same hostname is the first path segment so the editor shows the tenant.
 * The object name stays last so it is the editor tab title.
 */
export function getResourceUri(tenantName: string, resourceType: string, id: string, name: string): Uri {
    return buildResourceUri({ tenantName, resourceType, id, name });
}

/**
 * Construct the internal URI for an ID-based Sources V2 provisioning policy.
 */
export function getProvisioningPolicyUri(
    tenantName: string,
    sourceId: string,
    policyId: string,
    label: string
): Uri {
    const encodedLabel = label?.replaceAll("/", "%2F");
    return Uri.from({
        scheme: URL_PREFIX,
        authority: tenantName,
        path: editorPath(tenantName, [
            ...getProvisioningPoliciesPath(sourceId, policyId).split("/").filter(part => !!part),
            encodedLabel
        ])
    });
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
    return Uri.from({
        scheme: URL_PREFIX,
        authority: tenantName,
        path: editorPath(tenantName, ["workflow-executions", "v1", executionId, "history", executionId])
    });
}

export function getIdByUri(uri?: Uri): string | null {
    const path = pathWithoutTenant(uri);
    const found = path.match(/^\/.+\/(.*?)\/.*?$/);
    // Found including the whole match and the group
    // cf. https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/match
    if (found && found.length === 2) {
        return found[1];
    }
    return null;
}

export function getResourceTypeByUri(uri: Uri): string | null {
    const path = pathWithoutTenant(uri);
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
 * API path: tenant segment and trailing name removed.
 * Do not use this to build another idn:// URI — start from the URI directory
 * so the tenant hostname stays visible in the editor.
 */
export function getPathByUri(uri?: Uri): string | null {
    const path = pathWithoutTenant(uri);
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
        case "notification-template":
            // subtype "customized": `id` is the stored template id.
            // subtype "default": `id` is the template key. Defaults have no API id.
            return options?.subtype === "customized" || options?.subtype === "default"
                ? getUIUrl(tenantName, "ui/a/admin/global/email-templates", options.subtype, id)
                : undefined;
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
    options?: { parentId?: string }
): Uri | undefined {
    if (kind === "dimension") {
        if (!options?.parentId) return undefined;
        const parentUri = getResourceUri(tenantName, "roles", options.parentId, label);
        return parentUri.with({ path: posix.join(posix.dirname(parentUri.path), "dimensions", id, label) });
    }
    if (kind === "provisioning-policy") {
        if (!options?.parentId) return undefined;
        return getProvisioningPolicyUri(tenantName, options.parentId, id, label);
    }
    const resourceType = IDN_RESOURCE_TYPE_BY_KIND[kind];
    return resourceType ? getResourceUri(tenantName, resourceType, id, label) : undefined;
}
