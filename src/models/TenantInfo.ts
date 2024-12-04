export enum AuthenticationMethod {
    personalAccessToken,
    accessToken
}

export interface TenantInfo {
    id: string;
    name: string;
    tenantName: string;
    authenticationMethod: AuthenticationMethod;
    readOnly: boolean;
}

export interface TenantCredentials {
    clientId: string;
    clientSecret: string;
}

export class TenantToken {
    public readonly accessToken: string;
    public readonly expires: Date;
    public readonly client: TenantCredentials;
    constructor(
        accessToken: string,
        expires: Date | string,
        client: TenantCredentials
    ) {
        this.accessToken = accessToken;
        this.client = client;

        if (expires instanceof Date) {
            this.expires = expires;
        } else {
            this.expires = new Date(expires);
        }
    };

    expired(): boolean {
        return Date.now() > this.expires.getTime();
    }
}
