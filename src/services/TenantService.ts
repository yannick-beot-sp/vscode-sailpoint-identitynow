'use strict';

import { Memento, SecretStorage } from "vscode";
import { TenantCredentials, TenantInfo, TenantToken } from "../models/TenantInfo";
import { compareByName, isEmpty } from "../utils";

const SECRET_PAT_PREFIX = "IDENTITYNOW_SECRET_PAT_";
const SECRET_AT_PREFIX = "IDENTITYNOW_SECRET_AT_";
const TENANT_PREFIX = "IDENTITYNOW_TENANT_";
const ALL_TENANTS_KEY = "IDENTITYNOW_TENANTS";

export class TenantService {


    constructor(private storage: Memento, private readonly secretStorage: SecretStorage,) { }

    public async getTenants(): Promise<TenantInfo[]> {
        let tenants = this.storage.get<string[]>(ALL_TENANTS_KEY);
        if (tenants === undefined) {
            return [];
        }
        let tenantInfoItems = await Promise.all(tenants
            .map(key => this.getTenant(key)));

        tenantInfoItems = tenantInfoItems
            .filter(Boolean) // this line will remove any "undefined"
            .sort(compareByName);
        return tenantInfoItems as TenantInfo[];
    }


    public async getTenant(key: string): Promise<TenantInfo | undefined> {
        const tenantInfo = this.storage.get<TenantInfo>(TENANT_PREFIX + key);
        // As not all tenantInfo will have name and a tenantName, changing the tenantInfo
        if (tenantInfo && !tenantInfo?.tenantName) {
            tenantInfo.tenantName = tenantInfo.name;
        }

        // As not all tenantInfo will have an id, changing the id/key in the storages
        if (tenantInfo && !tenantInfo.id) {
            tenantInfo.id = tenantInfo.tenantName;
            this.setTenant(tenantInfo);
        }
        return tenantInfo;
    }

    public async getTenantByTenantName(tenantName: string): Promise<TenantInfo | undefined> {
        let tenants = await this.getTenants();
        tenants = tenants.filter(t => t.tenantName === tenantName);
        if (tenants.length === 0) {
            return undefined;
        } else if (tenants.length === 1) {
            return tenants[0];
        }
        throw new Error("More than 1 tenant found for " + tenantName);
    }

    public setTenant(value: TenantInfo) {
        let tenants = this.storage.get<string[]>(ALL_TENANTS_KEY);
        if (tenants === undefined) {
            tenants = [];
        }
        if (tenants.indexOf(value.id) === -1) {
            tenants.push(value.id);
            this.storage.update(ALL_TENANTS_KEY, tenants);
        }

        this.storage.update(TENANT_PREFIX + value.id, value);
    }

    public async removeTenant(tenantId: string) {
        let tenants = this.storage.get<string[]>(ALL_TENANTS_KEY);
        if (tenants === undefined) {
            tenants = [];
        }
        const index = tenants.indexOf(tenantId);

        if (index > -1) {
            tenants.splice(index, 1);
            this.storage.update(ALL_TENANTS_KEY, tenants);
        }
        const tenantKey = TENANT_PREFIX + tenantId;
        if (this.storage.get(tenantKey) !== undefined) {
            this.storage.update(tenantKey, null);
        }
        await this.removeTenantCredentials(tenantId);
        await this.removeTenantAccessToken(tenantId);
    }

    public async getTenantCredentials(tenantId: string): Promise<TenantCredentials | undefined> {

        const credentialsStr = await this.secretStorage.get(this.getPatKey(tenantId));
        if (credentialsStr === undefined) {
            return undefined;
        }
        const credentials = JSON.parse(credentialsStr) as TenantCredentials;
        return credentials;
    }
    public async setTenantCredentials(tenantId: string, credentials: TenantCredentials) {
        // Don't set `currentToken` here, since we want to fire the proper events in the `checkForUpdates` call
        await this.secretStorage.store(this.getPatKey(tenantId), JSON.stringify(credentials));
    }

    public async removeTenantCredentials(tenantId: string) {
        console.log("> removeTenantCredentials for " + tenantId);
        const key = this.getPatKey(tenantId);
        await this.removeSecretKeyIfExists(key);
    }

    public async getTenantAccessToken(tenantId: string): Promise<TenantToken | undefined> {
        const tokenStr = await this.secretStorage.get(this.getAccessTokenKey(tenantId)) || "";
        let token: TenantToken | undefined = undefined;
        if (!isEmpty(tokenStr)) {
            try {
                const tokenJson: any = JSON.parse(tokenStr);
                token = new TenantToken(
                    tokenJson.accessToken,
                    tokenJson.expires,
                    {
                        clientId: tokenJson.client.clientId,
                        clientSecret: tokenJson.client.clientSecret
                    });
            } catch (err) {
                console.log("WARNING: could not parse Token: ", err);
            }
        } else {
            console.log("WARNING: no token for tenant", tenantId);
        }
        return token;
    }

    public async setTenantAccessToken(tenantId: string, token: TenantToken) {
        await this.secretStorage.store(
            this.getAccessTokenKey(tenantId),
            JSON.stringify(token));
    }

    public async removeTenantAccessToken(tenantId: string) {
        const key = this.getAccessTokenKey(tenantId);
        await this.removeSecretKeyIfExists(key);
    }


    /**
     * Returns the key for the ClientID/ClientSecret (PAT) in the secret storage
     * @param tenantId 
     * @returns The key
     */
    private getPatKey(tenantId: string): string {
        return SECRET_PAT_PREFIX
            + tenantId;
    }

    /**
     * Returns the key for the access token in the secret storage
     * @param tenantId 
     * @returns 
     */
    private getAccessTokenKey(tenantId: string): string {
        return SECRET_AT_PREFIX
            + tenantId;
    }

    /**
     * Check the existence before removing the key
     * @param key 
     */
    private async removeSecretKeyIfExists(key: string) {
        const secret = await this.secretStorage.get(key);
        if (secret !== undefined) {
            await this.secretStorage.delete(key);
        }
    }
}