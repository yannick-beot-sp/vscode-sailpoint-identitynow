import * as vscode from 'vscode';
import { NEW_ID } from '../constants';
import { ConnectorRule } from '../models/connectorRule';
import { RulesTreeItem } from "../models/IdentityNowTreeItem";
import { TransformQuickPickItem } from '../models/TransformQuickPickItem';
import { compareByName, isEmpty } from '../utils';
import { getResourceUri } from '../utils/UriUtils';
const rules: ConnectorRule[] = require('../../snippets/connector-rules.json');

/**
 * Command used to open a source or a transform
 */
export class ConnectorRuleCommand {
    upload() {
        throw new Error('Method not implemented.');
    }


    async askRuleName(): Promise<string | undefined> {
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

    async askRuleType(): Promise<ConnectorRule | undefined> {

        // QuickPickItem use label instead of name
        // Relying on "detail" instead of "description" as "detail" provides a longer view
        // therefore label and detail must be added and removed before returning the rule
        const rulePickList = rules
            .sort(compareByName)
            .map(obj => ({ ...obj, label: obj.name, detail: obj.description }));

        rulePickList.forEach(obj => delete obj.description);

        const rule = await vscode.window.showQuickPick(rulePickList, {
            ignoreFocusOut: false,
            title: "Connector rule type",
            canPickMany: false
        });
        if (rule?.label) {
            rule.description = rule.detail;
            delete rule.label;
            delete rule.detail;
        }
        return rule;
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
