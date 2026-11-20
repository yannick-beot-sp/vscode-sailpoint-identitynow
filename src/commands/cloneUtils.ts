import * as vscode from 'vscode';
import { ISCClient } from '../services/ISCClient.js';
import { TenantService } from '../services/TenantService.js';
import { TenantInfo } from '../models/TenantInfo.js';
import { chooseTenant } from '../utils/vsCodeHelpers.js';
import { isBlank } from '../utils/stringUtils.js';
import { validateTenantReadonly } from './validateTenantReadonly.js';

export interface CloneContext {
    targetTenant: TenantInfo
    sameTenant: boolean
    sourceClient: ISCClient
    targetClient: ISCClient
    /** Proposes a name: suffixed with "copy" when cloning in the same tenant */
    defaultName(name: string): string
}

/**
 * Common first steps of a clone: choose the target tenant, check it is writable
 * and prepare the clients.
 * @returns undefined if cancelled or if the target tenant is read-only
 */
export async function chooseTenants(
    tenantService: TenantService,
    source: { tenantId: string, tenantName: string },
    objectType: string,
    objectLabel: string
): Promise<CloneContext | undefined> {
    const targetTenant = await chooseTenant(tenantService, `To which tenant do you want to clone ${objectLabel}?`, source.tenantId);
    if (!targetTenant) {
        return undefined;
    }
    if (!(await validateTenantReadonly(tenantService, targetTenant.id, `clone ${objectType}`))) {
        return undefined;
    }
    const sameTenant = targetTenant.id === source.tenantId
    const sourceClient = new ISCClient(source.tenantId, source.tenantName);
    const targetClient = sameTenant ? sourceClient : new ISCClient(targetTenant.id, targetTenant.tenantName);
    return {
        targetTenant,
        sameTenant,
        sourceClient,
        targetClient,
        defaultName: name => sameTenant ? `${name} - copy` : name
    }
}

export async function askObjectName(objectType: string, defaultName: string): Promise<string | undefined> {
    const result = await vscode.window.showInputBox({
        value: defaultName,
        ignoreFocusOut: true,
        placeHolder: `${objectType} name`,
        prompt: `Enter the ${objectType} name`,
        title: 'Identity Security Cloud',
        validateInput: text => {
            if (isBlank(text)) {
                return `You must provide a new name for the ${objectType}.`;
            }
            return null
        }
    });
    return result?.trim();
}
