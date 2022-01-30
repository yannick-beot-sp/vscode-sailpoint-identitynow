'use strict';

import { Memento } from "vscode";
import { TenantInfo } from "../models/TenantInfo";



export class TenantService {
    private static TENANT_PREFIX = "IDENTITYNOW_TENANT_";
    private static ALL_TENANTS_KEY = "IDENTITYNOW_TENANTS";

    constructor(private storage: Memento) { }

    public getTenants(): string[] {
        let res = this.storage.get<string[]>(TenantService.ALL_TENANTS_KEY);
        if (res === undefined) {
            return [];
        }
        return res;
    }


    public getTenant(key: string): TenantInfo | undefined {
        return this.storage.get<TenantInfo>(TenantService.TENANT_PREFIX + key);
    }

    public setTenant(value: TenantInfo) {
        let tenants = this.storage.get<string[]>(TenantService.ALL_TENANTS_KEY);
        if (tenants===undefined) {
            tenants = [];
        }
        if (tenants.indexOf(value.name) === -1) {
            tenants.push(value.name);
            this.storage.update(TenantService.ALL_TENANTS_KEY, tenants);
        }

        this.storage.update(TenantService.TENANT_PREFIX + value.name, value);
    }
}