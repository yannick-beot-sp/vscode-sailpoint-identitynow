import * as vscode from 'vscode';
import { CloudRuleTreeItem } from "../../models/ISCTreeItem";
import { openPreview } from '../../utils/vsCodeHelpers';

export class CloudRuleOpenScriptCommand {

    async execute(node?: CloudRuleTreeItem): Promise<void> {
        if (node === undefined || !(node instanceof CloudRuleTreeItem)) {
            throw new Error('CloudRuleOpenScriptCommand: invalid item');
        }

        const newPath = node.uri.path.replace("/cloud-rules/", "/cloud-rule-script/");
        const newUri = node.uri.with({ path: newPath });

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Opening cloud rule script...',
            cancellable: false
        }, async () => {
            await openPreview(newUri, 'java');
        });
    }
}
