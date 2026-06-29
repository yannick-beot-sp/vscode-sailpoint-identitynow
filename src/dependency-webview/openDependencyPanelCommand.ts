import * as vscode from 'vscode';
import { IdentityAttributeTreeItem, isIdentityAttributeTreeItem, isSourceTreeItem, isTransformTreeItem, SourceTreeItem, TransformTreeItem } from "../models/ISCTreeItem";
import { DependencyPanel } from './DependencyPanel';

/**
 * Command used to open the dependency graph panel
 */
export class OpenDependencyPanelCommand {
    constructor(readonly extensionUri: vscode.Uri) {
    }

    async execute(node: IdentityAttributeTreeItem | TransformTreeItem | SourceTreeItem): Promise<void> {
        if (isTransformTreeItem(node)) {
            DependencyPanel.createOrShow(
                this.extensionUri,
                node.tenantId,
                node.tenantName,
                node.tenantDisplayName,
                node.contextValue,
                node.id!,
                node.label as string,
                node.label as string);
        } else if (isIdentityAttributeTreeItem(node)) {
            DependencyPanel.createOrShow(
                this.extensionUri,
                node.tenantId,
                node.tenantName,
                node.tenantDisplayName,
                node.contextValue,
                node.id!,
                node.resourceId,
                node.label as string);
        } else if (isSourceTreeItem(node)) {
            // Source contextValue is connector-specific (e.g. "JDBCsource"), so use a fixed resourceType instead.
            DependencyPanel.createOrShow(
                this.extensionUri,
                node.tenantId,
                node.tenantName,
                node.tenantDisplayName,
                "source",
                node.id!,
                node.label as string,
                node.label as string);
        }
    }
}
