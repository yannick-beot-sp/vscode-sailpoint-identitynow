import * as vscode from 'vscode';
import { NEW_ID } from '../constants';
import { ConnectorRule } from '../models/connectorRule';
import { RulesTreeItem } from "../models/IdentityNowTreeItem";
import { IdentityNowClient } from '../services/IdentityNowClient';
import { TenantService } from '../services/TenantService';
import { compareByName, isEmpty } from '../utils';
import { getResourceUri } from '../utils/UriUtils';
import { chooseTenant, getSelectionContent } from '../utils/vsCodeHelpers';
const rules: ConnectorRule[] = require('../../snippets/connector-rules.json');

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
        const tenantName = await chooseTenant(this.tenantService, 'Choose a tenant to update the rule');
        console.log("upload: tenant = ", tenantName);
        if (!tenantName) {
            return;
        }
        const client = new IdentityNowClient(tenantName);
        let newUri: vscode.Uri;
        if (answer === UPDATE_RULE) {

            const rule = await this.chooseExistingRule(client);
            if (!rule) {
                return;
            }

            rule.sourceCode.script = selection;
            const path = '/beta/connector-rules/' + rule.id;
            client.updateResource(path, JSON.stringify(rule));
            newUri = getResourceUri(tenantName, 'connector-rules', rule.id, rule.name, true);
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
            const data = await client.createResource('/beta/connector-rules', JSON.stringify(rule));
            newUri = getResourceUri(tenantName, 'connector-rules', data.id, data.name, true);
        }
        // Open document and then show document to force JSON
        let document = await vscode.workspace.openTextDocument(newUri);
        document = await vscode.languages.setTextDocumentLanguage(document, 'json');
        await vscode.window.showTextDocument(document, { preview: false, preserveFocus: true });

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
        const tenantName = await chooseTenant(this.tenantService, 'Choose a tenant to validate the script');
        console.log("validateScript: tenant = ", tenantName);
        if (!tenantName) {
            return;
        }
        const client = new IdentityNowClient(tenantName);
        const res = await client.validateConnectorRule(selection);

        if (res.state === "OK") {
            await vscode.window.showInformationMessage('The script is valid');
        } else {
            let  message = "Could not validate script. ";
            message += res.details?.map(detail => `${detail.line}:${detail.column}: ${detail.messsage}`).join('\n') ?? "";
            await vscode.window.showErrorMessage(message);
        }
    }


    private async chooseExistingRule(client: IdentityNowClient): Promise<ConnectorRule | undefined> {
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

    private async showPickRule(listRules: ConnectorRule[], title: string): Promise<ConnectorRule | undefined> {

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
            title: 'IdentityNow',
            validateInput: text => {
                if (text && text.length > 50) {
                    return "Connector Rule name cannot exceed 50 characters.";
                }

                if (text === '') {
                    return "You must provide a Connector Rule name.";
                }

                // '+' removed from allowed character as known issue during search/filter of transform 
                // If search/filter is failing, the transform is not properly closed and reopened
                const regex = new RegExp('^[a-z0-9 _:;,={}@()#-|^%$!?.*]{1,50}$', 'i');
                if (regex.test(text)) {
                    return null;
                }
                return "Invalid Connector Rule name";
            }
        });
        return result?.trim();
    }

    private async askRuleType(): Promise<ConnectorRule | undefined> {
        return await this.showPickRule(rules, 'Connector rule type');
    }

    async execute(tenant: RulesTreeItem): Promise<void> {

        console.log("> NewConnectorRuleCommand.execute", tenant);

        // assessing that item is a TenantTreeItem
        if (tenant === undefined || !(tenant instanceof RulesTreeItem)) {
            console.log("WARNING: NewConnectorRuleCommand.execute: invalid node", tenant);
            throw new Error("NewConnectorRuleCommand.execute: invalid node");
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
            let document = await vscode.workspace.openTextDocument(newUri);
            document = await vscode.languages.setTextDocumentLanguage(document, 'json');
            await vscode.window.showTextDocument(document, { preview: true });

            const edit = new vscode.WorkspaceEdit();
            rule.name = ruleName;
            const strContent = JSON.stringify(rule, null, 4);
            edit.insert(newUri, new vscode.Position(0, 0), strContent);
            let success = await vscode.workspace.applyEdit(edit);
        });
    }
}
