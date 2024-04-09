import * as vscode from 'vscode';
import { NEW_ID } from '../constants';
import { RulesTreeItem } from "../models/IdentityNowTreeItem";
import { IdentityNowClient } from '../services/IdentityNowClient';
import { TenantService } from '../services/TenantService';
import { compareByName } from '../utils';
import { isEmpty } from '../utils/stringUtils';
import { getResourceUri } from '../utils/UriUtils';
import { chooseTenant, createNewFile, getSelectionContent, openPreview } from '../utils/vsCodeHelpers';
import * as commands from './constants';
import { ConnectorRuleResponseBeta } from 'sailpoint-api-client';
const rules: ConnectorRuleResponseBeta[] = require('../../snippets/connector-rules.json');

/**
 * Internal constants
 */
const UPDATE_RULE = "UPDATE";
const NEW_RULE = "NEW";

/**
 * Command used to open a source or a transform
 */
export class ConnectorRuleCommand {

    constructor(private readonly tenantService: TenantService) { }

    async upload() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            console.error('No editor');
            return;
        }

        const selection = getSelectionContent(editor);
        if (!selection) {
            return;
        }
        const answer = await this.askUpdateExistingRule();
        if (!answer) {
            return;
        }
        const tenantInfo = await chooseTenant(this.tenantService, 'Choose a tenant to update the rule');
        console.log("upload: tenant = ", tenantInfo);
        if (!tenantInfo) {
            return;
        }
        const client = new IdentityNowClient(tenantInfo.id, tenantInfo.tenantName);
        let newUri: vscode.Uri;
        try {
            if (answer === UPDATE_RULE) {

                const rule = await this.chooseExistingRule(client);
                if (!rule) {
                    return;
                }

                rule.sourceCode.script = selection;
                const path = '/beta/connector-rules/' + rule.id;
                client.updateResource(path, JSON.stringify(rule));
                newUri = getResourceUri(tenantInfo.tenantName, 'connector-rules', rule.id, rule.name, true);
            } else {
                // NEW_RULE
                let ruleName = await this.askRuleName() || "";
                if (isEmpty(ruleName)) {
                    return;
                }

                const rule = await this.askRuleType();
                if (!rule) {
                    return;
                }
                rule.sourceCode.script = selection;
                rule.name = ruleName;
                const data = await client.createResource('/beta/connector-rules', JSON.stringify(rule));
                newUri = getResourceUri(tenantInfo.tenantName, 'connector-rules', data.id, data.name, true);
            }
            openPreview(newUri)
            vscode.commands.executeCommand(commands.REFRESH_FORCED)
        } catch (error) {
            const errorMessage = `Could not ${answer === UPDATE_RULE ? "update" : "create"} the rule: ${error}` 
            vscode.window.showErrorMessage(errorMessage)
        }

    }

    async validateScript() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            console.error('No editor');
            return;
        }

        const selection = getSelectionContent(editor);
        if (!selection) {
            return;
        }
        const tenantInfo = await chooseTenant(this.tenantService, 'Choose a tenant to validate the script');
        console.log("validateScript: tenant = ", tenantInfo);
        if (!tenantInfo) {
            return;
        }
        const client = new IdentityNowClient(tenantInfo.id, tenantInfo.tenantName);
        const res = await client.validateConnectorRule(selection);

        if (res.state === "OK") {
            await vscode.window.showInformationMessage('The script is valid');
        } else {
            let message = "Could not validate script. ";
            message += res.details?.map(detail => `${detail.line}:${detail.column}: ${detail.messsage}`).join('\n') ?? "";
            await vscode.window.showErrorMessage(message);
        }
    }

    async newRule(tenant: RulesTreeItem): Promise<void> {

        console.log("> NewConnectorRuleCommand.newRule", tenant);

        // assessing that item is a TenantTreeItem
        if (tenant === undefined || !(tenant instanceof RulesTreeItem)) {
            console.log("WARNING: NewConnectorRuleCommand.newRule: invalid node", tenant);
            throw new Error("NewConnectorRuleCommand.newRule: invalid node");
        }
        const tenantName = tenant.tenantName || "";
        if (isEmpty(tenantName)) {
            return;
        }
        let ruleName = await this.askRuleName() || "";
        if (isEmpty(ruleName)) {
            return;
        }

        const rule = await this.askRuleType();
        if (!rule) {
            return;
        }

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Creating File...',
            cancellable: false
        }, async (task, token) => {

            const newUri = getResourceUri(tenantName, 'connector-rules', NEW_ID, ruleName, true);
            rule.name = ruleName;
            await createNewFile(newUri, rule);
        });
    }

    private async chooseExistingRule(client: IdentityNowClient): Promise<ConnectorRuleResponseBeta | undefined> {
        const rules = await client.getConnectorRules();
        return await this.showPickRule(rules, 'Connector rule');
    }

    private async askUpdateExistingRule(): Promise<string | undefined> {
        const answer = await vscode.window.showQuickPick(
            ["No", "Yes"],
            { placeHolder: 'Do you want to update an existing rule' });

        if (answer === "Yes") { return UPDATE_RULE; }
        else if (answer === "No") { return NEW_RULE; }
        return undefined;

    }

    private async showPickRule(listRules: ConnectorRuleResponseBeta[], title: string): Promise<ConnectorRuleResponseBeta | undefined> {

        // QuickPickItem use label instead of name
        // Relying on "detail" instead of "description" as "detail" provides a longer view
        // therefore label and detail must be added and removed before returning the rule
        const rulePickList = listRules
            .sort(compareByName)
            .map(obj => ({ ...obj, label: obj.name, detail: obj.description }));

        rulePickList.forEach(obj => delete obj.description);

        const rule = await vscode.window.showQuickPick(rulePickList, {
            ignoreFocusOut: false,
            title: title,
            canPickMany: false
        });
        if (rule?.label) {
            rule.description = rule.detail;
            // @ts-ignore
            delete rule.label;
            delete rule.detail;
        }
        return rule;
    }

    private async askRuleName(): Promise<string | undefined> {
        const result = await vscode.window.showInputBox({
            value: '',
            ignoreFocusOut: true,
            placeHolder: 'Connector Rule name',
            prompt: "Enter the Connector Rule name",
            title: 'Identity Security Cloud',
            validateInput: text => {
                if (text && text.length > 128) {
                    return "Connector Rule name cannot exceed 128 characters.";
                }

                if (text === '') {
                    return "You must provide a Connector Rule name.";
                }

                // '+' removed from allowed character as known issue during search/filter of transform 
                // If search/filter is failing, the transform is not properly closed and reopened
                const regex = new RegExp('^[a-z0-9 _:;,={}@()#-|^%$!?.*]{1,128}$', 'i');
                if (regex.test(text)) {
                    return null;
                }
                return "Invalid Connector Rule name";
            }
        });
        return result?.trim();
    }

    private async askRuleType(): Promise<ConnectorRuleResponseBeta | undefined> {
        return await this.showPickRule(rules, 'Connector rule type');
    }
}
