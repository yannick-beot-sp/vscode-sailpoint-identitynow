import * as vscode from 'vscode';
import { RuleTreeItem } from "../../models/ISCTreeItem";
import { openPreview } from '../../utils/vsCodeHelpers';

/**
 * Command used to open a source or a transform
 */
export class OpenScriptCommand {

    async execute(node?: RuleTreeItem): Promise<void> {

        console.log("> OpenScriptCommand.execute", node);
        const newPath = node.uri.path.replace("/connector-rules/", "/connector-rule-script/")
        const newUri = node.uri.with({ path: newPath })
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Opening Rule...',
            cancellable: false
        }, async () => {
            await openPreview(newUri, 'java')
        });
    }
}
