export interface TenantInfo {
    name: string;
    apiUrl: string;
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
            /*
            const parts = expires.match(/\d+/g);
            if (parts && parts.length === 7) {
                this.expires = new Date(Number(parts[0]),
                    Number(parts[1]) - 1,
                    Number(parts[2]),
                    Number(parts[3]),
                    Number(parts[4]),
                    Number(parts[5]));
            }*/
        }
    };

    expired(): boolean {
        return Date.now() > this.expires.getTime();
    }
}