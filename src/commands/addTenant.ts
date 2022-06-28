import * as vscode from 'vscode';
import * as commands from './constants';
import { SailPointIdentityNowAuthenticationProvider } from '../services/AuthenticationProvider';
import { TenantService } from '../services/TenantService';
import { isEmpty } from '../utils';


export class AddTenantCommand {

    constructor(private readonly tenantService: TenantService) { }

    async askTenant(): Promise<string | undefined> {
        const result = await vscode.window.showInputBox({
            value: '',
            ignoreFocusOut: true,
            placeHolder: 'company or company.identitynow.com',
            prompt: "Enter the tenant name",
            title: 'IdentityNow',
            validateInput: text => {
                // regexr.com/6jk1u
                const regex = new RegExp('^([a-z0-9][a-z0-9\-]+[a-z0-9]\.[a-z0-9][a-z0-9\-]+[a-z0-9]\.)?([a-z0-9][a-z0-9\-]+[a-z0-9])$', 'i');
                if (regex.test(text)) {
                    return null;
                }
                return "Invalid tenant name";
            }
        });
        return result;
    }

    async askDisplayName(tenantName: string): Promise<string | undefined> {
        const result = await vscode.window.showInputBox({
            value: tenantName,
            ignoreFocusOut: true,
            placeHolder: 'company',
            prompt: "Enter a display name for this tenant",
            title: 'IdentityNow',
            validateInput: text => {
                if (isEmpty(text)) {
                    return "Display name must not be empty";
                }
            }
        });
        return result;
    }


    async execute(context: vscode.ExtensionContext): Promise<void> {

        let tenantName = await this.askTenant() || "";
        if (isEmpty(tenantName)) {
            return;
        }

        const displayName = await this.askDisplayName(tenantName) || "";
        if (isEmpty(displayName)) {
            return;
        }

        tenantName = tenantName.toLowerCase();
        const tenantId = require('crypto').randomUUID().replaceAll('-','');
        const session = await vscode.authentication.getSession(SailPointIdentityNowAuthenticationProvider.id, [tenantId], { createIfNone: true });
        if (!isEmpty(session.accessToken)) {
            vscode.window.showInformationMessage(`Tenant ${tenantName} added!`);
            this.tenantService.setTenant({
                id: tenantId,
                name: displayName,
                tenantName: tenantName
            });
            vscode.commands.executeCommand(commands.REFRESH);
        }
    }
}
