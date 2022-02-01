import { Uri } from "vscode";

export function withQuery(url: string, params: any): string {
    let query = Object.keys(params)
        .filter(k => params[k] !== undefined)
        .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
        .join('&');
    url += (url.indexOf('?') === -1 ? '?' : '&') + query;
    return url;
}

export function getResourceUri(tenantName: string, v3resourceType: string, id: string, name: string): Uri {
    const baseUri = Uri.from({ scheme: "idn", authority: tenantName, path: '/v3' });
    return Uri.joinPath(
        baseUri,
        v3resourceType,
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
