import * as vscode from 'vscode';
import * as commands from './constants.js';
import { SailPointISCAuthenticationProvider } from '../services/AuthenticationProvider.js';
import { TenantService } from '../services/TenantService.js';
import { extractTenantName, normalizeTenant } from '../utils.js';
import { askDisplayName } from '../utils/vsCodeHelpers.js';
import { AuthenticationMethod } from '../models/TenantInfo.js';
import { randomUUID } from 'crypto';
import { isEmpty } from '../utils/stringUtils.js';


export class AddTenantCommand {

    constructor(private readonly tenantService: TenantService) { }

    async askTenant(): Promise<string | undefined> {
        const result = await vscode.window.showInputBox({
            value: '',
            ignoreFocusOut: true,
            placeHolder: 'company, company.identitynow.com or https://company.identitynow.com',
            prompt: "Enter the tenant name, FQDN or URL",
            title: 'Identity Security Cloud',
            validateInput: text => {
                if (extractTenantName(text) !== undefined) {
                    return null;
                }
                return "Invalid tenant name";
            }
        });
        return result;
    }
    async askAuthenticationMethod(): Promise<AuthenticationMethod | undefined> {

        const authMethod = await vscode.window.showQuickPick<vscode.QuickPickItem & { method: AuthenticationMethod }>(
            [
                { label: "Personal Access Token", method: AuthenticationMethod.personalAccessToken },
                { label: "Access Token", method: AuthenticationMethod.accessToken },
                {
                    label: "OAuth Code",
                    description: "Sign in with the browser, then paste the one-time code",
                    method: AuthenticationMethod.oauthCode,
                },
            ], {
            ignoreFocusOut: true,
            placeHolder: "Authentication method",
            title: "Identity Security Cloud",
            canPickMany: false
        });
        return authMethod?.method;
    }


    async execute(context: vscode.ExtensionContext): Promise<void> {

        const tenantInput = await this.askTenant() || "";
        if (isEmpty(tenantInput)) {
            return;
        }
        const tenantName = extractTenantName(tenantInput);
        if (tenantName === undefined) {
            return;
        }
        const normalizedTenantName = normalizeTenant(tenantName);
        const tenantInfo = await this.tenantService.getTenantByTenantName(normalizedTenantName);
        if (tenantInfo !== undefined) {
            console.error("Tenant " + tenantName + " already exists");
            vscode.window.showErrorMessage("Tenant " + tenantName + " already exists");
            return;
        }

        let displayName = await askDisplayName(tenantName) || "";
        displayName = displayName.trim();
        if (isEmpty(displayName)) {
            return;
        }

        const authMethod = await this.askAuthenticationMethod();
        if (authMethod === undefined) {
            return;
        }

        const tenantId = randomUUID().replaceAll('-', '');
        this.tenantService.updateOrCreateNode({
            id: tenantId,
            name: displayName,
            tenantName: normalizedTenantName,
            authenticationMethod: authMethod,
            readOnly: true,
            type: "TENANT"
        });
        try {
            const session = await SailPointISCAuthenticationProvider.getInstance().createSession(tenantId)

            if (session !== undefined && !isEmpty(session.accessToken)) {
                await vscode.commands.executeCommand(commands.REFRESH_FORCED);
                await vscode.window.showInformationMessage(`Tenant ${displayName} added!`);
            } else {
                this.tenantService.removeNode(tenantId);
            }
        } catch (err: any) {
            console.error(err);
            this.tenantService.removeNode(tenantId);
            vscode.window.showErrorMessage(err.message);
        }
    }
}
