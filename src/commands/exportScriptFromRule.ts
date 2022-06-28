import * as vscode from 'vscode';
import { RuleTreeItem } from '../models/IdentityNowTreeItem';
import { IdentityNowClient } from '../services/IdentityNowClient';
import { toDateSuffix } from '../utils';
import * as fs from 'fs';
import path = require('path');
import { confirmFileOverwrite } from '../utils/vsCodeHelpers';
import { getIdByUri, getNameByUri } from '../utils/UriUtils';

export async function exportScriptView(node?: RuleTreeItem): Promise<void> {

    // assessing that item is a IdentityNowResourceTreeItem
    if (node === undefined || !(node instanceof RuleTreeItem)) {
        console.log("WARNING: exportScriptView: invalid item", node);
        throw new Error("exportScriptView: invalid item");
    }

    await exportScript(node.tenantName, node.label as string, node.id);
}

export async function exportScriptEditor(): Promise<void> {

    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        console.error('No editor');
        return;
    }

    const tenantName = editor.document.uri.authority;
    const ruleId = getIdByUri(editor.document.uri);
    const ruleName = getNameByUri(editor.document.uri);

    if (!ruleId || !tenantName || !ruleName) {
        console.error("Invalid editor uri:", editor.document.uri);
    }

    await exportScript(tenantName, ruleName as string, ruleId as string);
}


function buildProposedFilePath(tenantName: string, ruleName: string): string {
    let exportFile = '';

    if (vscode.workspace.workspaceFolders !== undefined) {
        const workspaceFolder = vscode.workspace.workspaceFolders[0].uri.fsPath.replace(/\\/g, "/");
        const exportFolder = path.join(workspaceFolder, 'exportedObjects', 'rule-scripts');
        exportFile = path.join(exportFolder, 'script-' + tenantName + '-' + ruleName + '-' + toDateSuffix() + '.bsh');
    }

    return exportFile;
}


async function chooseFileForExport(proposedFile: string): Promise<string | undefined> {
    console.log("> chooseFileForExport: " + proposedFile);
    let exportFile: string | undefined = undefined;

    exportFile = await vscode.window.showInputBox({
        ignoreFocusOut: true,
        value: proposedFile,
        prompt: 'Enter the file to save the script to'
    });
    if (exportFile) {
        const overwrite = await confirmFileOverwrite(exportFile);
        if (!overwrite) {
            exportFile = undefined;
        }
    }
    console.log("< chooseFileForExport: " + exportFile);
    return exportFile;
}

async function exportScript(tenantName: string, ruleName: string, ruleId: string): Promise<void> {
    console.log(`> exportScript: tenantName=${tenantName}, ruleName=${ruleName}, ruleId=${ruleId}`);
    let exportFile: string | undefined = buildProposedFilePath(tenantName, ruleName);
    exportFile = await chooseFileForExport(exportFile);
    if (!exportFile) {
        return;
    }

    const exportFolder = path.dirname(exportFile);
    if (!fs.existsSync(exportFolder)) {
        fs.mkdirSync(exportFolder, { recursive: true });
    }

    const client = new IdentityNowClient(tenantName);
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `Exporting script from rule ${ruleName}...`,
        cancellable: true
    }, async (task, token) => {

        const rule = await client.getConnectorRuleById(ruleId);
        if (!rule) {
            console.error(`Rule not found:  tenantName=${tenantName}, ruleId=${ruleId}`);
            throw new Error(`Rule not found:  tenantName=${tenantName}, ruleId=${ruleId}`);
        }
        if (token.isCancellationRequested) {
            return;
        }

        fs.writeFileSync(exportFile as string, rule.sourceCode?.script ?? '', { encoding: "utf8" });
        let document = await vscode.workspace.openTextDocument(vscode.Uri.file(exportFile as string));
        await vscode.window.showTextDocument(document, { preview: true });
        vscode.window.showInformationMessage(`Successfully exported script from rule ${ruleName}`);
    });
}