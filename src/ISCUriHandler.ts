import * as commands from './commands/constants';
import * as vscode from 'vscode';
import { AddTenantQueryString } from './models/AddTenantQueryString';
import { AuthenticationMethod, TenantCredentials, TenantToken } from './models/TenantInfo';
import { TenantService } from './services/TenantService';
import { normalizeTenant, parseJwt } from './utils';
import { isEmpty } from './utils/stringUtils';
import { randomUUID } from 'crypto';
const querystring = require('querystring');

export class ISCUriHandler implements vscode.UriHandler {

    /**
     * Constructor
     */
    constructor(private readonly tenantService: TenantService) { }


    public async handleUri(uri: vscode.Uri): Promise<void> {
        console.log("> handleUri", uri);
        if (uri.path !== "/addtenant") {

            vscode.window.showErrorMessage("Invalid Uri Path: unknown command");
            return;
        }
        const q = querystring.parse(uri.query) as AddTenantQueryString;
        if (isEmpty(q.authenticationMethod)) {
            vscode.window.showErrorMessage("Invalid Uri Query: authenticationMethod is missing");
            return;
        }

        if (isEmpty(q.tenantName)) {
            vscode.window.showErrorMessage("Invalid Uri Query: tenantName is missing");
            return;
        }
        const normalizedTenantName = normalizeTenant(q.tenantName);

        // Validate parameters depending on the authentication method
        if (q.authenticationMethod.toLowerCase() === "accesstoken") {
            if (isEmpty(q.accessToken)) {
                vscode.window.showErrorMessage("Invalid Uri Query: accessToken is missing");
                return;
            }
        } else {
            if (isEmpty(q.clientId)) {
                vscode.window.showErrorMessage("Invalid Uri Query: clientId is missing");
                return;
            }
            if (isEmpty(q.clientSecret)) {
                vscode.window.showErrorMessage("Invalid Uri Query: clientSecret is missing");
                return;
            }
        }
        const tenantInfo = await this.tenantService.getTenantByTenantName(normalizedTenantName);
        let tenantId = '';
        if (tenantInfo !== undefined) {
            // Tenant found update the access token
            tenantId = tenantInfo.id;
        } else {
            tenantId = randomUUID().replaceAll('-', '');
            //Create the tenant
            this.tenantService.setTenant({
                id: tenantId,
                name: q.displayName ?? q.tenantName,
                tenantName: normalizedTenantName,
                authenticationMethod: (q.authenticationMethod.toLowerCase() === "accesstoken" ? AuthenticationMethod.accessToken : AuthenticationMethod.personalAccessToken)
            });
        }
        if (q.authenticationMethod.toLowerCase() === "accesstoken") {
            // Store access token
            const jwt = parseJwt(q.accessToken as string);
            const token = new TenantToken(q.accessToken as string, new Date(jwt.exp * 1000), { clientId: jwt.client_id } as TenantCredentials);
            this.tenantService.setTenantAccessToken(tenantId, token);
        } else {
            // Store Tenant Credentials
            this.tenantService.setTenantCredentials(tenantId,
                {
                    clientId: q.clientId as string,
                    clientSecret: q.clientSecret as string
                });
        }
        await vscode.commands.executeCommand(commands.REFRESH_FORCED);
    }

}