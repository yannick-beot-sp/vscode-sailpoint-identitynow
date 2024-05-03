import { TenantService } from "../services/TenantService";
import * as vscode from 'vscode';
import { confirm } from "../utils/vsCodeHelpers";

/**
 * return true if OK to continue, false if execution MUST stop
 * @param tenantService 
 * @param tenantId
 * @param actionName Use in the confirm box
 */
export async function validateTenantReadonly(tenantService: TenantService, tenantId: string, actionName: string): Promise<boolean> {
    if (isTenantReadonly(tenantService, tenantId)) {
        const prompt = `This tenant is read-only. Do you still want to ${actionName}?`
        return confirm(prompt)
    } else {
        return true
    }
}

export function isTenantReadonly(tenantService: TenantService, tenantId: string): boolean {
    const tenantInfo = tenantService.getTenant(tenantId)
    return tenantInfo.readOnly === true

}