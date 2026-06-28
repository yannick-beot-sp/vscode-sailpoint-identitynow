import * as vscode from 'vscode';
import { IdentityAttributeTreeItem } from "../models/ISCTreeItem";
import { DependencyPanel } from './DependencyPanel';

/**
 * Command used to open the dependency graph panel
 */
export class OpenDependencyPanelCommand {
    constructor(readonly extensionUri: vscode.Uri) {
    }

    async execute(node: IdentityAttributeTreeItem): Promise<void> {
        DependencyPanel.createOrShow(
            this.extensionUri,
            node.tenantId,
            node.tenantName,
            "identity-attribute",
            node.resourceId,
            node.label as string);
    }
}
