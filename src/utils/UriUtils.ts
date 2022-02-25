import { Uri } from "vscode";
import * as path from 'path';
import { URL_PREFIX } from "../constants";

export function withQuery(url: string, params: any): string {
    let query = Object.keys(params)
        .filter(k => params[k] !== undefined)
        .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
        .join('&');
    url += (url.indexOf('?') === -1 ? '?' : '&') + query;
    return url;
}

/**
 * Construct the Uri for an IdentityNow resource
 * @param tenantName 
 * @param resourceType 
 * @param id 
 * @param name 
 * @returns 
 */
export function getResourceUri(tenantName: string, resourceType: string, id: string, name: string, beta = false): Uri {
    const baseUri = Uri.from({ scheme: URL_PREFIX, authority: tenantName, path: '/' });
    return Uri.joinPath(
        baseUri,
        (beta ? 'beta' : 'v3'),
        resourceType,
        id,
        name
    );
}


export function getIdByUri(uri: Uri): string | null {
    const path = uri.path || "";
    const found = path.match(/^\/.+\/(.*?)\/.*?/);
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
    return path.posix.basename(respath);
}

/**
 * Will remove the "name" part
 * @param uri 
 * @returns 
 */
export function getPathByUri(uri: Uri): string | null {
    const path = uri.path || "";
    const found = path.match(/^(\/.+)\/.*?$/);
    // Found including the whole match and the group
    // cf. https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/match
    if (found && found.length === 2) {
        return found[1];
    }
    return null;
}
