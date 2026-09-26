export enum AuthenticationMethod {
    personalAccessToken,
    accessToken,
    oauthCode
}

export interface TenantInfo {
    id: string;
    name: string;
    tenantName: string;
    authenticationMethod: AuthenticationMethod;
    readOnly: boolean;
    type: "TENANT"
}

export interface TenantCredentials {
    clientId: string;
    clientSecret: string;
}

export class TenantToken {
    public readonly accessToken: string;
    public readonly expires: Date;
    public readonly client: TenantCredentials;
    public readonly refreshToken?: string;
    public readonly refreshExpires?: Date;
    constructor(
        accessToken: string,
        expires: Date | string,
        client: TenantCredentials,
        refreshToken?: string,
        refreshExpires?: Date | string,
    ) {
        this.accessToken = accessToken;
        this.client = client;
        this.refreshToken = refreshToken;

        if (expires instanceof Date) {
            this.expires = expires;
        } else {
            this.expires = new Date(expires);
        }

        if (refreshExpires instanceof Date) {
            this.refreshExpires = refreshExpires;
        } else if (refreshExpires) {
            this.refreshExpires = new Date(refreshExpires);
        }
    };

    expired(): boolean {
        return Date.now() > this.expires.getTime();
    }
}
