export function isEmpty(strValue: string | null | undefined): boolean {
    return (!strValue || strValue.trim() === "" || (strValue.trim()).length === 0);
}

export function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function withQuery(url: string, params: any) {
    let query = Object.keys(params)
        .filter(k => params[k] !== undefined)
        .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
        .join('&');
    url += (url.indexOf('?') === -1 ? '?' : '&') + query;
    return url;
}

export class EndpointUtil {

    public static getBaseUrl(tenantName: string): string {
        let baseApiUrl = `https://${tenantName}.api.identitynow.com/`;

        if (tenantName.indexOf('.') > 0) {
            baseApiUrl = tenantName.replace(/([a-z0-9][a-z0-9-]+)\.(.*)/, "https://$1.api.$2/");
        }
        return baseApiUrl;
    }

    public static getAccessTokenUrl(tenantName: string): string {
        const baseApiUrl = this.getBaseUrl(tenantName);
        return baseApiUrl + 'oauth/token';
    }

    public static getV3Url(tenantName: string): string {
        const baseApiUrl = this.getBaseUrl(tenantName);
        return baseApiUrl + 'v3';
    }

    public static getBetaUrl(tenantName: string): string {
        const baseApiUrl = this.getBaseUrl(tenantName);
        return baseApiUrl + 'beta';
    }

    public static getCCUrl(tenantName: string): string {
        const baseApiUrl = this.getBaseUrl(tenantName);
        return baseApiUrl + 'cc/api';
    }
}