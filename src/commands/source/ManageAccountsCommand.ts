import * as vscode from "vscode";
import { SourceTreeItem } from "../../models/ISCTreeItem.js";
import { AccountsPanel } from "./AccountsPanel.js";

/**
 * Opens the "Manage accounts" panel for a source
 */
export class ManageAccountsCommand {
	constructor(private readonly extensionUri: vscode.Uri) { }

	async execute(node?: SourceTreeItem): Promise<void> {
		console.log("> ManageAccountsCommand.execute");
		if (node === undefined) {
			return;
		}
		await AccountsPanel.createOrShow(this.extensionUri, node);
	}
}
