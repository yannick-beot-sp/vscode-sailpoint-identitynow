export class EndpointUtils {

    public static getBaseUrl(tenantName: string): string {
        let baseApiUrl = `https://${tenantName}.api.identitynow.com`;

        if (tenantName.indexOf('.') > 0) {
            if (tenantName.includes('.identitysoon.com')) {
                baseApiUrl = tenantName.replace(/([a-z0-9][a-z0-9-]+)\.(.*)/, "https://$1.api.cloud.sailpoint.com");
            } else {
                baseApiUrl = tenantName.replace(/([a-z0-9][a-z0-9-]+)\.(.*)/, "https://$1.api.$2");
            }
        }
        return baseApiUrl;
    }

    public static getAccessTokenUrl(tenantName: string): string {
        const baseApiUrl = this.getBaseUrl(tenantName);
        return baseApiUrl + '/oauth/token';
    }

    public static getV3Url(tenantName: string): string {
        const baseApiUrl = this.getBaseUrl(tenantName);
        return baseApiUrl + '/v3';
    }

    public static getBetaUrl(tenantName: string): string {
        const baseApiUrl = this.getBaseUrl(tenantName);
        return baseApiUrl + '/beta';
    }
}