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


export function buildResourceUri(params: {
    tenantName: string;
    resourceType: string; id: string;
    name?: string | null;
    subResourceType?: string; subId?: string;
}) {
    let beta = false
    switch (params.resourceType) {
        case RESOURCE_TYPES.connectorRule:
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
export function getResourceUri(tenantName: string, resourceType: string, id: string, name: string, beta = false): Uri {
    const baseUri = Uri.from({ scheme: URL_PREFIX, authority: tenantName, path: '/' });
    name = name?.replaceAll("/", "%2F")
    // ensure all parts are not null
    const pathParts = [(beta ? 'beta' : 'v3'),
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
